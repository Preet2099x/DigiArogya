import React from "react";
import { motion } from "framer-motion";
import { Shield, Lock, Zap, Shuffle } from 'lucide-react';
import { Card, CardContent, Typography, Button } from "@mui/material";

const Features = () => {
  const featureItems = [
    { icon: <Shield />, title: "Enhanced Security", description: "Blockchain technology ensures tamper-proof and secure storage of health records." },
    { icon: <Lock />, title: "Privacy Control", description: "Patients have full control over who can access their health information." },
    { icon: <Zap />, title: "Efficient Access", description: "Quick and easy access to patient data for authorized healthcare providers." },
    { icon: <Shuffle />, title: "Interoperability", description: "Seamless data exchange between different healthcare systems and providers." },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-100 p-8 relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 5, repeat: Infinity, repeatType: "reverse" }}
        className="absolute inset-0 bg-gradient-to-tr from-indigo-100/30 via-purple-100/30 to-pink-100/30 blur-3xl"
      />

      <div className="container mx-auto relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl md:text-5xl font-bold text-center text-purple-900 mb-12"
        >
          Key Features
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {featureItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow duration-300">
                <CardContent className="flex items-start p-6">
                  <div className="p-3 bg-purple-100 rounded-full mr-4">
                    {React.cloneElement(item.icon, { className: "w-8 h-8 text-purple-600" })}
                  </div>
                  <div>
                    <Typography variant="h6" component="h3" className="text-purple-900 mb-2">
                      {item.title}
                    </Typography>
                    <Typography variant="body2" className="text-gray-600">
                      {item.description}
                    </Typography>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-center"
        >
          <Button
            variant="contained"
            size="large"
            sx={{
              backgroundColor: "#4C1D95",
              "&:hover": { backgroundColor: "#5B21B6" },
              borderRadius: "9999px",
              padding: "12px 32px",
              textTransform: "none",
              fontSize: "1.1rem",
            }}
          >
            Learn More
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default Features;
