import React, { useState, useEffect } from 'react';
import { X, Map, List } from 'lucide-react';
import TrainTracker from './TrainTracker';

interface TrainTrackerPopupProps {
  showTrainTracker: boolean;
  handleCloseTrainTracker: () => void;
  trainData: {
    trainNumber: string;
    dateOfJourney: string;
  } | null;
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
            <IndianRailwayMap 
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

// Indian Railway Map using OpenStreetMap
const IndianRailwayMap: React.FC<{trainNumber: string, dateOfJourney: string}> = ({ trainNumber, dateOfJourney }) => {
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [trainRoute, setTrainRoute] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!isMapLoaded) return;

    // Simulate fetching train route data
    const fetchTrainRoute = async () => {
      setIsLoading(true);
      try {
        // In a real application, you would fetch actual data from a train API
        // For this example, we'll use mock data for a common Indian train route
        
        // Simulating API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data for Delhi to Mumbai route
        const mockTrainRoute = {
          trainName: "Rajdhani Express",
          trainNumber,
          currentLocation: { lat: 22.1, lng: 77.4 }, // Somewhere in central India
          stations: [
            { name: "New Delhi", lat: 28.6448, lng: 77.2167, arrivalTime: "17:00", departureTime: "17:15", status: "departed" },
            { name: "Mathura Junction", lat: 27.4924, lng: 77.6737, arrivalTime: "19:20", departureTime: "19:22", status: "departed" },
            { name: "Kota Junction", lat: 25.1793, lng: 75.8444, arrivalTime: "22:45", departureTime: "22:50", status: "departed" },
            { name: "Ratlam Junction", lat: 23.3315, lng: 75.0376, arrivalTime: "02:47", departureTime: "02:52", status: "in transit" },
            { name: "Vadodara Junction", lat: 22.3072, lng: 73.1812, arrivalTime: "05:45", departureTime: "05:50", status: "upcoming" },
            { name: "Mumbai Central", lat: 18.9712, lng: 72.8193, arrivalTime: "08:35", departureTime: "-", status: "upcoming" }
          ]
        };
        
        setTrainRoute(mockTrainRoute);
        setIsLoading(false);
      } catch (err) {
        setError("Failed to load train route data. Please try again later.");
        setIsLoading(false);
      }
    };
    
    fetchTrainRoute();
  }, [isMapLoaded, trainNumber]);

  useEffect(() => {
    if (!isMapLoaded || !trainRoute || isLoading) return;
    
    // Initialize map once data is loaded
    const L = window.L;
    const mapContainer = document.getElementById('train-map');
    
    if (!mapContainer || !L) return;
    
    // Create map centered on India (roughly centered)
    const map = L.map('train-map').setView([22.5937, 78.9629], 5);
    
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
      } else if (station.status === 'in transit') {
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
      
      // Station circle
      L.circle([station.lat, station.lng], {
        radius: 10000, // 10km
        fillColor: circleColor,
        color: markerColor,
        weight: 1,
        opacity: 0.5,
        fillOpacity: 0.5
      }).addTo(map);
      
      // Popup with station info
      marker.bindPopup(`
        <strong>${station.name}</strong><br>
        Arrival: ${station.arrivalTime}<br>
        Departure: ${station.departureTime}<br>
        Status: ${station.status}
      `);
    });
    
    // Add train current location marker
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
        <p className="text-gray-600">Train #{trainNumber} • {dateOfJourney}</p>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-80">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-forest-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Loading map data...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-600">{error}</p>
          <button 
            className="mt-2 px-4 py-2 bg-forest-600 text-white rounded-lg hover:bg-forest-700 transition"
            onClick={() => setIsLoading(true)}
          >
            Retry
          </button>
        </div>
      ) : (
        <div id="train-map" className="h-96 w-full rounded-lg shadow-md border border-gray-200"></div>
      )}
      
      {/* Train info and legend */}
      {!isLoading && !error && trainRoute && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="font-semibold text-forest-700 mb-2">Train Information</h4>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Train Name:</span> {trainRoute.trainName}<br />
              <span className="font-medium">Train Number:</span> {trainNumber}<br />
              <span className="font-medium">Journey Date:</span> {dateOfJourney}
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
                <span>Current/Next Station</span>
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
    </div>
  );
};

export default TrainTrackerPopup;