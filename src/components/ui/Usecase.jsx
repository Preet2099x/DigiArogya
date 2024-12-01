import React from 'react';
import { motion } from 'framer-motion';
import { Hospital, Clipboard, Users } from 'lucide-react';

const useCases = [
  {
    icon: <Hospital className="w-12 h-12 text-blue-500" />,
    title: 'Hospitals',
    description: 'Streamline patient care with real-time access to records.',
  },
  {
    icon: <Clipboard className="w-12 h-12 text-green-500" />,
    title: 'Clinics',
    description: 'Reduce administrative overhead with secure data sharing.',
  },
  {
    icon: <Users className="w-12 h-12 text-purple-500" />,
    title: 'Patients',
    description: 'Enjoy full transparency and control over health data.',
  },
];

const UseCases = () => {
  return (
    <section className="container mx-auto min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <motion.h2
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, type: 'spring' }}
        className="text-4xl md:text-5xl font-bold text-center text-purple-900 mb-32 -mt-24"
      >
        Who Can Benefit?
      </motion.h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">
        {useCases.map((useCase, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{
              scale: 1.05,
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
            }}
            transition={{
              duration: 0.15,
              delay: index * 0.2,
              type: 'spring',
            }}
            className="bg-white rounded-xl shadow-lg p-6 text-center transform transition-transform"
          >
            <div className="mb-4 flex justify-center items-center">{useCase.icon}</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {useCase.title}
            </h3>
            <p className="text-gray-600">{useCase.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default UseCases;
