import React from 'react';
import { X } from 'lucide-react';
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
        </div>
        
        {/* TrainTracker Component */}
        <div className="overflow-auto max-h-[calc(90vh-120px)]">
          <TrainTracker 
            pnrData={{
              trainNumber: trainData.trainNumber,
              dateOfJourney: trainData.dateOfJourney
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default TrainTrackerPopup;