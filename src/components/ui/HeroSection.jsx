'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Shield, Lock, Database } from 'lucide-react'
import { Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'

export default function HeroSection() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100">
      {/* Animated background elements */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
      >
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-200 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-300 rounded-full blur-3xl" />
      </motion.div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-32 pt-28 sm:pt-36 lg:pt-72">
        <motion.div
          className="max-w-4xl mx-auto text-center space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-5xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-purple-900 leading-tight">
            Secure Healthcare Records on Blockchain
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl text-gray-600 font-semibold max-w-3xl mx-auto leading-relaxed">
            Revolutionizing Healthcare Data Management with Secure, Transparent, and Efficient Blockchain Technology
          </p>

          {/* Feature icons */}
          <motion.div
            className="flex justify-center gap-8 py-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            {[
              { Icon: Shield, label: 'Secure' },
              { Icon: Lock, label: 'Private' },
              { Icon: Database, label: 'Distributed' }
            ].map(({ Icon, label }) => (
              <motion.div
                key={label}
                className="flex flex-col items-center gap-2"
                whileHover={{ scale: 1.05 }}
              >
                <div className="p-3 bg-white/80 backdrop-blur-sm rounded-lg shadow-lg">
                  <Icon className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-base sm:text-lg text-purple-700 font-medium">{label}</span>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <Button
              variant="contained"
              onClick={() => navigate('/register')}
              endIcon={<ArrowRight className="w-4 h-4" />}
              sx={{
                backgroundColor: '#4C1D95',
                '&:hover': {
                  backgroundColor: '#5B21B6',
                },
                borderRadius: '9999px',
                padding: '12px 32px',
                textTransform: 'none',
                fontSize: '1.1rem'
              }}
            >
              Get Started
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

