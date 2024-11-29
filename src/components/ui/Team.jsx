import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { 
  Code, 
  Beaker, 
  Database, 
  Shield, 
  Server, 
  Network, 
  Sparkles 
} from 'lucide-react';

const TeamMembers = () => {
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

  const teamMembers = [
    {
      name: 'Hemendra Mehra',
      icon: Code,
      gradient: 'from-blue-500 to-cyan-400'
    },
    {
      name: 'Subrajeet Maharana',
      icon: Beaker,
      gradient: 'from-green-500 to-emerald-400'
    },
    {
      name: 'Raghavendra Kumar Sharma',
      icon: Network,
      gradient: 'from-purple-500 to-indigo-400'
    },
    {
      name: 'Satyajit Sahoo',
      icon: Server,
      gradient: 'from-red-500 to-orange-400'
    },
    {
      name: 'Sandeep Kumar',
      icon: Shield,
      gradient: 'from-yellow-500 to-amber-400'
    },
    {
      name: 'Sajan Jwala Ray',
      icon: Database,
      gradient: 'from-pink-500 to-rose-400'
    }
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center 
      bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 
      overflow-hidden py-20">
      {/* Animated Background Layers */}
      <motion.div 
        animate={controls}
        className="absolute inset-0 
          bg-gradient-to-tr from-blue-100/20 via-purple-100/20 to-pink-100/20 
          opacity-30 blur-3xl pointer-events-none z-0"
      />

      {/* Dynamic Particle System */}
      {[...Array(30)].map((_, i) => (
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
            Our Innovative Team
          </h2>
          <p className="text-2xl text-gray-700 max-w-3xl mx-auto 
            bg-gradient-to-r from-gray-800 via-gray-700 to-gray-900 
            bg-clip-text text-transparent">
            Passionate professionals driving the future of healthcare technology
          </p>
        </motion.div>

        {/* Team Members Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {teamMembers.map((member, index) => (
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
                bg-gradient-to-br ${member.gradient} bg-opacity-10`}
            >
              {/* Card Content */}
              <div className="relative p-8 text-center">
                <div className="flex justify-center mb-6">
                  <motion.div 
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                    className="p-4 rounded-full bg-white shadow-lg"
                  >
                    <member.icon 
                      className={`w-12 h-12 text-transparent bg-clip-text bg-gradient-to-r ${member.gradient}`} 
                      strokeWidth={1.5}
                    />
                  </motion.div>
                </div>
                <h3 className="text-2xl font-bold mb-2 text-white 
                  group-hover:text-transparent group-hover:bg-clip-text 
                  group-hover:bg-gradient-to-r group-hover:from-blue-200 
                  group-hover:to-purple-200 transition-all duration-300">
                  {member.name}
                </h3>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TeamMembers;