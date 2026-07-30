import React from 'react';
import { Hammer } from 'lucide-react';

const ComingSoon = ({ moduleName = "module" }) => {
  return (
    <div className="bg-white p-8 animate-fade-in font-sans min-h-full flex justify-center items-center h-[60vh]">
      <div className="text-center p-8 border border-gray-200 rounded-lg bg-gray-50 max-w-md shadow-sm">
        <div className="flex justify-center mb-4">
          <div className="bg-indigo-100 p-3 rounded-full">
            <Hammer className="h-8 w-8 text-indigo-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Coming Soon</h2>
        <p className="text-gray-500">
          The <span className="font-semibold text-gray-700">{moduleName}</span> module is currently under construction for the enterprise edition.
        </p>
      </div>
    </div>
  );
};

export default ComingSoon;
