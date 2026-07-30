import React, { useState, useEffect } from 'react';
import { useClassroom } from '../contexts/ClassroomContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Sparkles, MapPin, ExternalLink, Columns, List, ChevronRight } from 'lucide-react';

const TimetablePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("timeline"); // timeline, weekly

  // Detect current day of the week to pre-select, default to 'Monday' if Sunday
  const [activeDay, setActiveDay] = useState(() => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(today) ? today : 'Monday';
  });

  const { joinClassroom } = useClassroom();
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const loadTimetables = async () => {
    try {
      const url = user?.section 
        ? `http://127.0.0.1:8000/api/admin/timetables?section=${encodeURIComponent(user.section)}` 
        : 'http://127.0.0.1:8000/api/admin/timetables';
      const res = await fetch(url);
      if (res.ok) {
        setTimetables(await res.json());
      } else {
        setError("Failed to fetch schedules.");
      }
    } catch (e) {
      console.error(e);
      setError("Server connection offline.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimetables();
  }, [user]);

  const handleJoinRoom = async (code) => {
    if (!code) return;
    try {
      await joinClassroom(code);
      navigate('/live');
    } catch (err) {
      alert(err.message || `Could not join classroom "${code}". Please make sure the room session is active.`);
    }
  };

  // Group schedules by day
  const groupedTimetables = daysOfWeek.reduce((acc, day) => {
    acc[day] = timetables.filter(t => t.day_of_week.toLowerCase() === day.toLowerCase());
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col justify-center items-center gap-3">
        <div className="h-8 w-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="text-xs uppercase tracking-widest font-extrabold text-gray-500">Loading Master Timetable...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-xl bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[0_0_20px_rgba(0,0,0,0.3)]">
        <div className="space-y-1.5">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-200">
            <Sparkles className="h-3 w-3 mr-1" /> Master Academic Planner
          </span>
          <h3 className="text-lg font-bold text-gray-900">VVCE Semester VII {user?.section ? `Section ${user.section.split(' ').pop()}` : 'Scheduled Timetable'}</h3>
          <p className="text-gray-600 text-xs max-w-xl">
            View your schedules arranged in a neat, spacious vertical timeline. Click on any active slot block to open and join the stream.
          </p>
        </div>
      </div>
        


      {error && <div className="p-3.5 text-xs font-semibold rounded bg-red-50 border border-red-200 text-red-650">{error}</div>}

      {/* VIEW 1: DAILY TIMELINE (SPACIOUS AND HIGH-AESTHETIC) */}
      {viewMode === "timeline" && (
        <div className="space-y-6">
          {/* Day Tabs Selector */}
          <div className="flex flex-wrap gap-2.5 pb-2 border-b border-gray-200">
            {daysOfWeek.map((day) => {
              const daySlots = groupedTimetables[day] || [];
              const isSelected = activeDay === day;
              return (
                <button
                  key={day}
                  onClick={() => setActiveDay(day)}
                  className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
                    isSelected
                      ? "bg-indigo-50 text-indigo-600 border-indigo-500/40 shadow-sm"
                      : "bg-white/40 text-gray-600 border-gray-200 hover:border-gray-200 hover:text-gray-800"
                  }`}
                >
                  <span className="capitalize">{day}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                    isSelected ? "bg-indigo-100 text-indigo-700" : "bg-white text-gray-500"
                  }`}>
                    {daySlots.length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Daily Schedule Timeline List */}
          <div className="relative pl-6 border-l border-gray-200 space-y-5 py-2">
            {(groupedTimetables[activeDay] || []).length === 0 ? (
              <div className="academic-card p-12 text-center max-w-md mx-auto bg-white/20 border border-gray-200 rounded-xl">
                <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-3 animate-pulse" />
                <h4 className="font-bold text-gray-700 text-sm capitalize">No lectures scheduled for {activeDay}</h4>
                <p className="text-[10px] text-slate-600 mt-1 uppercase font-bold tracking-widest font-mono">Enjoy your Free Day!</p>
              </div>
            ) : (
              (groupedTimetables[activeDay] || []).map((slot, index) => (
                <div key={slot.id} className="relative group">
                  {/* Timeline Dot Indicator */}
                  <span className="absolute -left-[31px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white border-2 border-[#070b15]"></span>

                  <div className="academic-card p-5 bg-white/40 border border-gray-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-[0_4px_12px_rgba(0,0,0,0.1)] group">
                    {/* Time Slot info */}
                    <div className="flex items-center gap-3 md:w-1/4 shrink-0 border-b md:border-b-0 md:border-r border-gray-200 pb-3 md:pb-0 md:pr-4">
                      <Clock className="h-4 w-4 text-indigo-600" />
                      <div className="space-y-0.5">
                        <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Time Slot</span>
                        <p className="font-bold text-xs text-gray-800 font-mono">{slot.start_time} - {slot.end_time}</p>
                      </div>
                    </div>

                    {/* Subject Detail info */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold text-sm text-gray-900 line-clamp-1">{slot.subject_name}</h4>
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-200 text-[8px] font-bold font-mono">
                          <MapPin className="h-2 w-2" />
                          {slot.classroom_code}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 font-semibold line-clamp-1">Classroom: {slot.classroom_name}</p>
                    </div>


                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}


    </div>
  );
};

export default TimetablePage;
