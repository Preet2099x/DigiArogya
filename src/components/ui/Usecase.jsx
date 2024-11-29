import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Hospital, Clipboard, Users, Sparkles } from 'lucide-react';

const UseCases = () => {
  const controls = useAnimation();

  useEffect(() => {
    const animateBackground = async () => {
      await controls.start({
        opacity: [0.2, 0.4, 0.2],
        scale: [1, 1.05, 1],
        transition: { 
          duration: 5, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }
      });
    };

    animateBackground();
  }, [controls]);

  const useCaseData = [
    {
      icon: Hospital,
      title: 'Hospitals',
      description: 'Streamline patient care with real-time access to records.',
      gradient: 'from-blue-500 to-cyan-400',
      bgGradient: 'bg-gradient-to-br from-blue-50 to-cyan-100'
    },
    {
      icon: Clipboard,
      title: 'Clinics',
      description: 'Reduce administrative overhead with secure data sharing.',
      gradient: 'from-green-500 to-emerald-400',
      bgGradient: 'bg-gradient-to-br from-green-50 to-emerald-100'
    },
    {
      icon: Users,
      title: 'Patients',
      description: 'Enjoy full transparency and control over health data.',
      gradient: 'from-purple-500 to-indigo-400',
      bgGradient: 'bg-gradient-to-br from-purple-50 to-indigo-100'
    }
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center 
      bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 
      overflow-hidden py-20">
      {/* Blob Animations */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          animate={{
            transform: [
              'translate(0px, 0px) scale(1)',
              'translate(30px, -50px) scale(1.1)',
              'translate(-20px, 20px) scale(0.9)',
              'translate(0px, 0px) scale(1)'
            ]
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full 
            mix-blend-multiply filter blur-2xl opacity-30"
        />
        <motion.div 
          animate={{
            transform: [
              'translate(0px, 0px) scale(1)',
              'translate(-30px, 50px) scale(1.1)',
              'translate(20px, -20px) scale(0.9)',
              'translate(0px, 0px) scale(1)'
            ]
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute bottom-0 left-0 w-96 h-96 bg-purple-100 rounded-full 
            mix-blend-multiply filter blur-2xl opacity-30"
        />
      </div>

      {/* Animated Background Layers */}
      <motion.div 
        animate={controls}
        className="absolute inset-0 
          bg-gradient-to-tr from-blue-100/20 via-purple-100/20 to-pink-100/20 
          opacity-30 blur-3xl pointer-events-none z-0"
      />

      {/* Dynamic Particle System */}
      {[...Array(50)].map((_, i) => (
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
            w-6 h-6 
            bg-opacity-20 
            blur-xl 
            bg-gradient-to-r from-blue-300/30 via-purple-400/30 to-pink-300/30"
        />
      ))}

      {/* Content Container */}
      <div className="container relative mx-auto px-4 z-10">
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, type: "spring" }}
          className="text-center mb-16"
        >
          <h2 className="text-6xl font-extrabold text-transparent bg-clip-text 
            bg-gradient-to-r from-blue-700 via-purple-700 to-pink-600 mb-6
            flex items-center justify-center gap-4">
            <Sparkles className="text-purple-500" />
            Who Can Benefit?
          </h2>
          <p className="text-2xl text-gray-700 max-w-3xl mx-auto 
            bg-gradient-to-r from-gray-800 via-gray-700 to-gray-900 
            bg-clip-text text-transparent">
            Revolutionizing healthcare data management with blockchain technology
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {useCaseData.map((useCase, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ 
                scale: 1.05, 
                boxShadow: "0 25px 50px -12px rgba(59, 130, 246, 0.2)"
              }}
              transition={{ 
                duration: 0.5, 
                delay: index * 0.2,
                type: "spring",
                stiffness: 300
              }}
              className={`relative group overflow-hidden rounded-2xl shadow-2xl 
                ${useCase.bgGradient}`}
            >
              {/* Glowing Overlay */}
              <div 
                className={`absolute inset-0 
                  bg-gradient-to-r ${useCase.gradient} 
                  opacity-10 group-hover:opacity-20 
                  transition-all duration-300`}
              ></div>

              {/* Card Content */}
              <div className="relative p-8 text-center">
                <div className="flex justify-center mb-6">
                  <div 
                    className={`p-3 rounded-full 
                      bg-gradient-to-br ${useCase.gradient} 
                      shadow-lg transform transition-transform 
                      group-hover:scale-110`}
                  >
                    <useCase.icon 
                      className="w-12 h-12 text-white" 
                      strokeWidth={1.5}
                    />
                  </div>
                </div>
                <h3 
                  className="text-2xl font-bold mb-4 text-gray-800 
                    group-hover:text-transparent group-hover:bg-clip-text 
                    group-hover:bg-gradient-to-r group-hover:from-blue-600 
                    group-hover:to-purple-600 transition-all duration-300"
                >
                  {useCase.title}
                </h3>
                <p className="text-gray-700 text-base">
                  {useCase.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCases;