import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  User as UserIcon, 
  Sliders, 
  ShieldCheck, 
  HelpCircle, 
  Save, 
  UserSquare2,
  Tv2
} from 'lucide-react';

const SettingsPage = () => {
  const { user } = useAuth();
  
  // Profile local state fields
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [whisperSensitivity, setWhisperSensitivity] = useState(82);
  const [simLLM, setSimLLM] = useState("Llama-3-Academic");
  const [success, setSuccess] = useState("");

  const handleSave = (e) => {
    e.preventDefault();
    setSuccess("Settings updated and synchronised successfully across active configurations.");
    setTimeout(() => setSuccess(""), 4000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 select-text">
      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
          {success}
        </div>
      )}

      {/* Main Settings Card */}
      <div className="academic-card p-8">
        <h3 className="font-bold text-lg text-gray-800 border-b border-gray-200 pb-4 mb-6 flex items-center space-x-2">
          <UserSquare2 className="h-5.5 w-5.5 text-indigo-500" />
          <span>Academic Portal Settings</span>
        </h3>

        <form onSubmit={handleSave} className="space-y-6">
          {/* User Name & Bio */}
          <div className="space-y-4">
            <h4 className="text-xs uppercase font-extrabold tracking-widest text-indigo-600">Profile Details</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-500 mb-1.5">Registered Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-500 mb-1.5">Institutional Role</label>
                <input
                  type="text"
                  disabled
                  value={user?.role?.toUpperCase() || "STUDENT"}
                  className="w-full bg-gray-100/50 border border-gray-200 rounded px-3.5 py-2.5 text-xs text-gray-500 font-bold uppercase cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-500 mb-1.5">Professional Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-indigo-500 resize-none h-20"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-gray-200 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5"
            >
              <Save className="h-4 w-4" />
              <span>Save Settings Parameters</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;
