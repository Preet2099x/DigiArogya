import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, Typography, Avatar } from "@mui/material";

const Supervisor = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100 p-8 relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 5, repeat: Infinity, repeatType: "reverse" }}
        className="absolute inset-0 bg-gradient-to-tr from-purple-100/30 via-indigo-100/30 to-pink-100/30 blur-3xl"
      />

      <div className="container mx-auto relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl md:text-5xl font-bold text-center text-purple-900 mb-12"
        >
          Project Supervisor
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Card className="max-w-2xl mx-auto bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow duration-300">
            <CardContent className="flex flex-col items-center p-8">
              <Avatar
                src="https://www.nitjsr.ac.in/backend/uploads/Faculty/CS111/profile/e3d3bd02-77d7-4609-8410-6a7d5c408351.jpg"
                alt="Supervisor Name"
                sx={{ width: 200, height: 200, mb: 4 }}
              />
              <Typography variant="h4" component="h3" className="text-purple-900 mb-4">
                Dr. Dinesh Kumar
              </Typography>
              <Typography variant="subtitle1" className="text-indigo-600 mb-4">
                Assistant Professor,Computer Science and Engineering
              </Typography>
              <Typography variant="body1" className="text-gray-600 text-center max-w-lg">
                Dr. Dinesh Kumar has been an instrumental guide throughout our project, providing valuable insights and direction. As an Assistant Professor at NIT Jamshedpur with expertise in Blockchain and Distributed Systems, his mentorship has been crucial to the success of our work.
              </Typography>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Supervisor;

