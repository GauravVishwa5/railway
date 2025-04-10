import React, { useState, useEffect } from 'react';
import { Train, Home, Info, Headphones, Menu, X, Calendar } from 'lucide-react';

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeItem, setActiveItem] = useState('home');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { id: 'home', label: 'Home', icon: <Home className="w-5 h-5 mr-2 group-hover:text-amber-300" /> },
    { id: 'about', label: 'About', icon: <Info className="w-5 h-5 mr-2 group-hover:text-amber-300" /> },
    { id: 'support', label: 'Support', icon: <Headphones className="w-5 h-5 mr-2 group-hover:text-amber-300" /> },
    { id: 'schedule', label: 'Schedule', icon: <Calendar className="w-5 h-5 mr-2 group-hover:text-amber-300" /> }
  ];

  return (
    <header 
      className={`fixed top-0 left-0 w-full z-20 transition-all duration-500 no-print ${
        scrolled 
          ? 'bg-gradient-to-r from-forest-900 to-forest-800 shadow-lg py-2' 
          : 'bg-gradient-to-r from-forest-900 to-forest-800 bg-opacity-90 backdrop-blur-lg py-4'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center space-x-3 group">
            <div className={`transition-all duration-500 ${scrolled ? 'scale-90' : 'animate-float'}`}>
              <div className="bg-gradient-to-br from-forest-700 to-forest-900 p-2 rounded-full group-hover:from-amber-500 group-hover:to-amber-700 transition-all duration-300">
                <Train className="text-amber-300 w-6 h-6 group-hover:text-white" />
              </div>
            </div>
            <h1 className="text-forest-50 font-bold text-xl hidden md:block tracking-wider">
              <span className="bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">Royal</span> 
              <span className="text-forest-50"> Express</span>
            </h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map(item => (
              <a 
                key={item.id}
                href={`#${item.id}`} 
                className={`group px-3 py-2 rounded-md text-forest-100 hover:text-white transition-all duration-300 flex items-center font-medium ${
                  activeItem === item.id ? 'bg-forest-700 text-amber-300' : 'hover:bg-forest-800'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveItem(item.id);
                }}
              >
                {item.icon}
                {item.label}
              </a>
            ))}
            <button className="ml-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold py-2 px-4 rounded-md transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
              Book Now
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-forest-100 p-2 focus:outline-none"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-amber-300" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div 
        className={`md:hidden bg-forest-800 shadow-lg transition-all duration-300 overflow-hidden ${
          mobileMenuOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="container mx-auto px-4 py-2 flex flex-col space-y-1">
          {navItems.map(item => (
            <a 
              key={item.id}
              href={`#${item.id}`} 
              className={`text-forest-100 hover:text-white transition-colors duration-300 flex items-center font-medium py-3 px-2 rounded-md ${
                activeItem === item.id ? 'bg-forest-700 text-amber-300' : 'hover:bg-forest-700'
              }`}
              onClick={(e) => {
                e.preventDefault();
                setActiveItem(item.id);
                setMobileMenuOpen(false);
              }}
            >
              {item.icon}
              {item.label}
            </a>
          ))}
          <button className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold py-3 px-4 rounded-md transition-colors duration-300 mt-2">
            Book Now
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;