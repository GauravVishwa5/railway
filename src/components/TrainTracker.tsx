import React, { useState, useEffect } from 'react';
import { MapPin, Train, Clock, AlertTriangle, ChevronDown, ChevronUp, ArrowRight, Calendar } from 'lucide-react';

interface TrainStationDetails {
  stationCode: string;
  stationName: string;
  arrivalTime: string;
  departureTime: string;
  distance: string;
  dayCount: string;
  haltTime: string;
  seq: string;
}

interface TrainDetails {
  trainNumber: string;
  trainName: string;
  origin: string;
  destination: string;
  schedule: TrainStationDetails[];
  runningOn: string;
  timestamp: number;
}

interface TrainTrackerProps {
  pnrData?: {
    trainNumber: string;
    dateOfJourney: string;
  };
  standalone?: boolean;
}

const CACHE_EXPIRATION = 7 * 24 * 60 * 60 * 1000;

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

  useEffect(() => {
    if (pnrData && pnrData.trainNumber) {
      setTrainNumber(pnrData.trainNumber);
      fetchTrainDetails(pnrData.trainNumber);
      
      if (pnrData.dateOfJourney) {
        setJourneyDate(formatDateFromPNR(pnrData.dateOfJourney));
      }
    }
  }, [pnrData]);

  function formatDateFromPNR(dateString: string): string {
    try {
      const months: Record<string, string> = {
        'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
        'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
      };
      
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

  const getCachedTrainDetails = (trainNum: string): TrainDetails | null => {
    try {
      const cachedData = localStorage.getItem(`train_${trainNum}`);
      if (!cachedData) return null;
      
      const parsedData: TrainDetails = JSON.parse(cachedData);
      
      if (Date.now() - parsedData.timestamp > CACHE_EXPIRATION) {
        localStorage.removeItem(`train_${trainNum}`);
        return null;
      }
      
      return parsedData;
    } catch (error) {
      console.error('Error retrieving cached train details:', error);
      return null;
    }
  };

  const saveTrainDetailsToCache = (details: TrainDetails) => {
    try {
      const detailsWithTimestamp = {
        ...details,
        timestamp: Date.now()
      };
      
      localStorage.setItem(`train_${details.trainNumber}`, JSON.stringify(detailsWithTimestamp));
    } catch (error) {
      console.error('Error saving train details to cache:', error);
      try {
        clearOldCachedTrains();
      } catch (e) {
        console.error('Failed to clear cache:', e);
      }
    }
  };

  const clearOldCachedTrains = () => {
    const keysToDelete = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('train_')) {
        keysToDelete.push({
          key,
          timestamp: JSON.parse(localStorage.getItem(key) || '{"timestamp": 0}').timestamp
        });
      }
    }
    
    keysToDelete.sort((a, b) => a.timestamp - b.timestamp);
    keysToDelete.slice(0, 5).forEach(item => localStorage.removeItem(item.key));
  };

  const fetchTrainDetails = async (trainNum: string) => {
    if (!trainNum) {
      return;
    }

    setLoading(true);
    
    const cachedDetails = getCachedTrainDetails(trainNum);
    if (cachedDetails) {
      setTrainDetails(cachedDetails);
      simulateCurrentPosition(cachedDetails.schedule);
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch(
        `https://train-tracker-api.onrender.com/api/train/${trainNum}`
      );

      const data = await response.json();
      
      if (!data || !data.success || !data.data) {
        setTrainDetails(null);
      } else {
        const stations = data.data.stations.map((station: any, index: number) => {
          const nextDay = index > 0 && 
            parseInt(station.arrivalTime.split(':')[0]) < 
            parseInt(data.data.stations[index-1].departureTime.split(':')[0]);
          
          const day = nextDay ? 
            (parseInt(data.data.stations[index-1].dayCount || "1") + 1).toString() : 
            station.dayCount || "1";
            
          const haltTime = station.seq === data.data.stations.length.toString() ? 
            "0" : 
            calculateHaltTime(station.arrivalTime, station.departureTime);
            
          return {
            stationCode: station.stationCode,
            stationName: station.stationName,
            arrivalTime: station.arrivalTime.substring(0, 5),
            departureTime: station.departureTime.substring(0, 5),
            distance: station.distance,
            dayCount: day,
            haltTime,
            seq: station.seq
          };
        });
        
        // Calculate day counts correctly
        let currentDay = 1;
        for (let i = 0; i < stations.length; i++) {
          if (i === 0) {
            stations[i].dayCount = "1";
            continue;
          }
          
          const prevTime = parseInt(stations[i-1].departureTime.split(':')[0]);
          const currTime = parseInt(stations[i].arrivalTime.split(':')[0]);
          
          if (currTime < prevTime && !(prevTime === 23 && currTime === 0)) {
            currentDay++;
          }
          
          stations[i].dayCount = currentDay.toString();
        }
        
        const trainData = {
          trainNumber: trainNum,
          trainName: data.data.trainName,
          origin: data.data.sourceStationName,
          destination: data.data.destinationStationName,
          runningOn: "YNYNYNN", // Sample running days
          schedule: stations,
          timestamp: Date.now()
        };
        
        saveTrainDetailsToCache(trainData);
        
        setTrainDetails(trainData);
        simulateCurrentPosition(trainData.schedule);
      }
    } catch (error) {
      console.error('Error fetching train details:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateHaltTime = (arrival: string, departure: string): string => {
    const arrParts = arrival.split(':').map(Number);
    const depParts = departure.split(':').map(Number);
    
    let diffMinutes = (depParts[0] * 60 + depParts[1]) - (arrParts[0] * 60 + arrParts[1]);
    
    if (diffMinutes < 0) {
      diffMinutes += 24 * 60; // Add a day if negative
    }
    
    return diffMinutes.toString();
  };

  const simulateCurrentPosition = (schedule: TrainStationDetails[]) => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    const selectedDate = new Date(journeyDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    
    const dayDiff = Math.floor((selectedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (dayDiff > 0) {
      setCurrentPosition(-1);
      return;
    }
    
    if (dayDiff < -1) {
      setCurrentPosition(schedule.length);
      return;
    }
    
    let position = -1;
    
    for (let i = 0; i < schedule.length; i++) {
      const station = schedule[i];
      
      const stationDay = parseInt(station.dayCount) - 1;
      
      if (stationDay > dayDiff) {
        continue;
      }
      
      if (stationDay < dayDiff) {
        position = i;
        continue;
      }
      
      if (station.departureTime !== "--") {
        const [depHour, depMinute] = station.departureTime.split(':').map(Number);
        
        if (depHour < currentHour || (depHour === currentHour && depMinute < currentMinute)) {
          position = i;
        } else {
          if (station.arrivalTime !== "--") {
            const [arrHour, arrMinute] = station.arrivalTime.split(':').map(Number);
            
            if (arrHour < currentHour || (arrHour === currentHour && arrMinute < currentMinute)) {
              position = i - 0.5;
              break;
            }
          }
          break;
        }
      } else if (station.arrivalTime !== "--") {
        const [arrHour, arrMinute] = station.arrivalTime.split(':').map(Number);
        
        if (arrHour < currentHour || (arrHour === currentHour && arrMinute < currentMinute)) {
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

  const getDisplayedStations = () => {
    if (!trainDetails?.schedule) return [];
    
    if (expanded) return trainDetails.schedule;
    
    const schedule = trainDetails.schedule;
    const result = [];
    
    if (schedule.length > 0) result.push(schedule[0]);
    
    if (currentPosition >= 0 && currentPosition < schedule.length) {
      if (currentPosition % 1 !== 0) {
        const currentIdx = Math.floor(currentPosition);
        if (currentIdx >= 0 && !result.includes(schedule[currentIdx])) {
          result.push(schedule[currentIdx]);
        }
        if (currentIdx + 1 < schedule.length && !result.includes(schedule[currentIdx + 1])) {
          result.push(schedule[currentIdx + 1]);
        }
      } else {
        const nextIdx = currentPosition + 1;
        if (nextIdx < schedule.length && !result.includes(schedule[nextIdx])) {
          result.push(schedule[nextIdx]);
        }
      }
    }
    
    if (schedule.length > 1 && !result.includes(schedule[schedule.length - 1])) {
      result.push(schedule[schedule.length - 1]);
    }
    
    const majorStations = schedule.filter(station => 
      parseInt(station.distance) % 200 < 20 && 
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
                <div className="flex flex-col items-end">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1 text-gray-600" />
                    <span className="text-sm text-gray-600">{new Date(journeyDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}</span>
                  </div>
                  {trainDetails.timestamp && (
                    <span className="text-xs text-gray-400 mt-1">
                      Cached: {new Date(trainDetails.timestamp).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="relative">
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