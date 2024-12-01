import React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Shield, Database, Lock } from 'lucide-react';
import { Card, CardContent, Typography } from "@mui/material";

const ProblemStatement = () => {
  const problemItems = [
    { icon: <Database />, title: "Centralized Vulnerability", description: "Single point of failure increases risk of data breaches." },
    { icon: <Shield />, title: "Privacy Risks", description: "Patient data vulnerable to exposure and mishandling." },
    { icon: <AlertTriangle />, title: "Lack of Interoperability", description: "Limited data exchange capabilities between healthcare systems." },
    { icon: <Lock />, title: "Insecure Sharing", description: "Inadequate security measures in EHR data sharing." },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">

      <div className="container mx-auto relative z-10 max-w-5xl">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-3xl md:text-4xl font-bold text-center text-purple-900 mb-16 -mt-8"
        >
          Problems with Traditional EHR
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 lg:gap-12">
          {problemItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow duration-300">
                <CardContent className="flex flex-col items-center text-center p-6">
                  <div className="p-3 bg-purple-100 rounded-full mb-4">
                    {React.cloneElement(item.icon, { className: "w-8 h-8 text-red-500" })}
                  </div>
                  <Typography variant="h6" component="h3" className="text-gray-900 mb-2">
                    {item.title}
                  </Typography>
                  <Typography variant="body2" className="text-gray-600">
                    {item.description}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProblemStatement;

