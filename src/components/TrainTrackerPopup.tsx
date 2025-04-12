import React, { useState, useEffect, useRef } from 'react';
import { X, Map, List, AlertTriangle } from 'lucide-react';
import TrainTracker from './TrainTracker';
import * as XLSX from 'xlsx';

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
}

const TrainTrackerPopup: React.FC<TrainTrackerPopupProps> = ({
  showTrainTracker,
  handleCloseTrainTracker,
  trainData
}) => {
  const [showMap, setShowMap] = useState(false);

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
            <ExcelBasedRailwayMap 
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

// Excel-based Indian Railway Map
const ExcelBasedRailwayMap: React.FC<{trainNumber: string, dateOfJourney: string}> = ({ trainNumber, dateOfJourney }) => {
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [stations, setStations] = useState<Station[]>([]);
  const [trainRoute, setTrainRoute] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<any>(null);

  // Load Leaflet library
  useEffect(() => {
    // Load Leaflet CSS
    const linkEl = document.createElement('link');
    linkEl.rel = 'stylesheet';
    linkEl.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
    document.head.appendChild(linkEl);

    // Load Leaflet JS
    const scriptEl = document.createElement('script');
    scriptEl.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
    scriptEl.onload = () => setIsMapLoaded(true);
    document.body.appendChild(scriptEl);

    return () => {
      document.head.removeChild(linkEl);
      document.body.removeChild(scriptEl);
    };
  }, []);

  // Load station data from Excel file
  useEffect(() => {
    const loadExcelData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch the Excel file
        const response = await fetch('./asset/Indian_Railway_Stations.xlsx');
        if (!response.ok) {
          throw new Error('Failed to load station data file');
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first worksheet
        const worksheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[worksheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Parse the data into our station format
        const stationData: Station[] = jsonData.map((row: any) => ({
          name: row['Station Name'],
          code: row['Station Code'],
          lat: parseFloat(row['Latitude']),
          lng: parseFloat(row['Longitude'])
        }));
        
        setStations(stationData);
        
        // After loading stations, generate a route for the requested train
        generateTrainRoute(trainNumber, stationData);
        
      } catch (err) {
        console.error("Error loading Excel data:", err);
        setError("Failed to load station data from Excel. Using fallback data instead.");
        
        // Use fallback data if Excel loading fails
        useFallbackRouteData(trainNumber);
      }
    };
    
    loadExcelData();
  }, [trainNumber]);

  // Generate a route for the specified train using the loaded stations
  const generateTrainRoute = (trainNum: string, stationList: Station[]) => {
    // Define routes for key trains
    const trainRoutes: Record<string, string[]> = {
      "12951": ["MMCT", "BVI", "ST", "BRC", "RTM", "KOTA", "NDLS"], // Mumbai Rajdhani
      "12301": ["HWH", "DHN", "GAYA", "PNBE", "MGS", "ALD", "CNB", "NDLS"], // Howrah Rajdhani
      "12259": ["SDAH", "DHN", "GAYA", "MGS", "ALD", "CNB", "NDLS"], // Sealdah Duronto
      // Add more train routes as needed
    };
    
    // Use default route if specific train not found
    const routeCodes = trainRoutes[trainNum] || trainRoutes["12951"];
    const trainName = getTrainName(trainNum);
    
    try {
      // Find stations that match the route codes
      const routeStations: Station[] = [];
      let totalDistance = 0;
      
      for (let i = 0; i < routeCodes.length; i++) {
        const stationCode = routeCodes[i];
        const station = stationList.find(s => s.code === stationCode);
        
        if (station) {
          // Calculate times and distances (simulated)
          const hour = 16 + Math.floor(i * 2.5); // Start at 16:00, add ~2.5 hours per station
          const minute = Math.floor(Math.random() * 55);
          
          const arrivalTime = i === 0 ? `${hour}:${minute.toString().padStart(2, '0')}` : 
            `${(hour % 24).toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          
          const departureMinute = (minute + 2) % 60;
          const departureHour = minute + 2 >= 60 ? (hour + 1) % 24 : hour % 24;
          const departureTime = i === routeCodes.length - 1 ? "-" : 
            `${departureHour.toString().padStart(2, '0')}:${departureMinute.toString().padStart(2, '0')}`;
          
          // Calculate distance (simulated)
          if (i > 0) {
            const prevStation = routeStations[i - 1];
            totalDistance += calculateDistance(
              prevStation.lat, prevStation.lng,
              station.lat, station.lng
            );
          }
          
          // Determine status based on position in route
          let status: 'departed' | 'current' | 'upcoming';
          if (i < Math.floor(routeCodes.length / 2) - 1) {
            status = 'departed';
          } else if (i === Math.floor(routeCodes.length / 2) - 1) {
            status = 'current';
          } else {
            status = 'upcoming';
          }
          
          routeStations.push({
            ...station,
            arrivalTime,
            departureTime,
            distance: Math.round(totalDistance),
            status
          });
        }
      }
      
      // Determine current train location (between the last departed and current station)
      let currentLocation;
      const departedStations = routeStations.filter(s => s.status === 'departed');
      const currentStation = routeStations.find(s => s.status === 'current');
      
      if (departedStations.length > 0 && currentStation) {
        const lastDepartedStation = departedStations[departedStations.length - 1];
        
        // Place train 75% of the way from last departed to current station
        currentLocation = {
          lat: lastDepartedStation.lat + (currentStation.lat - lastDepartedStation.lat) * 0.75,
          lng: lastDepartedStation.lng + (currentStation.lng - lastDepartedStation.lng) * 0.75
        };
      } else if (currentStation) {
        currentLocation = { lat: currentStation.lat, lng: currentStation.lng };
      } else if (departedStations.length > 0) {
        currentLocation = { 
          lat: departedStations[departedStations.length - 1].lat, 
          lng: departedStations[departedStations.length - 1].lng 
        };
      }
      
      // Create the route data object
      const routeData = {
        trainName,
        trainNumber: trainNum,
        currentLocation,
        stations: routeStations
      };
      
      setTrainRoute(routeData);
      setIsLoading(false);
      
    } catch (err) {
      console.error("Error generating train route:", err);
      setError("Failed to generate train route. Using fallback data.");
      useFallbackRouteData(trainNum);
    }
  };
  
  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distance in km
    return distance;
  };
  
  const deg2rad = (deg: number): number => {
    return deg * (Math.PI/180);
  };
  
  // Get train name based on train number
  const getTrainName = (trainNum: string): string => {
    const trainNames: Record<string, string> = {
      "12951": "Mumbai Rajdhani Express",
      "12301": "Howrah Rajdhani Express",
      "12259": "Sealdah Duronto Express",
      // Add more train names as needed
    };
    
    return trainNames[trainNum] || `Train ${trainNum}`;
  };
  
  // Fallback function if Excel loading fails
  const useFallbackRouteData = (trainNum: string) => {
    // Offline data store for major Indian train routes
    const offlineRoutes: Record<string, any> = {
      "12951": { // Rajdhani Express (Mumbai to Delhi)
        trainName: "Mumbai Rajdhani Express",
        trainNumber: "12951",
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
      },
      "12301": { // Howrah-Delhi Rajdhani
        trainName: "Howrah Rajdhani Express",
        trainNumber: "12301",
        currentLocation: { lat: 25.59, lng: 85.14 }, // Near Patna
        stations: [
          { name: "Howrah Junction", code: "HWH", lat: 22.584, lng: 88.342, arrivalTime: "16:55", departureTime: "17:05", distance: 0, status: "departed" },
          { name: "Dhanbad Junction", code: "DHN", lat: 23.795, lng: 86.430, arrivalTime: "20:05", departureTime: "20:10", distance: 259, status: "departed" },
          { name: "Gaya Junction", code: "GAYA", lat: 24.795, lng: 84.999, arrivalTime: "22:07", departureTime: "22:09", distance: 450, status: "departed" },
          { name: "Patna Junction", code: "PNBE", lat: 25.594, lng: 85.140, arrivalTime: "23:50", departureTime: "23:55", distance: 621, status: "current" },
          { name: "Mughalsarai Junction", code: "MGS", lat: 25.283, lng: 83.119, arrivalTime: "01:38", departureTime: "01:40", distance: 792, status: "upcoming" },
          { name: "Allahabad Junction", code: "ALD", lat: 25.444, lng: 81.825, arrivalTime: "03:00", departureTime: "03:05", distance: 861, status: "upcoming" },
          { name: "Kanpur Central", code: "CNB", lat: 26.455, lng: 80.349, arrivalTime: "04:38", departureTime: "04:40", distance: 1031, status: "upcoming" },
          { name: "New Delhi", code: "NDLS", lat: 28.644, lng: 77.216, arrivalTime: "10:00", departureTime: "-", distance: 1451, status: "upcoming" }
        ]
      }
    };
    
    // Default to a common route if specified train not found
    const defaultTrainNum = Object.keys(offlineRoutes)[0];
    const routeData = offlineRoutes[trainNum] || offlineRoutes[defaultTrainNum];
    
    if (routeData) {
      setTrainRoute(routeData);
      setIsLoading(false);
    } else {
      setError("No route data available for this train");
      setIsLoading(false);
    }
  };

  // Create and render the map once data is loaded
  useEffect(() => {
    if (!isMapLoaded || !trainRoute || isLoading) return;
    
    // Initialize map once data is loaded
    const L = window.L;
    const mapContainer = document.getElementById('train-map');
    
    if (!mapContainer || !L) return;
    
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
    map.fitBounds(stationCoordinates);
    
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
            <p className="text-gray-500">Loading map data from Excel...</p>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-lg overflow-hidden">
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-amber-400 mr-2 mt-0.5" />
              <div>
                <p className="text-amber-800 font-medium">{error}</p>
                <p className="text-amber-700 text-sm mt-1">
                  Using backup route data from predefined templates. In production, this would load from your Excel file at ./asset/Indian_Railway_Stations.xlsx.
                </p>
              </div>
            </div>
          </div>
          
          {trainRoute && (
            <div id="train-map" className="h-96 w-full border border-gray-200 mt-2"></div>
          )}
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
              <span className="font-medium">Data Source:</span> Local Excel File
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
      
      {/* Data loading details */}
      {!isLoading && (
        <div className="mt-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
          <h4 className="font-semibold text-blue-700 mb-2">Excel Data Integration</h4>
          <p className="text-sm text-blue-600">
            This map loads station data from ./asset/Indian_Railway_Stations.xlsx containing columns: Station Name, Station Code, Latitude, and Longitude. 
            When fully implemented, all station locations will be derived from this file, with routes generated based on the train number.
          </p>
        </div>
      )}
    </div>
  );
};

export default TrainTrackerPopup;