import React, { useState, useEffect } from 'react';
import { Ticket, Search, ArrowRight, History as HistoryIcon, X, Printer, Share2, MapPin, Train } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import TrainTracker from './TrainTracker';

interface PNRData {
  pnrNumber: string;
  trainNumber: string;
  trainName: string;
  dateOfJourney: string;
  sourceStation: string;
  destinationStation: string;
  journeyClass: string;
  chartStatus: string;
  boardingPoint: string;
  reservationUpto: string;
  arrivalDate?: string;
  numberOfpassenger: number;
  passengerList: {
    passengerSerialNumber: number;
    bookingStatus: string;
    bookingStatusDetails: string;
    currentStatus: string;
    currentStatusDetails: string;
    bookingBerthNo: number;
    passengerQuota: string;
  }[];
}

const PNRForm = () => {
  const [pnr, setPnr] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PNRData | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showTrainTracker, setShowTrainTracker] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    loadRecentSearches();
    
    return () => {
      // Clean up the style when component unmounts
      const printStyles = document.getElementById('print-styles');
      if (printStyles) {
        printStyles.remove();
      }
    };
  }, []);

  const loadRecentSearches = () => {
    try {
      const stored = localStorage.getItem('pnr_no');
      if (stored) {
        const parsed = JSON.parse(stored);
        setRecentSearches(Array.isArray(parsed) ? parsed : [parsed]);
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  };

  const savePNRToStorage = (newPnr: string) => {
    try {
      const updatedSearches = [newPnr, ...recentSearches.filter(p => p !== newPnr)].slice(0, 5);
      localStorage.setItem('pnr_no', JSON.stringify(updatedSearches));
      setRecentSearches(updatedSearches);
    } catch (error) {
      console.error('Error saving PNR:', error);
    }
  };

  const removePNRFromStorage = (pnrToRemove: string) => {
    try {
      const updatedSearches = recentSearches.filter(p => p !== pnrToRemove);
      localStorage.setItem('pnr_no', JSON.stringify(updatedSearches));
      setRecentSearches(updatedSearches);
    } catch (error) {
      console.error('Error removing PNR:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (pnr.length !== 10 || isNaN(Number(pnr))) {
      showToast('Please enter a valid 10-digit PNR number', 'error');
      return;
    }

    setLoading(true);
    savePNRToStorage(pnr);

    try {
      // For demo purposes, use the provided sample data
      if (pnr === '8524877966') {
        const sampleData = {
          pnrNumber: "8524877966",
          dateOfJourney: "Feb 9, 2025 11:30:05 AM",
          trainNumber: "11061",
          trainName: "LTT JAYNAGAR EXP",
          sourceStation: "LTT",
          destinationStation: "BSB",
          reservationUpto: "BSB",
          boardingPoint: "LTT",
          journeyClass: "SL",
          numberOfpassenger: 3,
          chartStatus: "Chart Not Prepared",
          arrivalDate: "Nov 30, 2024 12:25:05 PM",
          passengerList: [
            {
              passengerSerialNumber: 1,
              passengerQuota: "PQ",
              bookingStatus: "PQWL",
              bookingBerthNo: 35,
              bookingStatusDetails: "PQWL/35",
              currentStatus: "CAN",
              currentStatusDetails: "CAN"
            },
            {
              passengerSerialNumber: 2,
              passengerQuota: "PQ",
              bookingStatus: "PQWL",
              bookingBerthNo: 36,
              bookingStatusDetails: "PQWL/36",
              currentStatus: "CAN",
              currentStatusDetails: "CAN"
            },
            {
              passengerSerialNumber: 3,
              passengerQuota: "PQ",
              bookingStatus: "PQWL",
              bookingBerthNo: 37,
              bookingStatusDetails: "PQWL/37",
              currentStatus: "CAN",
              currentStatusDetails: "CAN"
            }
          ]
        };
        
        setResult(sampleData);
        localStorage.setItem('lastPNRData', JSON.stringify({
          pnr,
          data: sampleData,
          timestamp: new Date().getTime()
        }));
      } else {
        // For other PNR numbers, proceed with the API call
        const response = await fetch(
          `https://irctc-indian-railway-pnr-status.p.rapidapi.com/getPNRStatus/${pnr}`,
          {
            headers: {
              'x-rapidapi-key': '9aa9a6917cmsh428479b7a93cb56p190dfcjsn147d195bbaf6',
              'x-rapidapi-host': 'irctc-indian-railway-pnr-status.p.rapidapi.com'
            }
          }
        );

        const data = await response.json();
        
        if (!data.success || !data.data) {
          showToast('No data found for this PNR number', 'error');
          setResult(null);
        } else {
          setResult(data.data);
          localStorage.setItem('lastPNRData', JSON.stringify({
            pnr,
            data: data.data,
            timestamp: new Date().getTime()
          }));
        }
      }
    } catch (error) {
      showToast('Failed to fetch PNR status. Please try again later.', 'error');
      console.error('Error fetching PNR status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!result) return;
    
    // Set the current PNR in a hidden input for the print view
    const currentPNRInput = document.getElementById('current-pnr') as HTMLInputElement;
    if (currentPNRInput) {
      currentPNRInput.value = pnr;
    }
    
    // Trigger printing
    window.print();
  };

  const handleShare = async () => {
    if (!result) return;

    const shareText = `PNR Status for ${pnr}:\nTrain: ${result.trainNumber} - ${result.trainName}\nDate: ${formatDate(result.dateOfJourney)}\nFrom: ${result.sourceStation} To: ${result.destinationStation}\nCurrent Status: ${result.passengerList.map((p, i) => `Passenger ${i+1}: ${p.currentStatusDetails}`).join(', ')}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `PNR Status: ${pnr}`,
          text: shareText,
          url: window.location.href
        });
        showToast('Shared successfully!', 'success');
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          showToast('Failed to share. Please try again.', 'error');
        }
      }
    } else {
      navigator.clipboard.writeText(shareText);
      showToast('Share text copied to clipboard!', 'success');
    }
  };

  const handleOpenTrainTracker = () => {
    if (result) {
      setShowTrainTracker(true);
    }
  };

  const handleCloseTrainTracker = () => {
    setShowTrainTracker(false);
  };

  const formatDate = (dateString: string) => {
    // Format date for better display by taking only the date part
    try {
      const parts = dateString.split(' ');
      return `${parts[0]} ${parts[1]} ${parts[2]}`;
    } catch (e) {
      return dateString;
    }
  };

  // Create a TrackTracker popup dialog
  const TrainTrackerPopup = () => {
    if (!showTrainTracker || !result) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
          <div className="flex justify-between items-center bg-forest-700 text-white p-4">
            <h3 className="font-bold text-lg flex items-center">
              <Train className="mr-2" /> Train Live Tracker
            </h3>
            <button
              onClick={handleCloseTrainTracker}
              className="rounded-full hover:bg-forest-600 p-1.5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 overflow-auto max-h-[80vh]">
            <TrainTracker
              pnrData={{
                trainNumber: result.trainNumber,
                dateOfJourney: result.dateOfJourney
              }}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="w-full max-w-xl bg-white bg-opacity-95 rounded-2xl shadow-2xl overflow-hidden animate-pop">
        <div className="bg-forest-700 p-6 text-center relative overflow-hidden print-header">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-forest-600 rounded-full opacity-50 no-print"></div>
          <div className="absolute -left-8 -bottom-16 w-40 h-40 bg-forest-800 rounded-full opacity-40 no-print"></div>
          <div className="relative">
            <div className="inline-block p-3 bg-white rounded-full shadow-lg mb-3 animate-bounce-slow">
              <Ticket className="text-forest-700 w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 animate-fade-in">
              PNR Status Checker
            </h1>
            <p className="text-forest-100 text-sm">Track your Indian Railways journey instantly</p>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <form onSubmit={handleSubmit}>
            <div className="relative mb-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <Search className="text-forest-500" />
              </div>
              <input
                type="text"
                value={pnr}
                onChange={(e) => setPnr(e.target.value.slice(0, 10))}
                className="w-full border border-gray-200 p-4 pl-12 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-forest-500 transition-all shadow-sm"
                placeholder="Enter 10-digit PNR number"
                maxLength={10}
              />
              <div className="absolute right-3 top-3 text-xs text-gray-400 font-medium tracking-wide">
                {pnr.length}/10
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-forest-600 hover:bg-forest-700 text-white font-bold py-4 rounded-lg transition duration-300 shadow-md flex items-center justify-center space-x-2 group btn-hover-effect animate-slide-up"
              style={{ animationDelay: '0.4s' }}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>Check Status</span>
                  <ArrowRight className="transform group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {recentSearches.length > 0 && (
            <div className="mt-4 animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <p className="text-xs font-medium text-gray-500 mb-2">Recent Searches:</p>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((recentPnr) => (
                  <button
                    key={recentPnr}
                    onClick={() => setPnr(recentPnr)}
                    className="recent-pnr bg-forest-50 text-forest-700 px-3 py-1 rounded-full text-xs flex items-center"
                  >
                    <HistoryIcon className="text-forest-400 w-3 h-3 mr-1.5" />
                    <span>{recentPnr}</span>
                    <X
                      className="w-3 h-3 ml-1.5 text-gray-400 hover:text-red-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        removePNRFromStorage(recentPnr);
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {result && (
            <div className="mt-6 bg-forest-50 rounded-lg overflow-hidden shadow-md">
              <div className="bg-forest-700 text-white p-4">
                <div className="flex flex-wrap items-center justify-between">
                  <div className="flex items-center">
                    <Train className="w-6 h-6 mr-3" />
                    <div>
                      <h3 className="font-bold text-lg">{result.trainNumber} - {result.trainName}</h3>
                      <p className="text-forest-100 text-sm">Date: {formatDate(result.dateOfJourney)}</p>
                    </div>
                  </div>
                  <div className="mt-2 sm:mt-0 ml-9 sm:ml-0">
                    <span className="bg-forest-900 py-1 px-3 rounded-full text-xs font-medium">
                      {result.journeyClass}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">From</p>
                    <p className="font-bold">{result.sourceStation}</p>
                  </div>
                  <div className="flex-1 mx-4 flex items-center">
                    <div className="h-0.5 flex-1 bg-forest-200"></div>
                    <Train className="w-4 h-4 text-forest-600 mx-2" />
                    <div className="h-0.5 flex-1 bg-forest-200"></div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">To</p>
                    <p className="font-bold">{result.destinationStation}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  {result.passengerList.map((passenger, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Passenger {passenger.passengerSerialNumber}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          passenger.currentStatus === "CAN" 
                            ? "bg-red-50 text-red-700" 
                            : passenger.currentStatus.includes("WL") 
                              ? "bg-yellow-50 text-yellow-700"
                              : "bg-green-50 text-green-700"
                        }`}>
                          {passenger.currentStatusDetails}
                        </span>
                      </div>
                      <div className="text-sm">
                        <p className="text-gray-500">Booking Status:</p>
                        <p>{passenger.bookingStatusDetails}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2 justify-end">
                  <button
                    onClick={handlePrint}
                    className="bg-white hover:bg-gray-100 text-forest-700 border border-forest-200 px-4 py-2 rounded flex items-center text-sm"
                  >
                    <Printer className="w-4 h-4 mr-2" /> Print
                  </button>
                  <button
                    onClick={handleShare}
                    className="bg-white hover:bg-gray-100 text-forest-700 border border-forest-200 px-4 py-2 rounded flex items-center text-sm"
                  >
                    <Share2 className="w-4 h-4 mr-2" /> Share
                  </button>
                  <button 
                    onClick={handleOpenTrainTracker}
                    className="bg-forest-600 hover:bg-forest-700 text-white px-4 py-2 rounded flex items-center text-sm"
                  >
                    <MapPin className="w-4 h-4 mr-2" /> Track Train
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Train Tracker Popup */}
      <TrainTrackerPopup />

      {/* Hidden PNR input for print view */}
      <input type="hidden" id="current-pnr" value={pnr} />

      {/* Print-only ticket layout */}
      <div className="print-container" style={{ display: 'none' }}>
        <div className="ticket-print">
          <div className="ticket-header">
            <h1 className="text-xl font-bold">INDIAN RAILWAYS</h1>
            <p className="text-sm">E-Ticket Status</p>
            <p className="text-xs mt-1">PNR: {pnr}</p>
          </div>
          
          {result && (
            <div className="ticket-content">
              <div className="mb-3">
                <p className="font-bold">{result.trainNumber} - {result.trainName}</p>
                <p>Date of Journey: {formatDate(result.dateOfJourney)}</p>
                <p>Class: {result.journeyClass}</p>
              </div>

              <div className="mb-3">
                <p><strong>From:</strong> {result.sourceStation}</p>
                <p><strong>To:</strong> {result.destinationStation}</p>
                <p><strong>Boarding Point:</strong> {result.boardingPoint}</p>
                <p><strong>Reservation Upto:</strong> {result.reservationUpto}</p>
              </div>

              <div className="mb-3">
                <p><strong>Chart Status:</strong> {result.chartStatus || 'Not Available'}</p>
              </div>

              <div>
                <p className="font-bold mb-1">Passenger Details:</p>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #ccc' }}>
                      <th style={{ padding: '5px', textAlign: 'left' }}>Passenger</th>
                      <th style={{ padding: '5px', textAlign: 'left' }}>Booking Status</th>
                      <th style={{ padding: '5px', textAlign: 'left' }}>Current Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.passengerList.map((passenger, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '5px' }}>Passenger {passenger.passengerSerialNumber}</td>
                        <td style={{ padding: '5px' }}>{passenger.bookingStatusDetails}</td>
                        <td style={{ padding: '5px' }}>{passenger.currentStatusDetails}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="ticket-footer">
            <p>Generated on: {new Date().toLocaleString()}</p>
            <p>This is a computer-generated ticket and does not require signature</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default PNRForm;