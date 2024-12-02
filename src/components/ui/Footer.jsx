import React from 'react';
import { Navigation } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-purple-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col space-y-4 items-center">
          {/* Logo and Name */}
          <div className="flex items-center">
            <h2 className="text-lg font-bold text-gray-900">
              DigiArogya
            </h2>
          </div>

          {/* Tagline */}
          <p className="text-sm text-gray-700 italic">
            "Secure. Transparent. Patient-Centric."
          </p>

          {/* Copyright */}
          <div className="text-xs text-gray-600 border-t border-purple-200 pt-3 w-full text-center">
            © {new Date().getFullYear()} EHR Blockchain. All Rights Reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;