import React from 'react';
import { 
  GraduationCap, 
  ArrowRight, 
  Cpu
} from 'lucide-react';

const LandingPage = ({ onGetStarted }) => {
  return (
    <div className="bg-white text-gray-900 min-h-screen flex flex-col font-sans selection:bg-gray-200">
      {/* Navbar */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50 px-6 lg:px-16 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <GraduationCap className="h-8 w-8 text-black" />
          <div>
            <span className="font-medium text-xl tracking-tight text-black">INTELLCAMP</span>
            <p className="text-[9px] uppercase font-medium text-gray-500 tracking-widest">Smart Classroom</p>
          </div>
        </div>
        <div>
          <button 
            onClick={onGetStarted}
            className="px-5 py-2.5 rounded-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 transition-all font-semibold text-sm flex items-center space-x-2"
          >
            <span>Launch Platform</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 lg:px-16 pt-32 pb-40 flex flex-col items-center text-center overflow-hidden flex-1 justify-center bg-gray-50">
        <div className="relative z-10 max-w-4xl flex flex-col items-center">
          <h1 className="text-5xl sm:text-7xl font-normal leading-[1.1] text-black max-w-3xl mb-8">
            The AI-Powered Classroom
          </h1>


          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <button 
              onClick={onGetStarted}
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 transition-all font-bold text-base shadow-lg shadow-black/10 hover:shadow-black/20 flex items-center justify-center space-x-2"
            >
              <span>Get Started Now</span>
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white px-6 lg:px-16 py-12 text-center text-xs text-gray-500 font-semibold">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 max-w-6xl mx-auto">
          <div className="flex items-center space-x-3 text-left">
            <GraduationCap className="h-6 w-6 text-black" />
            <div>
              <span className="font-medium text-sm tracking-tight text-gray-900 block">INTELLCAMP</span>
              <p className="text-[8px] uppercase font-medium text-gray-500 tracking-widest">Smart Classroom</p>
            </div>
          </div>
          <div>
            &copy; 2026 INTELLCAMP Academic Enterprise Systems Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
