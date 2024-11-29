import React from "react";
import { motion } from 'framer-motion';

const Features = () => {
  const features = [
    {
      icon: "✅",
      title: "Assurance and Reliability",
    },
    {
      icon: "🕵️‍♂️",
      title: "Audit Trail Transparency",
    },
    {
      icon: "🤝",
      title: "Streamlined Collaboration",
    },
  ];

  return (
    <section className="min-h-screen flex items-center justify-center 
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

      <div className="container mx-auto text-center relative z-10">
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
          className="text-6xl font-extrabold mb-12 
            bg-clip-text text-transparent 
            bg-gradient-to-r from-blue-700 via-purple-700 to-pink-600"
        >
          Key Advantages of EHR Solution
        </motion.h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
          {features.map((feature, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                delay: index * 0.2, 
                duration: 0.8, 
                type: "spring", 
                stiffness: 70 
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-6 bg-white/10 backdrop-blur-sm rounded-xl 
                border border-gray-300 
                hover:shadow-xl transition duration-300"
            >
              <span className="text-5xl block mb-4">{feature.icon}</span>
              <p className="text-gray-700 font-semibold text-xl">{feature.title}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;