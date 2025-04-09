import React, { useState, useEffect } from 'react';
import { Train, Home, Info, Headphones, Menu, X } from 'lucide-react';

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 w-full z-20 transition-all duration-300 no-print ${
      scrolled ? 'bg-forest-900 shadow-lg py-2' : 'bg-forest-900 bg-opacity-80 backdrop-blur-md py-4'
    }`}>
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`transition-all duration-500 ${scrolled ? '' : 'animate-float'}`}>
            <Train className="text-forest-100 w-6 h-6" />
          </div>
          <h1 className="text-forest-50 font-bold text-xl hidden md:block tracking-wide">
            <span className="text-forest-200">Royal</span> Express
          </h1>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <a href="#" className="text-forest-100 hover:text-white transition-colors duration-300 flex items-center font-medium">
            <Home className="w-5 h-5 mr-2" />
            Home
          </a>
          <a href="#" className="text-forest-100 hover:text-white transition-colors duration-300 flex items-center font-medium">
            <Info className="w-5 h-5 mr-2" />
            About
          </a>
          <a href="#" className="text-forest-100 hover:text-white transition-colors duration-300 flex items-center font-medium">
            <Headphones className="w-5 h-5 mr-2" />
            Support
          </a>
          <button className="ml-4 bg-forest-500 hover:bg-forest-600 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-300">
            Book Now
          </button>
        </nav>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden text-forest-100 p-2 focus:outline-none"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-forest-800 shadow-lg">
          <div className="container mx-auto px-4 py-3 flex flex-col space-y-4">
            <a href="#" className="text-forest-100 hover:text-white transition-colors duration-300 flex items-center font-medium py-2">
              <Home className="w-5 h-5 mr-3" />
              Home
            </a>
            <a href="#" className="text-forest-100 hover:text-white transition-colors duration-300 flex items-center font-medium py-2">
              <Info className="w-5 h-5 mr-3" />
              About
            </a>
            <a href="#" className="text-forest-100 hover:text-white transition-colors duration-300 flex items-center font-medium py-2">
              <Headphones className="w-5 h-5 mr-3" />
              Support
            </a>
            <button className="bg-forest-500 hover:bg-forest-600 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-300 w-full">
              Book Now
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;