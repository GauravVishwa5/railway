import React, { useEffect } from 'react';
import { Train } from 'lucide-react';
import Header from './components/Header';
import PNRForm from './components/PNRForm';
import Features from './components/Features';
import Footer from './components/Footer';
import BackgroundEffects from './components/BackgroundEffects';
import { ToastProvider } from './contexts/ToastContext';

function App() {
  useEffect(() => {
    // Add custom styles to head
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
      
      .glass-effect {
        background: rgba(255, 255, 255, 0.25);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
      }
      
      .train-animation {
        animation: train-move 15s linear infinite;
      }
      
      @keyframes train-move {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100vw); }
      }
      
      @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-15px); }
      }
      
      .animate-float {
        animation: float 6s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <ToastProvider>
      <div className="bg-gradient-to-br from-forest-800 via-forest-700 to-forest-900 min-h-screen font-sans text-gray-800">
        <BackgroundEffects />
        <Header />
        
        {/* Animated Train (Decorative) */}
        <div className="fixed bottom-8 left-0 train-animation opacity-30 pointer-events-none no-print">
          <Train className="text-white w-8 h-8" />
        </div>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-24 flex flex-col items-center justify-center">
          <PNRForm />
          <Features />
        </main>

        <Footer />
      </div>
    </ToastProvider>
  );
}

export default App;