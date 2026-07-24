import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useClassroom } from '../contexts/ClassroomContext';
import { 
  QrCode, 
  Camera, 
  CheckCircle2, 
  UserCheck, 
  AlertCircle,
  HelpCircle,
  Users,
  Percent
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip
} from 'recharts';

const AttendancePage = () => {
  const { user } = useAuth();
  const { attendance, activeClassroom, simulateAttendance } = useClassroom();
  const [success, setSuccess] = useState("");
  const [qrScanned, setQrScanned] = useState(false);

  const handleSimulate = async () => {
    if (!activeClassroom) {
      alert("Please join or active a live classroom to trigger attendance logs.");
      return;
    }
    await simulateAttendance();
    setSuccess("Check-in scan pipeline completed. Registered database successfully.");
  };

  const handleStudentScan = () => {
    setQrScanned(true);
    setTimeout(() => {
      setSuccess("QR code scanned! Check-in registered successfully.");
    }, 1200);
  };

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  // Compute mock chart metrics
  const total = attendance.length > 0 ? attendance.length : 15;
  const present = attendance.length > 0 ? attendance.filter(a => a.status === 'present').length : 13;
  const absent = total - present;

  const data = [
    { name: 'Present', value: present, color: '#10b981' },
    { name: 'Absent', value: absent, color: '#f59e0b' }
  ];

  return (
    <div className="space-y-8">
      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side (QR Code Generation & Simulation triggers) */}
        <div className="space-y-6">
          <div className="academic-card p-6 flex flex-col items-center text-center">
            <h4 className="font-bold text-sm text-gray-800 border-b border-gray-200 pb-4 mb-5 w-full">
              {isTeacher ? "Lecture Verification QR" : "Scan Classroom QR"}
            </h4>

            {isTeacher ? (
              <>
                <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-[0_0_15px_rgba(79,70,229,0.1)] inline-block">
                  {/* Visual QR Simulator */}
                  <QrCode className="h-44 w-44 text-slate-950" />
                </div>
                <p className="text-gray-600 text-xs mt-6 leading-relaxed max-w-xs">
                  Instruct students to scan this encrypted check-in key using their mobile portal devices.
                </p>

                {activeClassroom ? (
                  <button
                    onClick={handleSimulate}
                    className="w-full mt-6 py-2.5 rounded bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 text-xs font-bold transition-all shadow-sm flex items-center justify-center space-x-1.5"
                  >
                    <Camera className="h-4 w-4" />
                    <span>Run Verification Scan</span>
                  </button>
                ) : (
                  <div className="mt-6 p-3 rounded bg-white text-gray-500 text-[10px] uppercase font-bold tracking-wider border border-gray-200 w-full">
                    No classroom active
                  </div>
                )}
              </>
            ) : (
              <>
                {qrScanned ? (
                  <div className="py-12 flex flex-col justify-center items-center">
                    <CheckCircle2 className="h-16 w-16 text-emerald-500 animate-bounce mb-4" />
                    <h5 className="font-bold text-gray-800">Scan Complete</h5>
                    <p className="text-gray-500 text-xs mt-1">Check-in registered successfully.</p>
                  </div>
                ) : (
                  <>
                    <div className="h-44 w-full bg-white border border-gray-200 rounded-lg flex flex-col items-center justify-center text-slate-600">
                      <Camera className="h-12 w-12 text-slate-700 animate-pulse mb-3" />
                      <p className="text-xs font-semibold">Webcam capture inactive</p>
                    </div>
                    <button
                      onClick={handleStudentScan}
                      className="w-full mt-6 py-2.5 rounded bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 text-xs font-bold transition-all shadow-sm flex items-center justify-center space-x-1.5"
                    >
                      <QrCode className="h-4 w-4" />
                      <span>Scan Check-in QR</span>
                    </button>
                  </>
                )}
              </>
            )}
          </div>

          {/* Visual statistics card */}
          <div className="academic-card p-6 flex flex-col items-center">
            <h4 className="font-bold text-sm text-gray-800 border-b border-gray-200 pb-4 mb-4 w-full">
              Scanned Ratio Overview
            </h4>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {data.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center space-x-6 text-xs font-bold uppercase tracking-wider mt-2">
              <span className="text-emerald-700">Present ({present})</span>
              <span className="text-amber-500">Absent ({absent})</span>
            </div>
          </div>
        </div>

        {/* Right Side (Log sheet lists) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="academic-card p-6">
            <h4 className="font-bold text-base text-gray-800 border-b border-gray-200 pb-4 mb-5 flex items-center justify-between">
              <span>Classroom Session Attendance List</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-gray-600 border border-gray-200">
                Today's Log
              </span>
            </h4>

            <div className="overflow-x-auto select-text">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 uppercase tracking-widest font-bold">
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Subject Room</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Engagement Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-gray-700">
                   {attendance.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-gray-500 italic font-semibold">No real-time attendance logs registered in database. Mark attendance via check-in QR!</td>
                    </tr>
                  ) : (
                    attendance.map((row, idx) => (
                      <tr key={idx} className="hover:bg-white/35 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-gray-800">{row.student_name}</td>
                        <td className="py-3.5 px-4 font-semibold text-gray-600">
                          {activeClassroom ? activeClassroom.code : "CS101"}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            row.status === 'present' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-indigo-600">
                          {row.engagement_score.toFixed(1)}%
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;
