import React from 'react';
import { 
  Twitter, 
  Linkedin, 
  Github, 
  Facebook, 
  Navigation 
} from 'lucide-react';

const Footer = () => {
  const socialLinks = [
    { 
      icon: Twitter, 
      href: '#', 
      color: 'text-blue-400 hover:text-blue-500' 
    },
    { 
      icon: Linkedin, 
      href: '#', 
      color: 'text-blue-600 hover:text-blue-700' 
    },
    { 
      icon: Github, 
      href: '#', 
      color: 'text-gray-800 hover:text-black' 
    },
    { 
      icon: Facebook, 
      href: '#', 
      color: 'text-blue-700 hover:text-blue-800' 
    }
  ];

  return (
    <footer className="bg-gradient-to-br from-purple-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          {/* Logo and Tagline */}
          <div className="flex items-center mb-4 md:mb-0">
            <Navigation className="w-6 h-6 text-purple-600 mr-2" />
            <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
              EHR Blockchain
            </h2>
          </div>

          {/* Tagline */}
          <p className="text-sm text-gray-700 italic mb-4 md:mb-0">
            "Secure. Transparent. Patient-Centric."
          </p>

          {/* Social Media */}
          <div className="flex space-x-4">
            {socialLinks.map((social, index) => (
              <a 
                key={index} 
                href={social.href} 
                target="_blank" 
                rel="noopener noreferrer"
                className={`${social.color} transition-transform transform hover:scale-110`}
              >
                <social.icon className="w-5 h-5" strokeWidth={1.5} />
              </a>
            ))}
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center text-xs text-gray-600 mt-4 border-t border-purple-200 pt-3">
          © {new Date().getFullYear()} EHR Blockchain. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;