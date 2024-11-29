import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import image1 from './image1.png';
import image2 from './image2.png';

const HeroSection = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const images = [
    { doctor: image1, patient: image2 },
    { doctor: image2, patient: image1 }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        (prevIndex + 1) % images.length
      );
    }, 3000);

    return () => clearInterval(interval);
  }, );

  const currentImages = images[currentImageIndex];

  return (
    <div className="min-h-screen flex items-center justify-center 
      bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 
      animate-gradient-x p-8 relative overflow-hidden">
      {/* Advanced Animated Gradient Backgrounds */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: [0.2, 0.4, 0.2],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          repeatType: "loop",
          ease: "easeInOut"
        }}
        className="absolute inset-0 
          bg-gradient-to-tr from-blue-100/30 via-purple-100/30 to-pink-100/30 
          opacity-30 blur-3xl pointer-events-none"
      />

      {/* Color Flowing Particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div 
          key={i}
          initial={{ 
            opacity: 0,
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight
          }}
          animate={{ 
            opacity: [0, 0.5, 0],
            x: [
              Math.random() * window.innerWidth, 
              Math.random() * window.innerWidth, 
              Math.random() * window.innerWidth
            ],
            y: [
              Math.random() * window.innerHeight, 
              Math.random() * window.innerHeight, 
              Math.random() * window.innerHeight
            ],
            scale: [0.5, 1, 0.5],
            backgroundColor: [
              'rgba(59, 130, 246, 0.2)', 
              'rgba(124, 58, 237, 0.3)', 
              'rgba(244, 63, 94, 0.2)'
            ]
          }}
          transition={{
            duration: Math.random() * 10 + 5,
            repeat: Infinity,
            repeatType: "loop",
            ease: "easeInOut"
          }}
          className="absolute rounded-full 
            w-4 h-4 
            bg-opacity-20 
            blur-xl"
        />
      ))}

      <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ 
            duration: 0.8, 
            type: "spring", 
            stiffness: 70 
          }}
          className="text-center md:text-left space-y-6"
        >
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              textShadow: [
                '0 0 5px rgba(59, 130, 246, 0.3)',
                '0 0 10px rgba(124, 58, 237, 0.3)',
                '0 0 5px rgba(59, 130, 246, 0.3)'
              ]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse"
            }}
            className="text-6xl font-extrabold mb-6 
              bg-clip-text text-transparent 
              bg-gradient-to-r from-blue-700 via-purple-700 to-pink-600"
          >
            Electronic Health Records
          </motion.h1>
          <p className="text-xl text-gray-700 mb-8 
            bg-gradient-to-r from-gray-800 via-gray-700 to-gray-900 
            bg-clip-text text-transparent
            leading-relaxed tracking-wide">
            Revolutionizing healthcare management with intelligent, 
            intuitive digital solutions that empower medical professionals.
          </p>
          <div className="flex justify-center md:justify-start space-x-4">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-10 py-4 
                bg-gradient-to-r from-blue-600 via-purple-700 to-pink-600 
                text-white rounded-full 
                hover:shadow-xl transition duration-300 
                transform 
                hover:bg-gradient-to-br 
                focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50
                tracking-wider uppercase text-sm font-semibold
                group relative overflow-hidden"
            >
              <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></span>
              Get Started
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-10 py-4 
                border-2 border-gray-300 
                text-gray-700 rounded-full 
                hover:bg-gray-100 
                transition duration-300
                tracking-wider uppercase text-sm font-semibold"
            >
              Learn More
            </motion.button>
          </div>
        </motion.div>

        <motion.div 
          key={currentImageIndex}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            boxShadow: [
              '0 25px 50px -12px rgba(59, 130, 246, 0.2)',
              '0 25px 50px -12px rgba(124, 58, 237, 0.2)',
              '0 25px 50px -12px rgba(59, 130, 246, 0.2)'
            ]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse"
          }}
          className="flex justify-center items-center space-x-8 w-full"
        >
          {/* Image containers remain the same as in previous version */}
          <div className="relative group w-full max-w-sm mx-auto 
            transform transition-transform duration-300 
            hover:-translate-y-4 hover:scale-[1.02]">
            <div className="bg-white rounded-2xl p-4 shadow-2xl 
              border border-gray-100 
              transition-all duration-300 
              group-hover:shadow-3xl">
              <svg 
                className="w-full h-auto rounded-xl" 
                viewBox="0 0 400 500"
              >
                <defs>
                  <linearGradient id="imageOverlay" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgba(59,130,246,0.2)" />
                    <stop offset="100%" stopColor="rgba(124,58,237,0.2)" />
                  </linearGradient>
                  <clipPath id="doctorClip">
                    <rect x="0" y="0" width="400" height="500" rx="20" ry="20"/>
                  </clipPath>
                </defs>
                <image 
                  href={currentImages.doctor}
                  x="0" y="0" 
                  width="400" 
                  height="500" 
                  clipPath="url(#doctorClip)"
                  preserveAspectRatio="cover"
                />
                <rect 
                  x="0" y="0" 
                  width="400" 
                  height="500" 
                  fill="url(#imageOverlay)" 
                  clipPath="url(#doctorClip)"
                />
              </svg>
            </div>
          </div>

          <div className="relative group w-full max-w-sm mx-auto 
            transform transition-transform duration-300 
            hover:-translate-y-4 hover:scale-[1.02]">
            <div className="bg-white rounded-2xl p-4 shadow-2xl 
              border border-gray-100 
              transition-all duration-300 
              group-hover:shadow-3xl">
              <svg 
                className="w-full h-auto rounded-xl" 
                viewBox="0 0 400 500"
              >
                <defs>
                  <linearGradient id="imageOverlay2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgba(124,58,237,0.2)" />
                    <stop offset="100%" stopColor="rgba(244,63,94,0.2)" />
                  </linearGradient>
                  <clipPath id="patientClip">
                    <rect x="0" y="0" width="400" height="500" rx="20" ry="20"/>
                  </clipPath>
                </defs>
                <image 
                  href={currentImages.patient}
                  x="0" y="0" 
                  width="400" 
                  height="500" 
                  clipPath="url(#patientClip)"
                  preserveAspectRatio="cover"
                />
                <rect 
                  x="0" y="0" 
                  width="400" 
                  height="500" 
                  fill="url(#imageOverlay2)" 
                  clipPath="url(#patientClip)"
                />
              </svg>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HeroSection;