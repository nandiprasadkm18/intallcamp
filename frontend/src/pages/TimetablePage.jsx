import React, { useState, useEffect } from 'react';
import { useClassroom } from '../contexts/ClassroomContext';
import { Calendar, Clock, Sparkles, MapPin, ExternalLink, Columns, List, ChevronRight } from 'lucide-react';

const TimetablePage = ({ setCurrentPage }) => {
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("timeline"); // timeline, weekly

  // Detect current day of the week to pre-select, default to 'Monday' if Sunday
  const [activeDay, setActiveDay] = useState(() => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].includes(today) ? today : 'Monday';
  });

  const { joinClassroom } = useClassroom();
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const loadTimetables = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/admin/timetables');
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
  }, []);

  const handleJoinRoom = async (code) => {
    if (!code) return;
    try {
      await joinClassroom(code);
      setCurrentPage('live');
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
          <h3 className="text-lg font-bold text-gray-900">VVCE Semester VI Section C Scheduled Timetable</h3>
          <p className="text-gray-600 text-xs max-w-xl">
            View your schedules arranged in a neat, spacious vertical timeline or complete weekly horizontal rows. Click on any active slot block to open and join the stream.
          </p>
        </div>
        
        {/* View Mode Selectors */}
        <div className="flex bg-gray-100 border border-gray-200 p-1 rounded-lg shrink-0">
          <button
            onClick={() => setViewMode("timeline")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
              viewMode === "timeline"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <List className="h-3.5 w-3.5" />
            <span>Timeline View</span>
          </button>
          <button
            onClick={() => setViewMode("weekly")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
              viewMode === "weekly"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <Columns className="h-3.5 w-3.5" />
            <span>Weekly Planner</span>
          </button>
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
                  <span className="absolute -left-[31px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white border-2 border-[#070b15] group-hover:bg-gray-800 group-hover:border-indigo-400 group-hover:shadow-[0_0_8px_rgba(79,70,229,0.8)] transition-all duration-300"></span>

                  <div 
                    onClick={() => handleJoinRoom(slot.classroom_code)}
                    className="academic-card p-5 bg-white/40 hover:bg-white/80 border border-gray-200 hover:border-indigo-500/40 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all duration-300 cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.1)] group"
                  >
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
                        <h4 className="font-extrabold text-sm text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{slot.subject_name}</h4>
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-200 text-[8px] font-bold font-mono">
                          <MapPin className="h-2 w-2" />
                          {slot.classroom_code}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 font-semibold line-clamp-1">Classroom: {slot.classroom_name}</p>
                    </div>

                    {/* Join button triggers */}
                    <div className="shrink-0 flex items-center">
                      <span className="px-4 py-2 rounded-lg bg-black/10 hover:bg-black text-indigo-600 group-hover:text-white border border-indigo-200 hover:border-indigo-600 font-bold text-xs flex items-center gap-1.5 transition-all duration-200 shadow-sm active:scale-95">
                        <span>Join Lecture</span>
                        <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: WEEKLY PLANNER MATRIX (NEAT COMPREHENSIVE HORIZONTAL ROWS) */}
      {viewMode === "weekly" && (
        <div className="space-y-5">
          {daysOfWeek.map((day) => {
            const daySlots = groupedTimetables[day] || [];
            
            return (
              <div 
                key={day} 
                className="academic-card p-5 bg-white/40 border border-gray-200 flex flex-col xl:flex-row gap-5 items-start xl:items-center"
              >
                {/* Left Side: Day Badge */}
                <div className="w-full xl:w-44 shrink-0 flex items-center justify-between xl:border-r border-gray-200 xl:pr-5 pb-3 xl:pb-0 border-b xl:border-b-0">
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-gray-900 tracking-wider capitalize">{day}</h4>
                    <p className="text-[10px] text-gray-500 font-mono">VVCE VI SEM SEC C</p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-white border border-gray-200 text-[9px] font-bold font-mono text-gray-600">
                    {daySlots.length} Slots
                  </span>
                </div>

                {/* Right Side: Horizontal List of Cards */}
                <div className="flex-1 w-full overflow-x-auto flex gap-4 pb-2 scrollbar-thin">
                  {daySlots.length === 0 ? (
                    <div className="py-2 text-slate-600 text-[11px] italic font-semibold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-100"></span>
                      <span>No scheduled classes - Free Day</span>
                    </div>
                  ) : (
                    daySlots.map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => handleJoinRoom(slot.classroom_code)}
                        className="min-w-[240px] max-w-[280px] p-3.5 bg-gray-50 rounded-lg border border-gray-200 flex flex-col justify-between gap-3 text-left hover:border-indigo-500/40 hover:bg-indigo-950/20 hover:shadow-[0_0_10px_rgba(79,70,229,0.1)] transition-all duration-200 cursor-pointer group shrink-0 active:scale-95"
                      >
                        <div className="space-y-1">
                          <div className="flex items-start justify-between gap-1.5">
                            <h5 className="font-bold text-xs text-gray-800 group-hover:text-indigo-600 transition-colors line-clamp-1">{slot.subject_name}</h5>
                            <span className="shrink-0 inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-indigo-50 text-indigo-600 border border-indigo-200 text-[8px] font-bold font-mono">
                              {slot.classroom_code}
                            </span>
                          </div>
                          <p className="text-[9px] text-gray-500 line-clamp-1">{slot.classroom_name}</p>
                        </div>

                        <div className="flex items-center justify-between text-[9px] text-gray-500 border-t border-gray-200/60 pt-2">
                          <span className="flex items-center gap-1.5 font-medium">
                            <Clock className="h-3 w-3 text-gray-400" />
                            {slot.start_time} - {slot.end_time}
                          </span>
                          <ExternalLink className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 text-indigo-450 transition-opacity" />
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TimetablePage;
