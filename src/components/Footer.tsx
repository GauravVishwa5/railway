import React from 'react';
import { Train } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-forest-900 text-forest-100 py-4 text-center text-xs no-print animate-fade-in" style={{ animationDelay: '1.3s' }}>
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between">
          <div className="mb-3 sm:mb-0">
            <Train className="inline-block mr-2 w-4 h-4" />
            <a href="https://www.linkedin.com/in/gaurav-vishwakarma-678794262">
              <span className="font-semibold">Royal Express PNR Checker</span> © 2025
            </a>
          </div>
          <div className="flex space-x-4">
            <a href="#" className="hover:text-white transition-all hover:scale-110 duration-300">
              <i className="fab fa-facebook"></i>
            </a>
            <a href="#" className="hover:text-white transition-all hover:scale-110 duration-300">
              <i className="fab fa-twitter"></i>
            </a>
            <a href="#" className="hover:text-white transition-all hover:scale-110 duration-300">
              <i className="fab fa-instagram"></i>
            </a>
          </div>
          <div className="mt-3 sm:mt-0">
            <a href="#" className="hover:text-white transition-all">Privacy Policy</a> |{' '}
            <a href="#" className="hover:text-white transition-all">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;