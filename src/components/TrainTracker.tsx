import React, { useState, useEffect } from 'react';
import { MapPin, Train, Clock, AlertTriangle, ChevronDown, ChevronUp, ArrowRight, Calendar } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

interface TrainStationDetails {
  stationCode: string;
  stationName: string;
  arrivalTime: string;
  departureTime: string;
  distance: string;
  dayCount: string;
  haltTime: string;
}

interface TrainDetails {
  trainNumber: string;
  trainName: string;
  origin: string;
  destination: string;
  schedule: TrainStationDetails[];
  runningOn: string;
}

interface TrainTrackerProps {
  pnrData?: {
    trainNumber: string;
    dateOfJourney: string;
  };
  standalone?: boolean;
}

const TrainTracker = ({ pnrData, standalone = false }: TrainTrackerProps) => {
  const [trainNumber, setTrainNumber] = useState(pnrData?.trainNumber || '');
  const [loading, setLoading] = useState(false);
  const [trainDetails, setTrainDetails] = useState<TrainDetails | null>(null);
  const [currentPosition, setCurrentPosition] = useState<number>(-1);
  const [expanded, setExpanded] = useState(false);
  const [journeyDate, setJourneyDate] = useState<string>(
    pnrData?.dateOfJourney 
      ? formatDateFromPNR(pnrData.dateOfJourney) 
      : new Date().toISOString().split('T')[0]
  );
  const { showToast } = useToast();

  useEffect(() => {
    if (pnrData && pnrData.trainNumber) {
      setTrainNumber(pnrData.trainNumber);
      fetchTrainDetails(pnrData.trainNumber);
      
      if (pnrData.dateOfJourney) {
        setJourneyDate(formatDateFromPNR(pnrData.dateOfJourney));
      }
    }
  }, [pnrData]);

  // Function to format date from PNR format to YYYY-MM-DD
  function formatDateFromPNR(dateString: string): string {
    try {
      const months: Record<string, string> = {
        'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
        'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
      };
      
      // Example format: "Feb 9, 2025 11:30:05 AM"
      const parts = dateString.split(' ');
      const month = months[parts[0]];
      const day = parts[1].replace(',', '').padStart(2, '0');
      const year = parts[2];
      
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return new Date().toISOString().split('T')[0];
    }
  }

  const fetchTrainDetails = async (trainNum: string) => {
    if (!trainNum) {
      showToast('Please enter a train number', 'error');
      return;
    }

    setLoading(true);
    try {
      // Special case for demo
      if (trainNum === '15018' || trainNum === '11061') {
        // Use the demo data from the second document for train 15018
        if (trainNum === '15018') {
          const demoData = {
            trainNumber: "15018",
            trainName: "GKP LTT EXP",
            origin: "GKP",
            destination: "LTT",
            runningOn: "YYYYYYY",
            schedule: JSON.parse(document.getElementById('demo-data')?.textContent || '[]')
          };
          setTrainDetails(demoData);
          
          // Simulate current position based on current time
          simulateCurrentPosition(demoData.schedule);
        } else {
          // For train 11061 (the one in PNR example)
          const demoData = {
            trainNumber: "11061",
            trainName: "LTT JAYNAGAR EXP",
            origin: "LTT",
            destination: "JYG",
            runningOn: "YYYYYNY",
            schedule: [
              { stationCode: "LTT", stationName: "Lokmanyatilak T", arrivalTime: "--", departureTime: "11:30", distance: "0", dayCount: "1", haltTime: "--" },
              { stationCode: "TNA", stationName: "Thane", arrivalTime: "11:55", departureTime: "11:57", distance: "20", dayCount: "1", haltTime: "02:00" },
              { stationCode: "KYN", stationName: "Kalyan Jn", arrivalTime: "12:20", departureTime: "12:25", distance: "37", dayCount: "1", haltTime: "05:00" },
              { stationCode: "IGP", stationName: "Igatpuri", arrivalTime: "14:07", departureTime: "14:10", distance: "124", dayCount: "1", haltTime: "03:00" },
              { stationCode: "NK", stationName: "Nashik Road", arrivalTime: "15:15", departureTime: "15:20", distance: "171", dayCount: "1", haltTime: "05:00" },
              { stationCode: "MMR", stationName: "Manmad Jn", arrivalTime: "16:40", departureTime: "16:45", distance: "244", dayCount: "1", haltTime: "05:00" },
              { stationCode: "BSL", stationName: "Bhusaval Jn", arrivalTime: "19:15", departureTime: "19:25", distance: "428", dayCount: "1", haltTime: "10:00" },
              { stationCode: "BAU", stationName: "Burhanpur", arrivalTime: "20:31", departureTime: "20:33", distance: "483", dayCount: "1", haltTime: "02:00" },
              { stationCode: "KNW", stationName: "Khandwa", arrivalTime: "21:50", departureTime: "21:55", distance: "551", dayCount: "1", haltTime: "05:00" },
              { stationCode: "ET", stationName: "Itarsi Jn", arrivalTime: "01:55", departureTime: "02:10", distance: "736", dayCount: "2", haltTime: "15:00" },
              { stationCode: "JBP", stationName: "Jabalpur", arrivalTime: "05:25", departureTime: "05:35", distance: "990", dayCount: "2", haltTime: "10:00" },
              { stationCode: "KTE", stationName: "Katni", arrivalTime: "07:15", departureTime: "07:20", distance: "1081", dayCount: "2", haltTime: "05:00" },
              { stationCode: "STA", stationName: "Satna", arrivalTime: "08:55", departureTime: "09:00", distance: "1179", dayCount: "2", haltTime: "05:00" },
              { stationCode: "MKP", stationName: "Manikpur", arrivalTime: "10:33", departureTime: "10:35", distance: "1256", dayCount: "2", haltTime: "02:00" },
              { stationCode: "PRYJ", stationName: "Prayagraj Jn", arrivalTime: "12:25", departureTime: "12:35", distance: "1356", dayCount: "2", haltTime: "10:00" },
              { stationCode: "BSB", stationName: "Varanasi Jn", arrivalTime: "15:05", departureTime: "15:20", distance: "1492", dayCount: "2", haltTime: "15:00" },
              { stationCode: "JYG", stationName: "Jaynagar", arrivalTime: "22:30", departureTime: "--", distance: "1704", dayCount: "2", haltTime: "--" }
            ]
          };
          setTrainDetails(demoData);
          
          // Simulate current position based on current time
          simulateCurrentPosition(demoData.schedule);
        }
      } else {
        // Real API call for production
        const response = await fetch(
          `https://indian-railway-irctc.p.rapidapi.com/api/trains-search/v1/train/${trainNum}?isH5=true&client=web`,
          {
            headers: {
              'x-rapidapi-key': '9aa9a6917cmsh428479b7a93cb56p190dfcjsn147d195bbaf6',
              'x-rapidapi-host': 'indian-railway-irctc.p.rapidapi.com'
            }
          }
        );

        const data = await response.json();
        
        if (!data || !data.body || data.body.length === 0 || !data.body[0].trains || data.body[0].trains.length === 0) {
          showToast('No data found for this train number', 'error');
          setTrainDetails(null);
        } else {
          const train = data.body[0].trains[0];
          setTrainDetails({
            trainNumber: train.trainNumber,
            trainName: train.trainName,
            origin: train.stationFrom,
            destination: train.stationTo,
            runningOn: train.runningOn,
            schedule: train.schedule
          });
          
          simulateCurrentPosition(train.schedule);
        }
      }
    } catch (error) {
      showToast('Failed to fetch train details. Please try again.', 'error');
      console.error('Error fetching train details:', error);
    } finally {
      setLoading(false);
    }
  };

  const simulateCurrentPosition = (schedule: TrainStationDetails[]) => {
    // Get current time
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Get date from journey date
    const selectedDate = new Date(journeyDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    
    // Calculate day difference
    const dayDiff = Math.floor((selectedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // If the journey date is in the future, train hasn't started
    if (dayDiff > 0) {
      setCurrentPosition(-1);
      return;
    }
    
    // If the journey date is in the past, train has completed journey
    if (dayDiff < -1) {
      setCurrentPosition(schedule.length);
      return;
    }
    
    // For today or yesterday, calculate position based on time
    let position = -1;
    
    for (let i = 0; i < schedule.length; i++) {
      const station = schedule[i];
      
      // Check if the station is for the correct day
      const stationDay = parseInt(station.dayCount) - 1; // Convert to 0-based
      
      if (stationDay > dayDiff) {
        // This station is for a future day, so train hasn't reached it yet
        continue;
      }
      
      if (stationDay < dayDiff) {
        // This station is for a past day, so train has already passed it
        position = i;
        continue;
      }
      
      // Station is for the current day, check time
      if (station.departureTime !== "--") {
        const [depHour, depMinute] = station.departureTime.split(':').map(Number);
        
        if (depHour < currentHour || (depHour === currentHour && depMinute < currentMinute)) {
          // Train has departed this station
          position = i;
        } else {
          // Train hasn't departed this station yet
          if (station.arrivalTime !== "--") {
            const [arrHour, arrMinute] = station.arrivalTime.split(':').map(Number);
            
            if (arrHour < currentHour || (arrHour === currentHour && arrMinute < currentMinute)) {
              // Train has arrived but not departed
              position = i - 0.5;
              break;
            }
          }
          break;
        }
      } else if (station.arrivalTime !== "--") {
        // Last station, only arrival time
        const [arrHour, arrMinute] = station.arrivalTime.split(':').map(Number);
        
        if (arrHour < currentHour || (arrHour === currentHour && arrMinute < currentMinute)) {
          // Train has arrived at the last station
          position = i;
        }
        break;
      }
    }
    
    setCurrentPosition(position);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTrainDetails(trainNumber);
  };

  const getStationStatus = (index: number) => {
    if (index < currentPosition) {
      return { status: 'passed', text: 'Passed' };
    } else if (index === Math.floor(currentPosition) && currentPosition % 1 !== 0) {
      return { status: 'current', text: 'At Station' };
    } else if (index === Math.floor(currentPosition) + 1 && currentPosition % 1 !== 0) {
      return { status: 'next', text: 'Next Station' };
    } else if (index === currentPosition + 1) {
      return { status: 'next', text: 'Next Station' };
    } else {
      return { status: 'upcoming', text: 'Upcoming' };
    }
  };

  const getDayLabel = (dayCount: string) => {
    return dayCount === "1" ? "Day 1" : dayCount === "2" ? "Day 2" : `Day ${dayCount}`;
  };

  const formatRunningDays = (runningOn: string) => {
    if (!runningOn) return '';
    
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const runningDays = runningOn.split('').map((status, index) => {
      return { day: days[index], running: status === 'Y' };
    });
    
    return (
      <div className="flex space-x-1 mt-1">
        {runningDays.map((day, index) => (
          <span 
            key={index} 
            className={`text-xs px-1.5 py-0.5 rounded-full ${
              day.running 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {day.day}
          </span>
        ))}
      </div>
    );
  };

  // Get displayed stations (all if expanded, or limited number if not)
  const getDisplayedStations = () => {
    if (!trainDetails?.schedule) return [];
    
    if (expanded) return trainDetails.schedule;
    
    const schedule = trainDetails.schedule;
    const result = [];
    
    // Always show first station
    if (schedule.length > 0) result.push(schedule[0]);
    
    // Show current and next station
    if (currentPosition >= 0 && currentPosition < schedule.length) {
      if (currentPosition % 1 !== 0) {
        // If at station, show current and next
        const currentIdx = Math.floor(currentPosition);
        if (currentIdx >= 0 && !result.includes(schedule[currentIdx])) {
          result.push(schedule[currentIdx]);
        }
        if (currentIdx + 1 < schedule.length && !result.includes(schedule[currentIdx + 1])) {
          result.push(schedule[currentIdx + 1]);
        }
      } else {
        // If between stations, show next
        const nextIdx = currentPosition + 1;
        if (nextIdx < schedule.length && !result.includes(schedule[nextIdx])) {
          result.push(schedule[nextIdx]);
        }
      }
    }
    
    // Always show last station
    if (schedule.length > 1 && !result.includes(schedule[schedule.length - 1])) {
      result.push(schedule[schedule.length - 1]);
    }
    
    // Add a few major stations in between
    const majorStations = schedule.filter(station => 
      parseInt(station.distance) % 200 < 20 && // Roughly every 200km
      !result.includes(station) &&
      station !== schedule[0] && 
      station !== schedule[schedule.length - 1]
    ).slice(0, 3);
    
    return [...result, ...majorStations].sort((a, b) => {
      const aIdx = schedule.findIndex(s => s.stationCode === a.stationCode);
      const bIdx = schedule.findIndex(s => s.stationCode === b.stationCode);
      return aIdx - bIdx;
    });
  };

  return (
    <div className={`w-full ${standalone ? 'max-w-xl' : ''} bg-white rounded-lg shadow-md overflow-hidden`}>
      {/* Hidden data element for the demo train schedule */}
      <div id="demo-data" style={{ display: 'none' }}>
        {JSON.stringify(JSON.parse(document.getElementById('demo-data')?.textContent || '[]'))}
      </div>
      
      <div className="bg-forest-700 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Train className="w-5 h-5 mr-2" />
            <h2 className="text-lg font-bold">Train Live Tracker</h2>
          </div>
          {pnrData?.trainNumber && (
            <span className="bg-forest-600 px-2 py-1 rounded text-xs">
              PNR Connected
            </span>
          )}
        </div>
      </div>

      {standalone && (
        <form onSubmit={handleSubmit} className="p-4 border-b border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="sm:col-span-1">
              <label htmlFor="trainNumber" className="block text-xs text-gray-500 mb-1">Train Number</label>
              <input
                type="text"
                id="trainNumber"
                value={trainNumber}
                onChange={(e) => setTrainNumber(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-forest-500"
                placeholder="Enter Train No."
              />
            </div>
            <div className="sm:col-span-1">
              <label htmlFor="journeyDate" className="block text-xs text-gray-500 mb-1">Journey Date</label>
              <input
                type="date"
                id="journeyDate"
                value={journeyDate}
                onChange={(e) => setJourneyDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-forest-500"
              />
            </div>
            <div className="sm:col-span-1 flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full p-2 bg-forest-600 hover:bg-forest-700 text-white rounded transition duration-200"
              >
                {loading ? (
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  </div>
                ) : (
                  "Track Train"
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="p-4">
        {trainDetails ? (
          <div>
            <div className="mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold">{trainDetails.trainNumber} - {trainDetails.trainName}</h3>
                  <p className="text-sm text-gray-600">
                    {trainDetails.origin} <ArrowRight className="inline w-3 h-3" /> {trainDetails.destination}
                  </p>
                  {formatRunningDays(trainDetails.runningOn)}
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1 text-gray-600" />
                  <span className="text-sm text-gray-600">{new Date(journeyDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}</span>
                </div>
              </div>
            </div>

            <div className="relative">
              {/* The vertical line */}
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>

              {getDisplayedStations().map((station, idx) => {
                const { status, text } = getStationStatus(
                  trainDetails.schedule.findIndex(s => s.stationCode === station.stationCode)
                );
                const isFirst = station.stationCode === trainDetails.schedule[0].stationCode;
                const isLast = station.stationCode === trainDetails.schedule[trainDetails.schedule.length - 1].stationCode;

                return (
                  <div className="flex mb-4" key={station.stationCode}>
                    <div className="mr-4 relative">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 relative ${
                        status === 'passed' 
                          ? 'bg-green-100 text-green-700 border border-green-300' 
                          : status === 'current' 
                            ? 'bg-yellow-100 text-yellow-700 border border-yellow-300 animate-pulse' 
                            : status === 'next' 
                              ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                              : 'bg-gray-100 text-gray-700 border border-gray-300'
                      }`}>
                        {status === 'current' ? <Train className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            <h4 className="font-bold">{station.stationName} ({station.stationCode})</h4>
                            <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                              {getDayLabel(station.dayCount)}
                            </span>
                            {status === 'current' && (
                              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 animate-pulse">
                                Currently Here
                              </span>
                            )}
                            {status === 'next' && (
                              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                Next Stop
                              </span>
                            )}
                          </div>
                          <span className="text-sm text-gray-600">Distance: {station.distance} km</span>
                        </div>
                        <div className="text-right">
                          <div className="flex flex-col text-sm">
                            {!isFirst && (
                              <span className="flex items-center">
                                <Clock className="w-3 h-3 mr-1 text-gray-500" />
                                <span className={`${status === 'passed' ? 'text-green-600' : 'text-gray-600'}`}>
                                  Arr: {station.arrivalTime === "--" ? "N/A" : station.arrivalTime}
                                </span>
                              </span>
                            )}
                            {!isLast && (
                              <span className="flex items-center">
                                <Clock className="w-3 h-3 mr-1 text-gray-500" />
                                <span className={`${status === 'passed' ? 'text-green-600' : 'text-gray-600'}`}>
                                  Dep: {station.departureTime === "--" ? "N/A" : station.departureTime}
                                </span>
                              </span>
                            )}
                          </div>
                          {station.haltTime !== "--" && parseInt(station.haltTime) > 0 && (
                            <span className="text-xs text-gray-500">
                              Halt: {parseInt(station.haltTime) < 60 
                                ? `${station.haltTime} min` 
                                : `${Math.floor(parseInt(station.haltTime) / 60)}h ${parseInt(station.haltTime) % 60}m`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {!expanded && trainDetails.schedule.length > getDisplayedStations().length && (
                <div className="text-center mt-4">
                  <button 
                    onClick={() => setExpanded(true)}
                    className="text-forest-600 hover:text-forest-700 flex items-center justify-center w-full py-2 border border-dashed border-forest-300 rounded-lg text-sm"
                  >
                    <span>Show all {trainDetails.schedule.length} stations</span>
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </button>
                </div>
              )}

              {expanded && (
                <div className="text-center mt-4">
                  <button 
                    onClick={() => setExpanded(false)}
                    className="text-forest-600 hover:text-forest-700 flex items-center justify-center w-full py-2 border border-dashed border-forest-300 rounded-lg text-sm"
                  >
                    <span>Show fewer stations</span>
                    <ChevronUp className="w-4 h-4 ml-1" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            {standalone ? (
              <div>
                <AlertTriangle className="w-12 h-12 text-forest-300 mx-auto mb-3" />
                <p className="text-gray-500">Enter a train number and date to track train location</p>
                <p className="text-xs text-gray-400 mt-1">Try 15018 for a demo</p>
              </div>
            ) : (
              <div>
                <AlertTriangle className="w-12 h-12 text-forest-300 mx-auto mb-3" />
                <p className="text-gray-500">No train details available</p>
                <p className="text-xs text-gray-400 mt-1">Check your PNR details or enter a train number manually</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainTracker;