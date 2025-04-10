import React, { useState } from 'react';
import { Train, Heart, ExternalLink, Github, Phone, Mail, Linkedin } from 'lucide-react';

const Footer = () => {
  const [hovered, setHovered] = useState(null);
  const linkedInUrl = "https://www.linkedin.com/in/gaurav-vishwakarma-678794262";
  const githubUrl = "https://github.com/GauravVishwa5";
  const emailAddress = "gaurav200243@gmail.com";
  
  const socialLinks = [
    { 
      icon: <Github className="group-hover:text-amber-300" />, 
      name: "GitHub", 
      url: githubUrl 
    },
    { 
      icon: <Linkedin className="group-hover:text-amber-300" />, 
      name: "LinkedIn", 
      url: linkedInUrl 
    },
    { 
      icon: <Mail className="group-hover:text-amber-300" />, 
      name: "Email", 
      url: `mailto:${emailAddress}` 
    }
  ];

  return (
    <footer className="bg-gradient-to-r from-forest-900 to-forest-800 text-forest-50 py-6 text-center no-print">
      <div className="container mx-auto px-4">
        {/* Top Section with Logo and Links */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6">
          <div className="flex items-center mb-4 sm:mb-0 group">
            <div className="bg-gradient-to-br from-forest-700 to-forest-900 p-2 rounded-full mr-3 group-hover:from-amber-500 group-hover:to-amber-700 transition-all duration-300">
              <Train className="text-amber-300 w-5 h-5 group-hover:text-white" />
            </div>
            <a href="#" className="flex items-center">
              <h2 className="font-bold text-lg tracking-wider">
                <span className="bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">Royal</span> 
                <span className="text-forest-50"> Express</span>
              </h2>
            </a>
          </div>
          
          <div className="flex space-x-6">
            {socialLinks.map((link, index) => (
              <a 
                key={index}
                href={link.url} 
                className="group flex flex-col items-center hover:text-amber-300 transition-all"
                onMouseEnter={() => setHovered(index)}
                onMouseLeave={() => setHovered(null)}
                target="_blank" 
                rel="noopener noreferrer"
              >
                <div className="transform transition-all duration-300 group-hover:scale-125 group-hover:-translate-y-1">
                  {link.icon}
                </div>
                <span className={`text-xs mt-1 opacity-0 group-hover:opacity-100 transition-all duration-300 ${hovered === index ? 'translate-y-0' : '-translate-y-2'}`}>
                  {link.name}
                </span>
              </a>
            ))}
          </div>
          
          <div className="flex space-x-4 text-sm">
            <a href="#" className="hover:text-amber-300 transition-all underline-offset-4 hover:underline">Privacy</a>
            <span className="text-forest-400">|</span>
            <a href="#" className="hover:text-amber-300 transition-all underline-offset-4 hover:underline">Terms</a>
            <span className="text-forest-400">|</span>
            <a href="#" className="hover:text-amber-300 transition-all underline-offset-4 hover:underline">FAQ</a>
          </div>
        </div>
        
        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-forest-400 to-transparent mb-6"></div>
        
        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row items-center justify-between text-xs">
          <div className="mb-2 md:mb-0 text-forest-300">
            PNR Checker <span className="text-amber-400">·</span> Track Status <span className="text-amber-400">·</span> Seat Availability
          </div>
          
          <div className="mb-2 md:mb-0 flex flex-col sm:flex-row items-center">
            <div className="flex items-center">
              <span>Made with</span>
              <Heart className="w-3 h-3 mx-1 text-red-400 animate-pulse" />
              <span>by</span>
              <a 
                href={linkedInUrl} 
                className="ml-1 font-medium text-amber-300 hover:text-amber-200 transition-all flex items-center"
                target="_blank" 
                rel="noopener noreferrer"
              >
                Gaurav Vishwakarma
                <ExternalLink className="w-3 h-3 ml-1 opacity-50" />
              </a>
            </div>
            <a 
              href={`mailto:${emailAddress}`} 
              className="text-forest-200 hover:text-amber-300 transition-all sm:ml-2"
            >
              {emailAddress}
            </a>
          </div>
          
          <div className="text-forest-300">
            <span className="text-amber-400 font-medium">© 2025 Royal Express</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;