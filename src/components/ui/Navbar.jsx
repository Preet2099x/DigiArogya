import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Users, MessageCircle, Menu, X } from 'lucide-react';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { name: 'Home', icon: Home },
    { name: 'Team', icon: Users },
    { name: 'Contact', icon: MessageCircle }
  ];

  const navVariants = {
    hidden: { opacity: 0, y: -50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.6, 
        type: "spring", 
        stiffness: 80 
      }
    }
  };

  const menuItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (index) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: index * 0.1,
        type: "spring",
        stiffness: 120
      }
    })
  };

  return (
    <motion.nav
      className="bg-white/80 backdrop-blur-md shadow-lg sticky top-0 z-50"
      variants={navVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="container mx-auto px-6 md:px-12 lg:px-20 py-4 flex justify-between items-center">
        {/* Logo */}
        <motion.div
          className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500"
          whileHover={{ 
            scale: 1.05,
            rotate: [0, -5, 5, 0],
            transition: { duration: 0.3 }
          }}
        >
          EHR Pro
        </motion.div>

        {/* Mobile Menu Toggle */}
        <motion.button
          className="md:hidden text-gray-600"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          whileTap={{ scale: 0.9 }}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </motion.button>

        {/* Desktop Menu */}
        <ul className="hidden md:flex space-x-8 text-gray-800 font-semibold">
          {menuItems.map((item, index) => (
            <motion.li
              key={item.name}
              className="cursor-pointer flex items-center gap-2 group"
              whileHover={{ 
                scale: 1.05,
                color: "#6366F1"
              }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <item.icon 
                className="text-gray-500 group-hover:text-indigo-500 transition-colors" 
                size={20} 
              />
              {item.name}
            </motion.li>
          ))}
        </ul>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              className="md:hidden absolute top-full left-0 w-full bg-white shadow-lg"
              initial={{ opacity: 0, height: 0 }}
              animate={{ 
                opacity: 1, 
                height: 'auto',
                transition: { duration: 0.3 }
              }}
              exit={{ 
                opacity: 0, 
                height: 0,
                transition: { duration: 0.2 }
              }}
            >
              <ul className="flex flex-col items-center py-4 space-y-4">
                {menuItems.map((item, index) => (
                  <motion.li
                    key={item.name}
                    className="cursor-pointer flex items-center gap-3 text-gray-700 hover:text-indigo-600"
                    variants={menuItemVariants}
                    initial="hidden"
                    animate="visible"
                    custom={index}
                  >
                    <item.icon size={20} />
                    {item.name}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

export default Navbar;