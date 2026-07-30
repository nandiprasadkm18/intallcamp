import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { GraduationCap, Lock, Mail, User as UserIcon, Shield, ArrowLeft, Eye, EyeOff } from 'lucide-react';

const AuthPage = ({ onBackToLanding }) => {
  const { login, signup } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('student'); // student, teacher, admin
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [section, setSection] = useState('7th Sem A');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(name, email, password, role, section);
      }
    } catch (err) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center items-center px-4 relative">
      {/* Background decorations */}
      <div className="absolute inset-0 grid-overlay opacity-30 z-0"></div>
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-black/5 blur-[100px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-whitelue-600/5 blur-[100px] rounded-full pointer-events-none"></div>

      {/* Floating Back Button */}
      <button 
        onClick={onBackToLanding}
        className="absolute top-6 left-6 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors flex items-center space-x-2 z-10"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Landing</span>
      </button>

      {/* Auth Card Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-black/5 rounded-xl border border-gray-200 text-gray-800 mb-4">
            <GraduationCap className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-normal text-gray-900">INTELLCAMP Smart Classroom</h2>
          <p className="text-gray-500 text-xs mt-2 uppercase font-medium tracking-widest">Enterprise Portal Gateway</p>
        </div>

        {/* Card */}
        <div className="academic-card p-8 bg-white/80 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
          {/* Card Title */}
          <div className="flex border-b border-gray-200 pb-5 mb-6">
            <button
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 text-center font-bold text-sm uppercase pb-2 border-b-2 transition-all ${
                isLogin 
                  ? 'border-indigo-500 text-indigo-600' 
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 text-center font-bold text-sm uppercase pb-2 border-b-2 transition-all ${
                !isLogin 
                  ? 'border-indigo-500 text-indigo-600' 
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              Register
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-650 text-xs font-semibold text-center">
                {error}
              </div>
            )}



            {/* Full Name (Only for Register) */}
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 tracking-wider mb-1.5">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                    placeholder="Enter full name"
                  />
                </div>
              </div>
            )}

            {/* Section (Only for Student Register) */}
            {!isLogin && role === 'student' && (
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 tracking-wider mb-1.5">Section</label>
                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                >
                  <option value="7th Sem A">7th Sem A</option>
                  <option value="7th Sem B">7th Sem B</option>
                  <option value="7th Sem C">7th Sem C</option>
                  <option value="7th Sem D">7th Sem D</option>
                </select>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 tracking-wider mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                  placeholder="name@university.edu"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-10 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 disabled:bg-gray-400 transition-colors font-medium text-sm shadow-sm flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>{isLogin ? 'Sign Into Platform' : 'Create Academic Profile'}</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
