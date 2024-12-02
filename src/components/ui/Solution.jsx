import React from "react";
import { motion } from "framer-motion";
import { Shield, Globe, User, Lock } from "lucide-react";
import blockchain3DImage from "../../assets/blockchain3D.png"

const SolutionOverview = () => {
  const solutionItems = [
    { icon: Shield, title: "Decentralized Security" },
    { icon: Globe, title: "Seamless Interoperability" },
    { icon: User, title: "Patient-Centric Control" },
    { icon: Lock, title: "Encrypted Sharing" },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center 
    bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 
    px-4 py-16 md:p-8 relative overflow-hidden">

      {/* Animated Gradient Background */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 
        bg-gradient-to-tr from-blue-100/30 via-purple-100/30 to-pink-100/30 
        opacity-30 blur-3xl pointer-events-none"
      />
      <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-24 mt-32">
        How Blockchain Enhances EHR
      </h1>

      <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">

        {/* Text Section */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, type: "spring", stiffness: 70 }}
          className="space-y-6 text-center md:text-left"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
            {solutionItems.map(({ icon: Icon, title }, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center p-6 
                  bg-white/20 backdrop-blur-sm rounded-xl 
                  border-2 border-gray-200/60 shadow-md
                  hover:shadow-2xl hover:border-blue-200/60 transition duration-300"
              >
                <Icon className="text-blue-700 mb-4 w-12 h-12" />
                <p className="text-gray-700 font-semibold">{title}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Image Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className="flex justify-center items-center w-full p-4"
        >
          <img
            src={blockchain3DImage}
            alt="Blockchain Image"
            className="rounded-xl shadow-2xl w-full max-w-md object-cover"
          />
        </motion.div>
      </div>
    </div>
  );
};

export default SolutionOverview;
