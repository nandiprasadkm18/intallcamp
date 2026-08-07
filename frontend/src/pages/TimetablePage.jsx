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
        ? `${import.meta.env.VITE_API_URL}/api/admin/timetables?section=${encodeURIComponent(user.section)}` 
        : `${import.meta.env.VITE_API_URL}/api/admin/timetables`;
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${user.token || localStorage.getItem('token')}`
        }
      });
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

      {viewMode === "timeline" && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm mt-6">
          {(() => {
            if (timetables.length === 0) {
              return <div className="py-12 text-center text-slate-500 italic bg-white text-xs">No timetables found for this section.</div>;
            }

            const daysOfWeekList = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            
            const parseTime = (timeStr) => {
              if (!timeStr) return 0;
              const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
              if (!match) return 0;
              let [, hours, minutes, period] = match;
              hours = parseInt(hours, 10);
              minutes = parseInt(minutes, 10);
              if (period.toUpperCase() === 'PM' && hours !== 12) hours += 12;
              if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
              return hours * 60 + minutes;
            };

            const standardSlots = [
              { label: '8:00 - 9:00', start: '08:00 AM', end: '09:00 AM' },
              { label: '9:00 - 10:00', start: '09:00 AM', end: '10:00 AM' },
              { label: '10:00 - 10:30', start: '10:00 AM', end: '10:30 AM', isBreak: true, name: 'Tea Break' },
              { label: '10:30 - 11:30', start: '10:30 AM', end: '11:30 AM' },
              { label: '11:30 - 12:30', start: '11:30 AM', end: '12:30 PM' },
              { label: '12:30 - 1:30', start: '12:30 PM', end: '01:30 PM', isBreak: true, name: 'Lunch Break' },
              { label: '1:30 - 2:30', start: '01:30 PM', end: '02:30 PM' },
              { label: '2:30 - 3:30', start: '02:30 PM', end: '03:30 PM' },
              { label: '3:30 - 4:30', start: '03:30 PM', end: '04:30 PM' }
            ];

            const activeDays = daysOfWeekList.filter(day => 
              day !== 'Saturday' || timetables.some(t => t.day_of_week === 'Saturday')
            );

            return (
              <table className="w-full text-xs text-left border-collapse bg-white">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase font-bold text-[9px] tracking-widest">
                  <tr>
                    <th className="py-3 px-4 border-r border-gray-200 bg-gray-100/50 w-24 text-center">Time & Day</th>
                    {standardSlots.map((slot, index) => (
                      <th key={index} className={`py-3 px-4 border-r border-gray-200 text-center ${slot.isBreak ? 'w-12 bg-gray-100/50' : 'min-w-[120px] whitespace-nowrap'}`}>
                        {slot.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {activeDays.map((day, dayIndex) => {
                    const skipSlots = new Set();
                    return (
                      <tr key={day} className="hover:bg-gray-50/30 transition-colors">
                        <td className="py-4 px-4 border-r border-gray-200 font-extrabold text-gray-700 bg-gray-50/50 text-center uppercase tracking-wider text-[10px]">
                          {day.substring(0, 3)}
                        </td>
                        {standardSlots.map((slot, index) => {
                          if (skipSlots.has(index)) return null;

                          if (slot.isBreak) {
                            if (dayIndex === 0) {
                              return (
                                <td key={index} rowSpan={activeDays.length} className="p-2 border-r border-gray-200 text-center bg-gray-50/80">
                                  <div className="flex items-center justify-center h-full min-h-[100px]">
                                    <span className="text-gray-400 font-bold uppercase tracking-widest text-xs rotate-180" style={{ writingMode: 'vertical-rl' }}>{slot.name}</span>
                                  </div>
                                </td>
                              );
                            } else {
                              return null;
                            }
                          }

                          const classStartingHere = timetables.find(t => t.day_of_week === day && t.start_time === slot.start);
                          let colSpan = 1;
                          
                          if (classStartingHere) {
                            const classEnd = parseTime(classStartingHere.end_time);
                            for (let i = index + 1; i < standardSlots.length; i++) {
                              if (!standardSlots[i].isBreak && parseTime(standardSlots[i].start) < classEnd) {
                                colSpan++;
                                skipSlots.add(i);
                              } else if (standardSlots[i].isBreak && parseTime(standardSlots[i].end) <= classEnd) {
                                break;
                              } else {
                                break;
                              }
                            }
                          }

                          return (
                            <td key={index} colSpan={colSpan} className="p-2 border-r border-gray-200 text-center relative h-full">
                              {classStartingHere ? (
                                <div 
                                  onClick={() => {
                                    if (user?.role !== 'Student') {
                                      handleJoinRoom(classStartingHere.classroom_code);
                                    }
                                  }}
                                  className={`bg-indigo-50/60 rounded-md p-2.5 border border-indigo-100/80 flex flex-col items-center justify-center gap-1.5 h-full transition-all group ${
                                    user?.role !== 'Student' 
                                      ? 'hover:border-indigo-300 hover:shadow-sm hover:-translate-y-0.5 cursor-pointer' 
                                      : ''
                                  }`}
                                >
                                  <span className={`font-bold text-xs leading-tight transition-colors ${user?.role !== 'Student' ? 'text-indigo-700 group-hover:text-indigo-800' : 'text-indigo-700'}`}>{classStartingHere.subject_name}</span>
                                  <div className="flex flex-col items-center gap-1 mt-0.5">
                                    <div className="flex items-center gap-1.5 text-[9px] font-bold tracking-wide">
                                      <span className="bg-white px-1.5 py-0.5 rounded text-gray-600 border border-gray-200 shadow-sm inline-flex items-center gap-1">
                                        <MapPin className="h-2 w-2" />
                                        {classStartingHere.classroom_code}
                                      </span>
                                    </div>
                                    <span className="text-gray-500 text-[9px] font-semibold line-clamp-1">{classStartingHere.classroom_name}</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center h-full min-h-[60px] opacity-0 hover:opacity-100 transition-opacity">
                                  <span className="text-gray-300 text-[10px] font-semibold uppercase tracking-wider">Free</span>
                                </div>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            );
          })()}
        </div>
      )}


    </div>
  );
};

export default TimetablePage;
