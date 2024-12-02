import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Info, Users, Settings, LogIn, UserPlus, Menu, X } from "lucide-react";
import { useLocation } from "react-router-dom";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const menuItems = [
    { name: "Home", icon: Home, path: "#home" },
    { name: "About", icon: Info, path: "#about" },
    { name: "Features", icon: Settings, path: "#features" },
    { name: "Team", icon: Users, path: "#team" },
  ];

  const authButtons = [
    { name: "Login", icon: LogIn, path: "/login" },
    { name: "Register", icon: UserPlus, path: "/register" },
  ];

  const navVariants = {
    hidden: { opacity: 0, y: -50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, type: "spring", stiffness: 80 },
    },
  };

  return (
    <motion.nav
      className="bg-white/80 backdrop-blur-lg shadow-md rounded-2xl fixed top-1 left-0 right-0 z-50 transition-all duration-30 hover:bg-white/90 mx-auto max-w-[90vw]  md:max-w-[85vw] lg:max-w-[80vw] mt-0.5 sm:mt-3 md:mt-4"
      variants={navVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="w-full mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          {/* Logo */}
          <div className="flex justify-between w-3/4 md:w-auto">
            <motion.div
              className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 tracking-tight"
              whileHover={{ scale: 1.02 }}
            >
              DigiArogya
            </motion.div>

            {/* Mobile Menu Toggle */}
            <motion.button
              className="md:hidden text-slate-900"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              whileTap={{ scale: 0.9 }}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </motion.button>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex flex-col md:flex-row items-center gap-6 md:gap-8">
            {/* Navigation Links */}
            <ul className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
              {menuItems.map((item) => (
                <motion.li key={item.name}>
                  <motion.a
                    href={item.path}
                    className={`px-4 py-2 rounded-full text-sm sm:text-base font-medium transition-colors
                    ${location.pathname === item.path
                        ? "bg-navy-100 text-navy-900"
                        : "text-gray-600 hover:text-navy-900 hover:bg-navy-100"
                      }`}
                    whileHover={{ scale: 1.05 }}
                  >
                    {item.name}
                  </motion.a>
                </motion.li>
              ))}
            </ul>

            {/* Auth Buttons */}
            <div className="flex items-center gap-4">
              {authButtons.map((button) => (
                <motion.a
                  key={button.name}
                  href={button.path}
                  className={`px-4 py-2 rounded-full text-sm font-medium
                    ${button.name === "Login"
                      ? "text-navy-900 border-2 border-navy-900 hover:bg-navy-100"
                      : "bg-navy-900 text-white hover:bg-navy-700"
                    }`}
                  whileHover={{ scale: 1.05 }}
                >
                  {button.name}
                </motion.a>
              ))}
            </div>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                className="md:hidden absolute top-full left-0 w-full bg-white shadow-lg rounded-b-2xl z-[100]"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="flex flex-col p-4 space-y-4">
                  {menuItems.map((item) => (
                    <motion.a
                      key={item.name}
                      href={item.path}
                      className={`flex items-center gap-2 p-2 rounded-lg
                        ${location.pathname === item.path
                          ? "bg-navy-100 text-navy-900"
                          : "text-gray-600 hover:bg-navy-100"
                        }`}
                      whileHover={{ scale: 1.02 }}
                    >
                      <item.icon size={18} />
                      {item.name}
                    </motion.a>
                  ))}
                  {authButtons.map((button) => (
                    <motion.a
                      key={button.name}
                      href={button.path}
                      className={`flex items-center gap-2 p-2 rounded-lg text-center
                        ${button.name === "Login"
                          ? "text-navy-900 border-2 border-navy-900 hover:bg-navy-100"
                          : "bg-navy-900 text-white hover:bg-navy-700"
                        }`}
                      whileHover={{ scale: 1.02 }}
                    >
                      <button.icon size={18} />
                      {button.name}
                    </motion.a>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
