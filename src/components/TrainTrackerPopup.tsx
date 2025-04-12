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

// Cache for stations data to avoid repeated API calls
const stationsCache: Record<string, Station> = {};

const TrainTrackerPopup: React.FC<TrainTrackerPopupProps> = ({
  showTrainTracker,
  handleCloseTrainTracker,
  trainData
}) => {
  const [showMap, setShowMap] = useState(false);

  // Preload Leaflet when component mounts, not just when map view is selected
  useEffect(() => {
    if (!window.L) {
      loadLeaflet();
    }
  }, []);

  // Load Leaflet library
  const loadLeaflet = () => {
    // Check if already loaded
    if (document.querySelector('link[href*="leaflet.min.css"]') || 
        document.querySelector('script[src*="leaflet.min.js"]')) {
      return;
    }
    
    // Load Leaflet CSS
    const linkEl = document.createElement('link');
    linkEl.rel = 'stylesheet';
    linkEl.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
    document.head.appendChild(linkEl);

    // Load Leaflet JS
    const scriptEl = document.createElement('script');
    scriptEl.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
    document.body.appendChild(scriptEl);
  };

  if (!showTrainTracker || !trainData) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="bg-forest-700 text-white p-4 relative">
          <button
            onClick={handleCloseTrainTracker}
            className="absolute right-4 top-4 rounded-full hover:bg-forest-600 p-1.5 transition duration-300"
          >
            <X className="w-5 h-5" />
          </button>
          <h3 className="font-bold text-xl">Train Live Tracker</h3>
          <p className="text-forest-100 text-sm">Track the location and schedule of your train</p>
          
          {/* Toggle Switch */}
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
        
        {/* Content - TrainTracker or Map View */}
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

// Enhanced Railway Map with API Integration
const EnhancedRailwayMap: React.FC<{trainNumber: string, dateOfJourney: string}> = ({ trainNumber, dateOfJourney }) => {
  const [isMapLoaded, setIsMapLoaded] = useState(!!window.L); // Check if already loaded
  const [trainRoute, setTrainRoute] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const mapRef = useRef<any>(null);
  const [fallbackUsed, setFallbackUsed] = useState(false);

  // Load Leaflet library if not loaded in parent component
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

  // Generate train route when component mounts or train number changes
  useEffect(() => {
    if (isMapLoaded) {
      fetchAndGenerateTrainRoute(trainNumber);
    }
  }, [isMapLoaded, trainNumber]);

  // Fetch station data from API and generate route - with improved parallel fetching
  const fetchAndGenerateTrainRoute = async (trainNum: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      // Check localStorage for cached train data
      const storageKey = `train_${trainNum}_data`;
      const cachedData = localStorage.getItem(storageKey);
      
      if (cachedData) {
        try {
          const parsedData = JSON.parse(cachedData);
          // Use cached data only if it's less than 1 hour old
          if (parsedData.timestamp && (Date.now() - parsedData.timestamp < 3600000)) {
            setTrainRoute(parsedData.routeData);
            setIsLoading(false);
            return;
          }
        } catch (e) {
          // Invalid cached data, continue with API fetch
          console.warn("Invalid cached data:", e);
        }
      }
      
      // First get train details to get the station list
      const trainDetailsResponse = await fetch(`https://train-tracker-api.onrender.com/api/train/${trainNum}`);
      const trainDetailsData = await trainDetailsResponse.json();
      
      if (!trainDetailsData || !trainDetailsData.success || !trainDetailsData.data) {
        throw new Error("Failed to fetch train details");
      }
      
      // Extract station codes from the train details
      const stationCodes = parseStationCodesFromTrainDetails(trainDetailsData.data.status);
      
      if (!stationCodes || stationCodes.length === 0) {
        throw new Error("No station information found for this train");
      }
      
      // Fetch coordinates for each station in parallel
      const fetchPromises = stationCodes.map(code => {
        // Check cache first
        if (stationsCache[code]) {
          return Promise.resolve(stationsCache[code]);
        }
        
        // Fetch from API if not in cache
        return fetch(`https://train-tracker-api.onrender.com/api/stations/${code}`)
          .then(response => response.json())
          .then((stationData: StationApiResponse) => {
            if (stationData && stationData.success && stationData.data) {
              const station = {
                name: stationData.data["Station Name"],
                code: stationData.data["Station Code"],
                lat: stationData.data.Latitude,
                lng: stationData.data.Longitude
              };
              // Cache the station data
              stationsCache[code] = station;
              return station;
            }
            throw new Error(`Invalid data for station ${code}`);
          })
          .catch(err => {
            console.warn(`Failed to fetch data for station ${code}:`, err);
            // Return null for failed stations
            return null;
          });
      });
      
      // Wait for all station data fetches to complete
      const stationsWithCoordinates = (await Promise.all(fetchPromises)).filter(Boolean) as Station[];
      
      if (stationsWithCoordinates.length === 0) {
        throw new Error("Could not retrieve coordinates for any station");
      }
      
      // Add additional information to stations
      const enrichedStations = enrichStationsWithTrainInfo(stationsWithCoordinates, trainDetailsData.data.status);
      
      // Extract train name
      const trainName = trainDetailsData.data.status.split('\n')[0] || getTrainName(trainNum);
      
      // Determine current location
      const currentLocation = determineCurrentTrainLocation(enrichedStations);
      
      // Create the route data object
      const routeData = {
        trainName,
        trainNumber: trainNum,
        currentLocation,
        stations: enrichedStations
      };
      
      // Cache the data in localStorage
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
      
      // Fall back to a simulated route when the API fails
      const fallbackRoute = getDefaultRoute(trainNum);
      setTrainRoute(fallbackRoute);
      setFallbackUsed(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Parse station codes from train details text
  const parseStationCodesFromTrainDetails = (statusText: string): string[] => {
    try {
      const lines = statusText.split('\n').filter(line => line.trim() && !line.includes('Show Satus') && !line.includes('PNR Status'));
      
      // Find the date line to determine where station info ends
      const dateLineIndex = lines.findIndex(line => 
        line.includes('-Apr') || line.includes('-May') || line.includes('-Jun') ||
        line.includes('-Jan') || line.includes('-Feb') || line.includes('-Mar') ||
        line.includes('-Jul') || line.includes('-Aug') || line.includes('-Sep') ||
        line.includes('-Oct') || line.includes('-Nov') || line.includes('-Dec')
      );
      
      // Get only station lines
      const stationLines = lines.slice(0, dateLineIndex !== -1 ? dateLineIndex : undefined);
      
      // Extract station codes
      return stationLines
        .filter(line => line.includes(' - '))
        .map(line => {
          const parts = line.split(' - ');
          return parts[parts.length - 1].trim();
        });
    } catch (error) {
      console.error('Error parsing station codes:', error);
      return [];
    }
  };
  
  // Add train-specific info to stations
  const enrichStationsWithTrainInfo = (stations: Station[], statusText: string): Station[] => {
    // Generate arrival/departure times and distances
    let totalDistance = 0;
    let currentDayCount = 1;
    
    return stations.map((station, index) => {
      // Calculate simulated times and distances
      let arrivalTime = "--";
      let departureTime = "--";
      let distance = 0;
      let haltTime = 5; // Default halt time in minutes
      
      if (index > 0) {
        // For non-origin stations, calculate arrival time
        const hourOffset = Math.floor(index * 1.5) % 24;
        const minuteOffset = (index * 15) % 60;
        arrivalTime = `${String(hourOffset).padStart(2, '0')}:${String(minuteOffset).padStart(2, '0')}`;
        
        // Calculate distance based on index and actual coordinates
        if (index > 0) {
          const prevStation = stations[index - 1];
          const legDistance = calculateDistance(
            prevStation.lat, prevStation.lng,
            station.lat, station.lng
          );
          totalDistance += legDistance;
        }
        
        // For non-terminal stations, calculate departure time
        if (index < stations.length - 1) {
          const arrHour = parseInt(arrivalTime.split(':')[0]);
          const arrMinute = parseInt(arrivalTime.split(':')[1]);
          
          const depMinute = (arrMinute + haltTime) % 60;
          const depHour = (arrHour + Math.floor((arrMinute + haltTime) / 60)) % 24;
          
          departureTime = `${String(depHour).padStart(2, '0')}:${String(depMinute).padStart(2, '0')}`;
        }
        
        // Change day count after midnight
        if (arrivalTime !== "--") {
          const hourAsInt = parseInt(arrivalTime.split(':')[0]);
          if (hourAsInt === 0 && parseInt(arrivalTime.split(':')[1]) < 30) {
            currentDayCount++;
          }
        }
      } else {
        // For origin station, only set departure time
        departureTime = "08:30";
      }
      
      // Determine status based on position in route
      let status: 'departed' | 'current' | 'upcoming';
      if (index < Math.floor(stations.length / 2) - 1) {
        status = 'departed';
      } else if (index === Math.floor(stations.length / 2) - 1) {
        status = 'current';
      } else {
        status = 'upcoming';
      }
      
      return {
        ...station,
        arrivalTime,
        departureTime,
        distance: Math.round(totalDistance),
        status,
        dayCount: currentDayCount.toString()
      };
    });
  };
  
  // Memoized distance calculation
  const distanceCache: Record<string, number> = {};
  
  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const cacheKey = `${lat1},${lon1}|${lat2},${lon2}`;
    if (distanceCache[cacheKey]) return distanceCache[cacheKey];
    
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distance in km
    
    distanceCache[cacheKey] = distance;
    return distance;
  };
  
  const deg2rad = (deg: number): number => {
    return deg * (Math.PI/180);
  };
  
  // Determine current train location based on station statuses
  const determineCurrentTrainLocation = (stations: Station[]): {lat: number, lng: number} | null => {
    const departedStations = stations.filter(s => s.status === 'departed');
    const currentStation = stations.find(s => s.status === 'current');
    
    if (departedStations.length > 0 && currentStation) {
      const lastDepartedStation = departedStations[departedStations.length - 1];
      
      // Place train 75% of the way from last departed to current station
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
    
    return null;
  };
  
  // Get train name based on train number
  const getTrainName = (trainNum: string): string => {
    const trainNames: Record<string, string> = {
      "12951": "Mumbai Rajdhani Express",
      "12301": "Howrah Rajdhani Express",
      "12259": "Sealdah Duronto Express",
      "12621": "Tamil Nadu Express",
      "12627": "Karnataka Express",
      "12841": "Coromandel Express",
      // Add more train names as needed
    };
    
    return trainNames[trainNum] || `Train ${trainNum}`;
  };
  
  // Get a default route if needed
  const getDefaultRoute = (trainNum: string): any => {
    return {
      trainName: getTrainName(trainNum),
      trainNumber: trainNum,
      currentLocation: { lat: 23.17, lng: 75.78 }, // Somewhere near Indore
      stations: [
        { name: "Mumbai Central", code: "MMCT", lat: 18.971, lng: 72.819, arrivalTime: "17:00", departureTime: "17:40", distance: 0, status: "departed" },
        { name: "Borivali", code: "BVI", lat: 19.231, lng: 72.854, arrivalTime: "18:15", departureTime: "18:17", distance: 34, status: "departed" },
        { name: "Surat", code: "ST", lat: 21.206, lng: 72.837, arrivalTime: "20:49", departureTime: "20:51", distance: 263, status: "departed" },
        { name: "Vadodara Junction", code: "BRC", lat: 22.307, lng: 73.181, arrivalTime: "22:35", departureTime: "22:40", distance: 392, status: "departed" },
        { name: "Ratlam Junction", code: "RTM", lat: 23.331, lng: 75.037, arrivalTime: "02:05", departureTime: "02:10", distance: 673, status: "current" },
        { name: "Kota Junction", code: "KOTA", lat: 25.179, lng: 75.844, arrivalTime: "04:35", departureTime: "04:37", distance: 881, status: "upcoming" },
        { name: "New Delhi", code: "NDLS", lat: 28.644, lng: 77.216, arrivalTime: "08:35", departureTime: "-", distance: 1384, status: "upcoming" }
      ]
    };
  };

  // Create and render the map once data is loaded
  useEffect(() => {
    if (!isMapLoaded || !trainRoute || isLoading || !window.L) return;
    
    // Clear any existing map
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }
    
    // Initialize map
    const L = window.L;
    const mapContainer = document.getElementById('train-map');
    
    if (!mapContainer) return;
    
    // Create map centered on India
    const map = L.map('train-map').setView([22.5937, 78.9629], 5);
    mapRef.current = map;
    
    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Add station markers and connect them with a line
    const stationCoordinates = trainRoute.stations.map((station: any) => [station.lat, station.lng]);
    
    // Create a polyline for the train route
    L.polyline(stationCoordinates, { color: 'blue', weight: 3 }).addTo(map);
    
    // Add station markers
    trainRoute.stations.forEach((station: any, index: number) => {
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
      
      // Station marker
      const marker = L.circleMarker([station.lat, station.lng], {
        radius: 6,
        fillColor: markerColor,
        color: 'white',
        weight: 2,
        opacity: 1,
        fillOpacity: 1
      }).addTo(map);
      
      // Only add circles to major stations to avoid clutter
      if (index === 0 || index === trainRoute.stations.length - 1 || station.status === 'current') {
        L.circle([station.lat, station.lng], {
          radius: 10000, // 10km
          fillColor: circleColor,
          color: markerColor,
          weight: 1,
          opacity: 0.5,
          fillOpacity: 0.5
        }).addTo(map);
      }
      
      // Popup with station info
      marker.bindPopup(`
        <strong>${station.name}</strong> (${station.code})<br>
        ${station.distance} km from origin<br>
        Arrival: ${station.arrivalTime}<br>
        Departure: ${station.departureTime}<br>
        Status: ${station.status.charAt(0).toUpperCase() + station.status.slice(1)}
      `);
    });
    
    // Add train current location marker if we have it
    if (trainRoute.currentLocation) {
      const trainIcon = L.divIcon({
        html: '<div style="background-color: red; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>',
        className: 'train-icon',
        iconSize: [12, 12]
      });
      
      L.marker([trainRoute.currentLocation.lat, trainRoute.currentLocation.lng], { icon: trainIcon })
        .addTo(map)
        .bindPopup(`<strong>${trainRoute.trainName}</strong><br>Currently in transit`);
      
      // Add a pulsing circle for current train location
      L.circle([trainRoute.currentLocation.lat, trainRoute.currentLocation.lng], {
        radius: 20000, // 20km
        fillColor: 'rgba(255, 0, 0, 0.2)',
        color: 'red',
        weight: 1,
        opacity: 0.7,
        fillOpacity: 0.5
      }).addTo(map);
    }
    
    // Fit map to show all stations
    if (stationCoordinates.length > 0) {
      map.fitBounds(stationCoordinates);
    }
    
    // Clean up on unmount
    return () => {
      map.remove();
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
            <p className="text-xs text-gray-400 mt-2">The first load might take a moment as we fetch station coordinates</p>
          </div>
        </div>
      ) : errorMessage ? (
        <div className="flex items-center justify-center h-80">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <p className="text-gray-700 font-medium mb-2">Error loading data</p>
            <p className="text-gray-500 text-sm">{errorMessage}</p>
            <p className="text-gray-400 text-xs mt-4">Showing simulated route instead</p>
          </div>
        </div>
      ) : (
        <div id="train-map" className="h-96 w-full rounded-lg shadow-md border border-gray-200"></div>
      )}
      
      {/* Train info and legend */}
      {!isLoading && trainRoute && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="font-semibold text-forest-700 mb-2">Train Information</h4>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Train Name:</span> {trainRoute.trainName}<br />
              <span className="font-medium">Train Number:</span> {trainNumber}<br />
              <span className="font-medium">Journey Date:</span> {dateOfJourney}<br />
              <span className="font-medium">Total Distance:</span> {
                trainRoute.stations[trainRoute.stations.length - 1].distance
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
      
      {/* API Integration info */}
      {!isLoading && (
        <div className="mt-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
          <h4 className="font-semibold text-blue-700 mb-2">API Integration</h4>
          <p className="text-sm text-blue-600">
            This map uses the Train Tracker API to fetch real station coordinates. For each station in the route, 
            we query the API to get the exact latitude and longitude for accurate positioning.
            {fallbackUsed && " Currently showing simulated data due to API unavailability."}
            {!fallbackUsed && " Station data is cached for faster future loading."}
          </p>
        </div>
      )}
    </div>
  );
};

// Add type declaration for window.L
declare global {
  interface Window {
    L: any;
  }
}

export default TrainTrackerPopup;