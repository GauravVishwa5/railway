import React from 'react';
import { Cloud } from 'lucide-react';

const BackgroundEffects = () => {
  return (
    <>
      <div className="clouds no-print">
        <Cloud className="cloud text-4xl absolute" style={{ top: '15%', left: '10%', animation: 'float 8s ease-in-out infinite' }} />
        <Cloud className="cloud text-3xl absolute" style={{ top: '20%', left: '30%', animation: 'float 12s ease-in-out infinite 1s' }} />
        <Cloud className="cloud text-5xl absolute" style={{ top: '10%', left: '60%', animation: 'float 10s ease-in-out infinite 0.5s' }} />
        <Cloud className="cloud text-4xl absolute" style={{ top: '25%', left: '80%', animation: 'float 9s ease-in-out infinite 2s' }} />
      </div>

      <div className="tracks no-print">
        <div className="track" style={{ width: '30%', animationDelay: '0s' }}></div>
        <div className="track" style={{ width: '60%', animationDelay: '1.2s' }}></div>
        <div className="track" style={{ width: '45%', animationDelay: '2.3s' }}></div>
        <div className="track" style={{ width: '50%', animationDelay: '3.5s' }}></div>
      </div>
    </>
  );
};

export default BackgroundEffects;