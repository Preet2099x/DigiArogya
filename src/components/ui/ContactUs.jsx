import React, { useState } from 'react';
import { motion } from 'framer-motion';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Implement form submission logic
    console.log(formData);
  };

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

      <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, type: "spring", stiffness: 70 }}
          className="space-y-6 text-center md:text-left"
        >
          <h1 className="text-6xl font-extrabold mb-6 
            bg-clip-text text-transparent 
            bg-gradient-to-r from-blue-700 via-purple-700 to-pink-600">
            Contact EHR Pro
          </h1>
          <p className="text-xl text-gray-700 mb-8 
            bg-gradient-to-r from-gray-800 via-gray-700 to-gray-900 
            bg-clip-text text-transparent
            leading-relaxed tracking-wide">
            Have questions about our healthcare management solutions? 
            We're here to help you transform your medical practice.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="bg-white rounded-2xl p-8 shadow-2xl border border-gray-100"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 
                  border border-gray-300 rounded-lg 
                  focus:outline-none focus:ring-2 
                  focus:ring-blue-500 focus:border-transparent 
                  transition duration-300"
                placeholder="Your Full Name"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 
                  border border-gray-300 rounded-lg 
                  focus:outline-none focus:ring-2 
                  focus:ring-purple-500 focus:border-transparent 
                  transition duration-300"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows="4"
                className="w-full px-4 py-3 
                  border border-gray-300 rounded-lg 
                  focus:outline-none focus:ring-2 
                  focus:ring-pink-500 focus:border-transparent 
                  transition duration-300 resize-none"
                placeholder="How can we help you?"
              />
            </div>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="w-full px-10 py-4 
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
              Send Message
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default ContactUs;