import React, { useState, useEffect } from 'react';
import { useClassroom } from '../contexts/ClassroomContext';
import { BookOpen, GraduationCap, Sparkles, CheckCircle2, ChevronRight, ExternalLink } from 'lucide-react';

const RegisteredSubjectsPage = ({ setCurrentPage }) => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { joinClassroom } = useClassroom();

  const loadRegisteredSubjects = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/student/dashboard/metrics', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSubjects(data.registered_subjects || []);
      } else {
        setError("Failed to fetch registered subjects.");
      }
    } catch (e) {
      console.error(e);
      setError("Server connection offline.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRegisteredSubjects();
  }, []);

  const handleJoinRoom = async (code) => {
    if (!code) return;
    try {
      await joinClassroom(code);
      setCurrentPage('live');
    } catch (err) {
      alert(`Could not join classroom "${code}". Please make sure the room session is active.`);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col justify-center items-center gap-3">
        <div className="h-8 w-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="text-xs uppercase tracking-widest font-extrabold text-gray-500">Loading Enrolled subjects...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-emerald-950/40 border border-gray-200 flex items-center justify-between shadow-[0_0_20px_rgba(0,0,0,0.3)]">
        <div className="space-y-1.5">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-400 border border-emerald-200">
            <Sparkles className="h-3 w-3 mr-1" /> Student Registry List
          </span>
          <h3 className="text-lg font-bold text-gray-900">Enrolled Courses & Registered Subjects</h3>
          <p className="text-gray-600 text-xs max-w-xl">
            View active grades, enrollment status, and enter classrooms to access lecture recordings, notes packets, and transcribe transcripts.
          </p>
        </div>
        <GraduationCap className="h-10 w-10 text-emerald-500/30 shrink-0 hidden md:block" />
      </div>

      {error && <div className="p-3.5 text-xs font-semibold rounded bg-red-50 border border-red-200 text-red-650">{error}</div>}

      {/* Grid of registered subjects */}
      {subjects.length === 0 ? (
        <div className="academic-card p-12 text-center max-w-lg mx-auto bg-white/40 border border-gray-200">
          <BookOpen className="h-8 w-8 text-gray-400 mx-auto mb-3 animate-pulse" />
          <h4 className="font-bold text-gray-800 text-sm">No Registered Subjects</h4>
          <p className="text-gray-500 text-xs mt-1">You are not currently registered or enrolled in any courses in the databases.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {subjects.map((sub, idx) => (
            <div 
              key={idx} 
              className="academic-card p-5 bg-white/40 border border-gray-200 flex flex-col justify-between hover:border-emerald-500/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.1)] transition-all duration-300 group"
            >
              <div className="space-y-4">
                {/* Heading */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <h5 className="font-bold text-gray-900 group-hover:text-emerald-400 transition-colors text-sm line-clamp-1">{sub.classroom_name}</h5>
                    <p className="text-[10px] text-gray-500 font-mono tracking-widest">{sub.classroom_code}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                    sub.status?.toLowerCase() === 'active' 
                      ? 'bg-emerald-50 text-emerald-400 border border-emerald-200' 
                      : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                  }`}>
                    {sub.status || 'Active'}
                  </span>
                </div>

                {/* Grade and Stats Grid */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase font-bold text-gray-500">Current Grade</span>
                    <p className="text-sm font-black text-indigo-600 font-mono tracking-wide">{sub.grade || 'N/A'}</p>
                  </div>
                  <div className="space-y-0.5 border-l border-gray-200 pl-3">
                    <span className="text-[9px] uppercase font-bold text-gray-500">Credit Weight</span>
                    <p className="text-sm font-black text-gray-800 font-mono">4.0</p>
                  </div>
                </div>

                {/* Simulated features */}
                <div className="space-y-2 text-[10px] text-gray-500 font-semibold pt-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>Resource Notes Packet Active</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>Real-time Transcribing Active</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-5 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleJoinRoom(sub.classroom_code)}
                  className="w-full py-2.5 rounded bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all duration-200 cursor-pointer active:scale-95"
                >
                  <span>Enter Classroom</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RegisteredSubjectsPage;
