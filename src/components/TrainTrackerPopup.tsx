import React, { useState, useEffect, useRef } from 'react';
import { X, Map, List, AlertTriangle } from 'lucide-react';
import TrainTracker from './TrainTracker';

interface TrainTrackerPopupProps {
  showTrainTracker: boolean;
  handleCloseTrainTracker: () => void;
  trainData: {
    trainNumber: string;
    dateOfJourney: string;
  } | null;
}

interface Station {
  name: string;
  code: string;
  lat: number;
  lng: number;
  arrivalTime?: string;
  departureTime?: string;
  distance?: number;
  status?: 'departed' | 'current' | 'upcoming';
  dayCount?: string;
  coordinates?: string;
}

interface StationApiResponse {
  success: boolean;
  data: {
    'Station Name': string;
    'Station Code': string;
    Latitude: number;
    Longitude: number;
  };
}

const stationsCache: Record<string, Station> = {};

const TrainTrackerPopup: React.FC<TrainTrackerPopupProps> = ({
  showTrainTracker,
  handleCloseTrainTracker,
  trainData
}) => {
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    if (!window.L) {
      loadLeaflet();
    }
  }, []);

  const loadLeaflet = () => {
    if (document.querySelector('link[href*="leaflet.min.css"]') || 
        document.querySelector('script[src*="leaflet.min.js"]')) {
      return;
    }
    
    const linkEl = document.createElement('link');
    linkEl.rel = 'stylesheet';
    linkEl.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
    document.head.appendChild(linkEl);

    const scriptEl = document.createElement('script');
    scriptEl.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
    document.body.appendChild(scriptEl);
  };

  if (!showTrainTracker || !trainData) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden animate-slide-up">
        <div className="bg-forest-700 text-white p-4 relative">
          <button
            onClick={handleCloseTrainTracker}
            className="absolute right-4 top-4 rounded-full hover:bg-forest-600 p-1.5 transition duration-300"
          >
            <X className="w-5 h-5" />
          </button>
          <h3 className="font-bold text-xl">Train Live Tracker</h3>
          <p className="text-forest-100 text-sm">Track the location and schedule of your train</p>
          
          <div className="absolute right-16 top-4 flex items-center space-x-2 bg-forest-600 rounded-full p-1">
            <button 
              className={`p-1.5 rounded-full transition duration-300 flex items-center ${!showMap ? 'bg-forest-500 text-white' : 'text-forest-200 hover:bg-forest-600'}`}
              onClick={() => setShowMap(false)}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
            <button 
              className={`p-1.5 rounded-full transition duration-300 flex items-center ${showMap ? 'bg-forest-500 text-white' : 'text-forest-200 hover:bg-forest-600'}`}
              onClick={() => setShowMap(true)}
              title="Map View"
            >
              <Map className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="overflow-auto max-h-[calc(90vh-120px)]">
          {showMap ? (
            <EnhancedRailwayMap 
              trainNumber={trainData.trainNumber}
              dateOfJourney={trainData.dateOfJourney}
            />
          ) : (
            <TrainTracker
              pnrData={{
                trainNumber: trainData.trainNumber,
                dateOfJourney: trainData.dateOfJourney
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const EnhancedRailwayMap: React.FC<{trainNumber: string, dateOfJourney: string}> = ({ trainNumber, dateOfJourney }) => {
  const [isMapLoaded, setIsMapLoaded] = useState(!!window.L);
  const [trainRoute, setTrainRoute] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const mapRef = useRef<any>(null);
  const [fallbackUsed, setFallbackUsed] = useState(false);

  useEffect(() => {
    if (window.L) {
      setIsMapLoaded(true);
      return;
    }
    
    const checkLeafletLoaded = setInterval(() => {
      if (window.L) {
        setIsMapLoaded(true);
        clearInterval(checkLeafletLoaded);
      }
    }, 100);
    
    return () => clearInterval(checkLeafletLoaded);
  }, []);

  useEffect(() => {
    if (isMapLoaded) {
      fetchAndGenerateTrainRoute(trainNumber);
    }
  }, [isMapLoaded, trainNumber]);

  const fetchAndGenerateTrainRoute = async (trainNum: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      const storageKey = `train_${trainNum}_data`;
      const cachedData = localStorage.getItem(storageKey);
      
      if (cachedData) {
        try {
          const parsedData = JSON.parse(cachedData);
          if (parsedData.timestamp && (Date.now() - parsedData.timestamp < 3600000)) {
            setTrainRoute(parsedData.routeData);
            setIsLoading(false);
            return;
          }
        } catch (e) {
          console.warn("Invalid cached data:", e);
        }
      }
      
      const trainDetailsResponse = await fetch(`https://train-tracker-api.onrender.com/api/train/${trainNum}`);
      const trainDetailsData = await trainDetailsResponse.json();
      
      if (!trainDetailsData || !trainDetailsData.success || !trainDetailsData.data) {
        throw new Error("Failed to fetch train details");
      }
      
      const stations = trainDetailsData.data.stations || [];
      
      if (!stations || stations.length === 0) {
        throw new Error("No station information found for this train");
      }
      
      const enrichedStations = stations.map((station: any) => {
        let lat = 0;
        let lng = 0;
        
        // Parse coordinates if available
        if (station.coordinates) {
          const [latitude, longitude] = station.coordinates.split(',').map(coord => parseFloat(coord.trim()));
          lat = latitude;
          lng = longitude;
        }
        
        // If coordinates not provided, use station API to fetch them
        if (!lat || !lng) {
          // Default to lookup from cache or fetch later
          if (stationsCache[station.stationCode]) {
            lat = stationsCache[station.stationCode].lat;
            lng = stationsCache[station.stationCode].lng;
          }
        }
        
        // Determine status based on current time and arrival/departure times
        const now = new Date();
        const departureTime = station.departureTime ? station.departureTime.substring(0, 5) : "--";
        const arrivalTime = station.arrivalTime ? station.arrivalTime.substring(0, 5) : "--";
        
        let status: 'departed' | 'current' | 'upcoming' = 'upcoming';
        
        // Simple logic to determine status - can be enhanced with actual journey date comparison
        const stationIndex = parseInt(station.seq);
        const totalStations = stations.length;
        
        if (stationIndex < totalStations / 3) {
          status = 'departed';
        } else if (stationIndex < totalStations / 2) {
          status = 'current';
        } else {
          status = 'upcoming';
        }
        
        return {
          name: station.stationName,
          code: station.stationCode,
          lat,
          lng,
          arrivalTime,
          departureTime,
          distance: parseInt(station.distance) || 0,
          status,
          dayCount: station.dayCount || "1",
          coordinates: station.coordinates
        };
      });
      
      // For stations missing coordinates, fetch them
      const stationsNeedingCoordinates = enrichedStations.filter(station => !station.lat || !station.lng);
      
      if (stationsNeedingCoordinates.length > 0) {
        const fetchPromises = stationsNeedingCoordinates.map(station => {
          return fetch(`https://train-tracker-api.onrender.com/api/stations/${station.code}`)
            .then(response => response.json())
            .then((stationData: StationApiResponse) => {
              if (stationData && stationData.success && stationData.data) {
                const stationWithCoords = {
                  lat: stationData.data.Latitude,
                  lng: stationData.data.Longitude,
                  code: station.code
                };
                
                stationsCache[station.code] = {
                  ...station,
                  lat: stationWithCoords.lat,
                  lng: stationWithCoords.lng
                };
                
                return stationWithCoords;
              }
              throw new Error(`Invalid data for station ${station.code}`);
            })
            .catch(err => {
              console.warn(`Failed to fetch data for station ${station.code}:`, err);
              return {
                code: station.code,
                lat: 0,
                lng: 0
              };
            });
        });
        
        const fetchedCoordinates = await Promise.all(fetchPromises);
        
        fetchedCoordinates.forEach(coords => {
          if (coords.lat && coords.lng) {
            const stationToUpdate = enrichedStations.find(s => s.code === coords.code);
            if (stationToUpdate) {
              stationToUpdate.lat = coords.lat;
              stationToUpdate.lng = coords.lng;
            }
          }
        });
      }
      
      // Filter out stations without valid coordinates
      const validStations = enrichedStations.filter(station => station.lat && station.lng);
      
      if (validStations.length === 0) {
        throw new Error("Could not retrieve coordinates for any station");
      }
      
      // Determine current train location
      const currentLocation = determineCurrentTrainLocation(validStations);
      
      // Extract train name
      const trainName = trainDetailsData.data.trainName || `Train ${trainNum}`;
      
      const routeData = {
        trainName,
        trainNumber: trainNum,
        currentLocation,
        stations: validStations
      };
      
      try {
        localStorage.setItem(storageKey, JSON.stringify({
          routeData,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.warn("Failed to cache train data:", e);
      }
      
      setTrainRoute(routeData);
      setFallbackUsed(false);
    } catch (err) {
      console.error("Error generating train route:", err);
      setErrorMessage(err instanceof Error ? err.message : "Failed to load train route");
      
      // Use manually specified coordinates example as fallback
      const fallbackRoute = {
        trainName: `Train ${trainNum}`,
        trainNumber: trainNum,
        currentLocation: { lat: 16.703, lng: 74.238 }, // Using KOP coordinates
        stations: [
          { name: "CHHATRAPATI", code: "KOP", lat: 16.703, lng: 74.238, arrivalTime: "17:45", departureTime: "17:45", distance: 978, status: "current", dayCount: "1" }
        ]
      };
      
      setTrainRoute(fallbackRoute);
      setFallbackUsed(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  const determineCurrentTrainLocation = (stations: Station[]): {lat: number, lng: number} | null => {
    const departedStations = stations.filter(s => s.status === 'departed');
    const currentStation = stations.find(s => s.status === 'current');
    
    if (departedStations.length > 0 && currentStation) {
      const lastDepartedStation = departedStations[departedStations.length - 1];
      
      return {
        lat: lastDepartedStation.lat + (currentStation.lat - lastDepartedStation.lat) * 0.75,
        lng: lastDepartedStation.lng + (currentStation.lng - lastDepartedStation.lng) * 0.75
      };
    } else if (currentStation) {
      return { lat: currentStation.lat, lng: currentStation.lng };
    } else if (departedStations.length > 0) {
      return { 
        lat: departedStations[departedStations.length - 1].lat, 
        lng: departedStations[departedStations.length - 1].lng 
      };
    }
    
    return stations.length > 0 ? { lat: stations[0].lat, lng: stations[0].lng } : null;
  };

  useEffect(() => {
    if (!isMapLoaded || !trainRoute || isLoading || !window.L) return;
    
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }
    
    const L = window.L;
    const mapContainer = document.getElementById('train-map');
    
    if (!mapContainer) return;
    
    const map = L.map('train-map').setView([20.5937, 78.9629], 5);
    mapRef.current = map;
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    const stationCoordinates = trainRoute.stations
      .filter((station: Station) => station.lat && station.lng)
      .map((station: Station) => [station.lat, station.lng]);
    
    if (stationCoordinates.length > 1) {
      L.polyline(stationCoordinates, { color: 'blue', weight: 3 }).addTo(map);
    }
    
    trainRoute.stations.forEach((station: Station) => {
      if (!station.lat || !station.lng) return;
      
      let markerColor;
      let circleColor;
      
      if (station.status === 'departed') {
        markerColor = 'green';
        circleColor = 'rgba(0, 128, 0, 0.2)';
      } else if (station.status === 'current') {
        markerColor = 'orange';
        circleColor = 'rgba(255, 165, 0, 0.2)';
      } else {
        markerColor = 'gray';
        circleColor = 'rgba(128, 128, 128, 0.2)';
      }
      
      const marker = L.circleMarker([station.lat, station.lng], {
        radius: 6,
        fillColor: markerColor,
        color: 'white',
        weight: 2,
        opacity: 1,
        fillOpacity: 1
      }).addTo(map);
      
      if (station.status === 'current') {
        L.circle([station.lat, station.lng], {
          radius: 10000,
          fillColor: circleColor,
          color: markerColor,
          weight: 1,
          opacity: 0.5,
          fillOpacity: 0.5
        }).addTo(map);
      }
      
      marker.bindPopup(`
        <strong>${station.name}</strong> (${station.code})<br>
        ${station.distance} km from origin<br>
        ${station.arrivalTime !== "--" ? `Arrival: ${station.arrivalTime}<br>` : ''}
        ${station.departureTime !== "--" ? `Departure: ${station.departureTime}<br>` : ''}
        ${station.coordinates ? `Coordinates: ${station.coordinates}<br>` : ''}
        Status: ${station.status.charAt(0).toUpperCase() + station.status.slice(1)}
      `);
    });
    
    if (trainRoute.currentLocation) {
      const trainIcon = L.divIcon({
        html: '<div style="background-color: red; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>',
        className: 'train-icon',
        iconSize: [12, 12]
      });
      
      L.marker([trainRoute.currentLocation.lat, trainRoute.currentLocation.lng], { icon: trainIcon })
        .addTo(map)
        .bindPopup(`<strong>${trainRoute.trainName}</strong><br>Currently in transit`);
      
      L.circle([trainRoute.currentLocation.lat, trainRoute.currentLocation.lng], {
        radius: 20000,
        fillColor: 'rgba(255, 0, 0, 0.2)',
        color: 'red',
        weight: 1,
        opacity: 0.7,
        fillOpacity: 0.5
      }).addTo(map);
    }
    
    if (stationCoordinates.length > 0) {
      map.fitBounds(stationCoordinates);
    }
    
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, [isMapLoaded, trainRoute, isLoading]);

  return (
    <div className="p-4">
      <div className="text-center mb-4">
        <h3 className="text-xl font-semibold text-forest-700 mb-2">Train Route Map</h3>
        <p className="text-gray-600">
          Train #{trainNumber} • {dateOfJourney}
          {trainRoute && ` • ${trainRoute.trainName}`}
        </p>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-80">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-forest-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Loading map data...</p>
            <p className="text-xs text-gray-400 mt-2">Fetching station coordinates</p>
          </div>
        </div>
      ) : errorMessage ? (
        <div className="flex items-center justify-center h-80">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <p className="text-gray-700 font-medium mb-2">Error loading data</p>
            <p className="text-gray-500 text-sm">{errorMessage}</p>
          </div>
        </div>
      ) : (
        <div id="train-map" className="h-96 w-full rounded-lg shadow-md border border-gray-200"></div>
      )}
      
      {!isLoading && trainRoute && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="font-semibold text-forest-700 mb-2">Train Information</h4>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Train Name:</span> {trainRoute.trainName}<br />
              <span className="font-medium">Train Number:</span> {trainNumber}<br />
              <span className="font-medium">Journey Date:</span> {dateOfJourney}<br />
              <span className="font-medium">Total Distance:</span> {
                trainRoute.stations.length > 0 ? 
                trainRoute.stations[trainRoute.stations.length - 1].distance : 0
              } km<br />
              <span className="font-medium">Total Stations:</span> {trainRoute.stations.length}
            </p>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="font-semibold text-forest-700 mb-2">Map Legend</h4>
            <div className="text-sm space-y-2">
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
                <span>Departed Station</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-orange-500 mr-2"></div>
                <span>Current Station</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-gray-500 mr-2"></div>
                <span>Upcoming Station</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
                <span>Current Train Location</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {!isLoading && trainRoute && trainRoute.stations.length > 0 && (
        <div className="mt-4 bg-gray-50 p-3 rounded-lg">
          <h4 className="font-semibold text-forest-700 mb-2">Station List</h4>
          <div className="max-h-60 overflow-y-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-3 text-left">Station</th>
                  <th className="py-2 px-3 text-left">Code</th>
                  <th className="py-2 px-3 text-right">Distance</th>
                  <th className="py-2 px-3 text-right">Coordinates</th>
                </tr>
              </thead>
              <tbody>
                {trainRoute.stations.map((station: Station, index: number) => (
                  <tr key={station.code} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="py-2 px-3">{station.name}</td>
                    <td className="py-2 px-3">{station.code}</td>
                    <td className="py-2 px-3 text-right">{station.distance} km</td>
                    <td className="py-2 px-3 text-right">
                      {station.coordinates || `${station.lat.toFixed(4)}, ${station.lng.toFixed(4)}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

declare global {
  interface Window {
    L: any;
  }
}

export default TrainTrackerPopup;