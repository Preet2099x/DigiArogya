import React from "react";
import { motion } from 'framer-motion';
import solutionImage from "../assets/solution.png";

const SolutionOverview = () => {
  const solutionItems = [
    { icon: '🔐', title: 'Decentralized Security' },
    { icon: '🌐', title: 'Seamless Interoperability' },
    { icon: '👤', title: 'Patient-Centric Control' },
    { icon: '🛡️', title: 'Encrypted Sharing' }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center 
      bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 
      animate-gradient-x p-8 relative overflow-hidden">
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
            How Blockchain Enhances EHR
          </motion.h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 text-center">
            {solutionItems.map((item, index) => (
              <motion.div 
                key={index}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-4 bg-white/10 backdrop-blur-sm rounded-xl 
                  border border-gray-300 
                  hover:shadow-xl transition duration-300"
              >
                <span className="text-4xl block mb-4">{item.icon}</span>
                <p className="text-gray-700 font-semibold">{item.title}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div 
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
          className="flex justify-center items-center w-full"
        >
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
                  <clipPath id="solutionClip">
                    <rect x="0" y="0" width="400" height="500" rx="20" ry="20"/>
                  </clipPath>
                </defs>
                <image 
                  href={solutionImage}
                  x="0" y="0" 
                  width="400" 
                  height="500" 
                  clipPath="url(#solutionClip)"
                  preserveAspectRatio="cover"
                />
                <rect 
                  x="0" y="0" 
                  width="400" 
                  height="500" 
                  fill="url(#imageOverlay)" 
                  clipPath="url(#solutionClip)"
                />
              </svg>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SolutionOverview;