import React from 'react';
import { UserCheck, Award, Medal, Star } from 'lucide-react';

const ProjectSupervisor = () => {
  return (
    <section className="relative py-20 bg-gradient-to-br from-gray-50 to-white overflow-hidden">
      {/* Animated Background Shapes */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply opacity-20 animate-blob transform-gpu"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply opacity-20 animate-blob-reverse transform-gpu"></div>
      </div>

      {/* Content Container */}
      <div className="container relative mx-auto px-4 z-10">
        <div className="max-w-4xl mx-auto bg-white border border-purple-100 rounded-3xl shadow-2xl shadow-purple-100/50 overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-3xl">
          <div className="p-8 md:p-12 flex flex-col md:flex-row items-center space-y-6 md:space-y-0">
            {/* Supervisor Image with Hover Effect */}
            <div className="w-48 h-48 mb-6 md:mb-0 md:mr-10 group">
              <div className="relative">
                <img 
                  src="/api/placeholder/400/400" 
                  alt="Dr. Supervisor's Profile"
                  className="w-48 h-48 rounded-full object-cover border-4 border-white shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:rotate-3 group-hover:shadow-xl"
                />
                <div className="absolute bottom-0 right-0 bg-purple-500 text-white rounded-full p-1 transform translate-x-2 translate-y-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <Star className="w-4 h-4" fill="currentColor" />
                </div>
              </div>
            </div>

            {/* Supervisor Details */}
            <div className="flex-1">
              <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 mb-4 animate-text-shimmer bg-[length:250%_100%]">
                Project Supervisor
              </h2>
              <div className="space-y-4">
                <div className="flex items-center transform transition-transform hover:translate-x-2 hover:scale-[1.02]">
                  <Award className="w-7 h-7 mr-3 text-purple-500 transition-colors group-hover:text-purple-600" strokeWidth={1.5} />
                  <h3 className="text-2xl font-bold text-gray-800 transition-colors hover:text-purple-700">
                    Dr. Dinesh Kumar
                  </h3>
                </div>
                <div className="flex items-center transform transition-transform hover:translate-x-2 hover:scale-[1.02]">
                  <Medal className="w-7 h-7 mr-3 text-indigo-500 transition-colors group-hover:text-indigo-600" strokeWidth={1.5} />
                  <p className="text-lg text-gray-600 font-medium transition-colors hover:text-indigo-700">
                    Expert in Blockchain
                  </p>
                </div>
                <p className="text-gray-700 mt-4 leading-relaxed opacity-80 hover:opacity-100 transition-opacity">
                  With extensive experience in blockchain applications, Dr. Dinesh Kumar guides the project to success. His innovative approach bridges the gap between cutting-edge technology and healthcare solutions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Tailwind Animations */}
      <style jsx global>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }

        @keyframes blob-reverse {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-30px, 50px) scale(1.1); }
          66% { transform: translate(20px, -20px) scale(0.9); }
        }

        @keyframes text-shimmer {
          from { background-position: 200% 0; }
          to { background-position: -200% 0; }
        }

        .animate-blob {
          animation: blob 15s ease-in-out infinite;
        }

        .animate-blob-reverse {
          animation: blob-reverse 15s ease-in-out infinite;
        }

        .animate-text-shimmer {
          background-image: linear-gradient(90deg, 
            theme('colors.purple.600'), 
            theme('colors.indigo.600'), 
            theme('colors.purple.600')
          );
          background-size: 250% 100%;
          animation: text-shimmer 3s linear infinite;
        }
      `}</style>
    </section>
  );
};

export default ProjectSupervisor;