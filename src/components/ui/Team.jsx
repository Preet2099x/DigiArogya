import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, Typography, Avatar, IconButton } from "@mui/material";
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Team = () => {
  const teamMembers = [
    { name: "Subrajeet Maharana", role: "2022PGCSCA034", image: "https://avatars.githubusercontent.com/u/63863201?v=4" },
    { name: "Hemendra Mehra", role: "2022PGCSCA036", image: "https://media.licdn.com/dms/image/v2/D4D03AQFs05rz2Lue4A/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1696144373424?e=1738800000&v=beta&t=TMQ3dTFriRRnKyK8hoTMJVmZJdiRdqGW0V5osE6XvRY" },
    { name: "Raghavendra Sharma", role: "2022PGCSCA035", image: "https://avatars.githubusercontent.com/u/137503421?v=4" },
    { name: "Sajan Jwala Ray", role: "2022PGCSCA082", image: "https://avatars.githubusercontent.com/u/143657982?v=4" },
    { name: "Satyajit Sahoo", role: "2022PGCSCA081", image: "https://avatars.githubusercontent.com/u/133905749?v=4" },
    { name: "Sandeep Kumar", role: "2022PGCSCA080", image: "https://avatars.githubusercontent.com/u/132326008?v=4" },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  const nextMember = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % teamMembers.length);
  };

  const prevMember = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + teamMembers.length) % teamMembers.length);
  };

  return (
    <div className="min-h-screen flex items-center justify-center  p-8 relative overflow-hidden">
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
          Our Team
        </motion.h2>

        <div className="flex items-center justify-center gap-4">
          <IconButton onClick={prevMember} className="text-purple-600">
            <ChevronLeft className="w-8 h-8" />
          </IconButton>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-6xl">
            {[0, 1, 2].map((offset) => {
              const index = (currentIndex + offset) % teamMembers.length;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.5 }}
                  className={`${offset === 1 ? 'block' : 'hidden md:block'} ${offset === 2 ? 'hidden lg:block' : ''}`}
                >
                  <Card className="bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow duration-300">
                    <CardContent className="flex flex-col items-center p-8 mt-2">
                      <Avatar
                        src={teamMembers[index].image}
                        alt={teamMembers[index].name}
                        sx={{ width: 150, height: 150, mb: 4 }}
                      />
                      <Typography variant="h5" component="h3" className="text-purple-800 mb-2">
                        {teamMembers[index].name}
                      </Typography>
                      <Typography variant="subtitle1" className="text-gray-600">
                        {teamMembers[index].role}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <IconButton onClick={nextMember} className="text-purple-600">
            <ChevronRight className="w-8 h-8" />
          </IconButton>
        </div>

        <div className="flex justify-center mt-8">
          {teamMembers.map((_, index) => (
            <motion.div
              key={index}
              className={`w-3 h-3 rounded-full mx-1 ${index === currentIndex ? "bg-gray-600" : "bg-gray-200"
                }`}
              whileHover={{ scale: 1.2 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Team;

