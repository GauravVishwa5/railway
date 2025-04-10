import React, { useState } from 'react';
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
            <div className="p-4">
              <TrainMapView 
                trainNumber={trainData.trainNumber}
                dateOfJourney={trainData.dateOfJourney}
              />
            </div>
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

// This component would need to be implemented to show the train route on a map
const TrainMapView: React.FC<{trainNumber: string, dateOfJourney: string}> = ({ trainNumber, dateOfJourney }) => {
  return (
    <div className="bg-gray-100 rounded-lg p-4 min-h-[400px] flex flex-col items-center justify-center">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-forest-700 mb-2">Train Route Map</h3>
        <p className="text-gray-600">Train #{trainNumber} • {dateOfJourney}</p>
      </div>
      
      {/* Placeholder for the actual map implementation */}
      <div className="w-full bg-white rounded-lg shadow-md p-4 h-80 flex items-center justify-center border border-gray-200">
        <div className="text-center">
          <Map className="w-16 h-16 mx-auto text-forest-500 opacity-50 mb-4" />
          <p className="text-gray-500 mb-2">Map showing train route would appear here</p>
          <p className="text-sm text-gray-400">
            This would typically integrate with a mapping API like Google Maps or Mapbox, 
            showing stations and the current train location
          </p>
        </div>
      </div>
    </div>
  );
};

export default TrainTrackerPopup;