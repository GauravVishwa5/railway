import React from 'react';
import { Zap, Shield, History } from 'lucide-react';

const Features = () => {
  return (
    <div className="w-full max-w-4xl mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 no-print">
      <div className="bg-white bg-opacity-10 rounded-lg p-4 backdrop-blur-sm text-white text-center animate-fade-in hover:bg-opacity-20 transition-all hover:transform hover:scale-105 duration-300" style={{ animationDelay: '0.7s' }}>
        <Zap className="w-8 h-8 mx-auto mb-2 text-forest-200" />
        <h3 className="font-semibold">Lightning Fast</h3>
        <p className="text-xs text-forest-100">Get instant PNR status updates</p>
      </div>
      <div className="bg-white bg-opacity-10 rounded-lg p-4 backdrop-blur-sm text-white text-center animate-fade-in hover:bg-opacity-20 transition-all hover:transform hover:scale-105 duration-300" style={{ animationDelay: '0.9s' }}>
        <Shield className="w-8 h-8 mx-auto mb-2 text-forest-200" />
        <h3 className="font-semibold">Secure Checking</h3>
        <p className="text-xs text-forest-100">Your data is always protected</p>
      </div>
      <div className="bg-white bg-opacity-10 rounded-lg p-4 backdrop-blur-sm text-white text-center animate-fade-in hover:bg-opacity-20 transition-all hover:transform hover:scale-105 duration-300" style={{ animationDelay: '1.1s' }}>
        <History className="w-8 h-8 mx-auto mb-2 text-forest-200" />
        <h3 className="font-semibold">Real-time Updates</h3>
        <p className="text-xs text-forest-100">Latest information from IRCTC</p>
      </div>
    </div>
  );
};

export default Features;