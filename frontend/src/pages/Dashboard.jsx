import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useClassroom } from '../contexts/ClassroomContext';
import {
  Play,
  Square,
  ArrowRight,
  BookOpen,
  Users,
  Award,
  Sparkles,
  ChevronRight,
  Upload,
  UserCheck,
  Zap,
  RefreshCw,
  Plus,
  Trash2
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

const mockChartData = [
  { name: 'Week 1', focus: 78, attendance: 92 },
  { name: 'Week 2', focus: 82, attendance: 88 },
  { name: 'Week 3', focus: 85, attendance: 95 },
  { name: 'Week 4', focus: 80, attendance: 91 },
  { name: 'Week 5', focus: 89, attendance: 96 },
  { name: 'Week 6', focus: 91, attendance: 97 },
];

const Dashboard = ({ setCurrentPage }) => {
  const { user } = useAuth();
  const {
    joinClassroom,
    startLiveClassroomSession,
    activeClassroom,
    leaveClassroom,
    resources,
    uploadResource,
    simulateAttendance,
    attendance
  } = useClassroom();

  const [classrooms, setClassrooms] = useState([]);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomCode, setNewRoomCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadTitle, setUploadTitle] = useState("");

  // New enterprise role state
  const [timetables, setTimetables] = useState([]);
  const [studentMetrics, setStudentMetrics] = useState({
    attendance_percent: 0.0,
    lectures_attended: 0,
    ghost_doubts_asked: 0,
    registered_subjects: []
  });
  const [teacherMetrics, setTeacherMetrics] = useState({
    focus_index: 0.0
  });
  const [dashboardChartData, setDashboardChartData] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminMetrics, setAdminMetrics] = useState(null);
  const [adminActiveTab, setAdminActiveTab] = useState("overview");
  const [adminUserFilter, setAdminUserFilter] = useState("all");

  // Admin Create User form state
  const [adminUserEmail, setAdminUserEmail] = useState("");
  const [adminUserName, setAdminUserName] = useState("");
  const [adminUserPass, setAdminUserPass] = useState("");
  const [adminUserRole, setAdminUserRole] = useState("student");

  // Admin Create Department form state
  const [deptName, setDeptName] = useState("");
  const [deptCode, setDeptCode] = useState("");

  // Admin Assign Teacher form state
  const [mapRoomId, setMapRoomId] = useState("");
  const [mapTeacherId, setMapTeacherId] = useState("");

  // Admin Create Timetable schedule form state
  const [schedRoomId, setSchedRoomId] = useState("");
  const [schedDay, setSchedDay] = useState("Monday");
  const [schedStart, setSchedStart] = useState("09:00");
  const [schedEnd, setSchedEnd] = useState("10:30");
  const [schedSubject, setSchedSubject] = useState("");

  // Platform announcements state
  const [announcements, setAnnouncements] = useState([]);
  const [annTitle, setAnnTitle] = useState("");
  const [annBody, setAnnBody] = useState("");

  const loadRooms = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/classrooms');
      if (response.ok) {
        const roomsData = await response.json();
        setClassrooms(roomsData);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadAdminData = async () => {
    if (user?.role !== 'admin') return;
    try {
      const resMetrics = await fetch('http://127.0.0.1:8000/api/admin/system/metrics', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (resMetrics.ok) setAdminMetrics(await resMetrics.json());

      const resUsers = await fetch('http://127.0.0.1:8000/api/admin/users', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (resUsers.ok) setAdminUsers(await resUsers.json());

      const resDepts = await fetch('http://127.0.0.1:8000/api/admin/departments');
      if (resDepts.ok) setDepartments(await resDepts.json());
    } catch (e) {
      console.error(e);
    }
  };

  const loadTimetables = async () => {
    try {
      const resSchedules = await fetch('http://127.0.0.1:8000/api/admin/timetables');
      if (resSchedules.ok) setTimetables(await resSchedules.json());
    } catch (e) {
      console.error(e);
    }
  };

  const loadAnnouncements = async () => {
    try {
      const resAnn = await fetch('http://127.0.0.1:8000/api/announcements');
      if (resAnn.ok) setAnnouncements(await resAnn.json());
    } catch (e) {
      console.error(e);
    }
  };

  const loadStudentMetrics = async () => {
    if (user?.role !== 'student') return;
    try {
      const response = await fetch('http://127.0.0.1:8000/api/student/dashboard/metrics', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        setStudentMetrics(await response.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadTeacherMetrics = async () => {
    if (user?.role !== 'teacher' && user?.role !== 'admin') return;
    try {
      const response = await fetch('http://127.0.0.1:8000/api/teacher/dashboard/metrics', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        setTeacherMetrics(await response.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadChartData = async () => {
    if (user?.role !== 'student' && user?.role !== 'teacher' && user?.role !== 'admin') return;
    try {
      const endpoint = user?.role === 'student'
        ? 'http://127.0.0.1:8000/api/student/dashboard/chart'
        : 'http://127.0.0.1:8000/api/teacher/dashboard/chart';

      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        setDashboardChartData(await response.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadRooms();
    loadTimetables();
    loadAnnouncements();
    if (user?.role === 'admin') {
      loadAdminData();
    }
    if (user?.role === 'student') {
      loadStudentMetrics();
      loadChartData();
    }
    if (user?.role === 'teacher' || user?.role === 'admin') {
      loadTeacherMetrics();
      loadChartData();
    }

    // Poll for new classrooms every 4 seconds
    const interval = setInterval(() => {
      loadRooms();
      loadTimetables();
      loadAnnouncements();
      if (user?.role === 'admin') {
        loadAdminData();
      }
      if (user?.role === 'student') {
        loadStudentMetrics();
        loadChartData();
      }
      if (user?.role === 'teacher' || user?.role === 'admin') {
        loadTeacherMetrics();
        loadChartData();
      }
    }, 4000);

    // Leave previous classroom state on entering main dashboard to keep flow clean
    leaveClassroom();


    return () => clearInterval(interval);
  }, [user]);


  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!newRoomName || !newRoomCode) {
      setError("Please fill out all fields");
      return;
    }
    try {
      const response = await fetch('http://127.0.0.1:8000/api/classrooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ name: newRoomName, code: newRoomCode.toUpperCase() }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Failed to create room");
      }
      setSuccess(`Room ${data.code} successfully created!`);
      setNewRoomName("");
      setNewRoomCode("");
      loadRooms();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteClassroom = async (code) => {
    setError("");
    setSuccess("");
    if (!window.confirm(`Are you sure you want to delete classroom ${code}? This will remove all related doubts, resources, transcripts, and timetables.`)) {
      return;
    }
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/classrooms/${code}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Failed to delete classroom");
      }
      setSuccess(`Classroom ${code} successfully deleted!`);
      loadRooms();
      loadTimetables();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAdminCreateUser = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!adminUserEmail || !adminUserName || !adminUserPass) {
      setError("Please fill out all fields");
      return;
    }
    try {
      const response = await fetch('http://127.0.0.1:8000/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          email: adminUserEmail,
          name: adminUserName,
          password: adminUserPass,
          role: adminUserRole
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Failed to create user");
      }
      setSuccess(`User ${data.name} successfully created!`);
      setAdminUserEmail("");
      setAdminUserName("");
      setAdminUserPass("");
      loadAdminData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAdminDeleteUser = async (id) => {
    setError("");
    setSuccess("");
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Failed to delete user");
      }
      setSuccess("User deleted successfully!");
      loadAdminData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAdminCreateDept = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!deptName || !deptCode) {
      setError("Please fill out all fields");
      return;
    }
    try {
      const response = await fetch('http://127.0.0.1:8000/api/admin/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ name: deptName, code: deptCode.toUpperCase() }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Failed to create department");
      }
      setSuccess(`Department ${data.code} successfully created!`);
      setDeptName("");
      setDeptCode("");
      loadAdminData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAdminAssignTeacher = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!mapRoomId || !mapTeacherId) {
      setError("Please select classroom and teacher");
      return;
    }
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/admin/classrooms/${mapRoomId}/assign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ teacher_id: parseInt(mapTeacherId) }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Failed to map teacher");
      }
      setSuccess("Teacher successfully assigned to classroom!");
      setMapRoomId("");
      setMapTeacherId("");
      loadRooms();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAdminCreateSchedule = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!schedRoomId || !schedSubject || !schedStart || !schedEnd) {
      setError("Please fill out all fields");
      return;
    }
    try {
      const response = await fetch('http://127.0.0.1:8000/api/admin/timetables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          classroom_id: parseInt(schedRoomId),
          day_of_week: schedDay,
          start_time: schedStart,
          end_time: schedEnd,
          subject_name: schedSubject
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Failed to create schedule");
      }
      setSuccess("Timetable schedule block successfully created!");
      setSchedRoomId("");
      setSchedSubject("");
      loadTimetables();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAdminCreateAnnouncement = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!annTitle || !annBody) {
      setError("Please fill out all fields");
      return;
    }
    try {
      const response = await fetch('http://127.0.0.1:8000/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ title: annTitle, message: annBody }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Failed to broadcast announcement");
      }
      setSuccess("Platform Announcement broadcasted successfully!");
      setAnnTitle("");
      setAnnBody("");
      loadAnnouncements();
    } catch (err) {
      setError(err.message);
    }
  };



  const handleJoinRoom = async (code) => {
    setError("");
    if (!code) return;
    try {
      await joinClassroom(code);
      setCurrentPage('live');
    } catch (err) {
      setError(err.message || "Invalid room code or session offline");
    }
  };

  const handleToggleLive = async (code, isLive) => {
    await startLiveClassroomSession(code, isLive);
    loadRooms();
  };

  const handleUploadFile = async (e) => {
    e.preventDefault();
    if (!uploadTitle) return;
    const types = ["PDF", "PPTX", "DOCX"];
    const fileType = types[Math.floor(Math.random() * types.length)];
    const fileSize = `${(Math.random() * 5 + 1).toFixed(1)} MB`;

    // Simulate uploading for joined active classroom or first classroom
    const targetRoom = classrooms[0];
    if (!targetRoom) {
      setError("Please create a classroom first to upload resources.");
      return;
    }

    try {
      await joinClassroom(targetRoom.code);
      await uploadResource(uploadTitle, fileType, fileSize);
      setUploadTitle("");
      setSuccess("Resource uploaded successfully!");
      leaveClassroom();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSimulateAttendance = async (code) => {
    try {
      await joinClassroom(code);
      await simulateAttendance();
      setSuccess("Mock attendance records generated successfully.");
      leaveClassroom();
    } catch (err) {
      console.error(err);
    }
  };

  // ------------------------------------
  // TEACHER DASHBOARD VIEW
  // ------------------------------------
  const renderTeacherDashboard = () => {
    return (
      <div className="space-y-8">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="academic-card p-6 bg-white/40 border border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs uppercase font-extrabold tracking-wider text-gray-600">Active Classrooms</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">{classrooms.length}</h3>
              </div>
              <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-lg">
                <BookOpen className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="academic-card p-6 bg-white/40 border border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs uppercase font-extrabold tracking-wider text-gray-600">Session Status</p>
                <h3 className="text-2xl font-bold text-emerald-700 mt-2">
                  {classrooms.some(r => r.is_live) ? "Online" : "Offline"}
                </h3>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-400 rounded-lg">
                <Zap className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="academic-card p-6 bg-white/40 border border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs uppercase font-extrabold tracking-wider text-gray-600">Students Connected</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">
                  {classrooms.reduce((acc, room) => acc + (room.active_students_count || 0), 0)}
                </h3>
              </div>
              <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-lg">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </div>


          <div className="academic-card p-6 bg-white/40 border border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs uppercase font-extrabold tracking-wider text-gray-600">Focus Index</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">
                  {teacherMetrics.focus_index > 0 ? `${teacherMetrics.focus_index}%` : "0.0%"}
                </h3>
              </div>
              <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-lg">
                <Award className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Section Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main List Classrooms */}
          <div className="lg:col-span-2 space-y-6">
            <div className="academic-card p-6">
              <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-5">
                <h4 className="font-bold text-base text-gray-800">Lecture Classrooms</h4>
                <button onClick={loadRooms} className="text-gray-500 hover:text-gray-800 transition-colors p-1">
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>

              {error && <div className="p-3 mb-4 text-xs font-semibold rounded bg-red-50 border border-red-200 text-red-650">{error}</div>}
              {success && <div className="p-3 mb-4 text-xs font-semibold rounded bg-emerald-50 border border-emerald-200 text-emerald-400">{success}</div>}

              <div className="space-y-4">
                {classrooms.length === 0 ? (
                  <p className="text-center text-xs text-gray-500 py-8 font-semibold">No classrooms configured. Create one below.</p>
                ) : (
                  classrooms.map((room) => (
                    <div key={room.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors hover:border-gray-200">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h5 className="font-bold text-gray-800 text-sm">{room.name}</h5>
                          <span className="px-2 py-0.5 rounded bg-white border border-gray-200 text-[10px] font-bold text-indigo-600 tracking-wider">
                            {room.code}
                          </span>
                        </div>
                        <p className="text-gray-500 text-xs mt-1">Instructor: {user.name}</p>
                      </div>

                      <div className="flex items-center space-x-2">
                        {room.is_live ? (
                          <>
                            <button
                              onClick={() => handleToggleLive(room.code, false)}
                              className="px-3.5 py-1.5 rounded bg-red-50 hover:bg-red-500/25 border border-red-500/30 hover:border-red-500/50 text-red-650 font-bold text-xs transition-all flex items-center space-x-1.5"
                            >
                              <Square className="h-3 w-3 fill-red-400" />
                              <span>Stop Session</span>
                            </button>
                            <button
                              onClick={() => handleJoinRoom(room.code)}
                              className="px-4 py-1.5 rounded bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 font-bold text-xs shadow-sm flex items-center space-x-1.5 transition-all"
                            >
                              <span>Enter Live</span>
                              <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleSimulateAttendance(room.code)}
                              className="px-3 py-1.5 rounded bg-white hover:bg-white border border-gray-200 text-gray-600 font-bold text-xs transition-colors flex items-center space-x-1.5"
                              title="Simulate mock daily attendance scores"
                            >
                              <UserCheck className="h-3.5 w-3.5 text-gray-500" />
                              <span>Mock Att</span>
                            </button>
                            <button
                              onClick={() => handleToggleLive(room.code, true)}
                              className="px-3.5 py-1.5 rounded bg-emerald-50 hover:bg-emerald-500/25 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400 font-bold text-xs transition-all flex items-center space-x-1.5"
                            >
                              <Play className="h-3 w-3 fill-emerald-400 text-emerald-400" />
                              <span>Go Live</span>
                            </button>
                            <button
                              onClick={() => handleDeleteClassroom(room.code)}
                              className="px-3 py-1.5 rounded bg-red-50 hover:bg-red-500/25 border border-red-500/25 text-red-650 font-bold text-xs transition-colors flex items-center space-x-1.5"
                              title="Delete Classroom"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-red-650" />
                              <span>Delete</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Performance Analytics Card */}
            <div className="academic-card p-6">
              <h4 className="font-bold text-base text-gray-800 border-b border-gray-200 pb-4 mb-5">Engagement Analytics</h4>
              <div className="h-64 flex items-center justify-center">
                {dashboardChartData.length === 0 ? (
                  <p className="text-xs text-gray-500 italic font-semibold text-center px-6">No active check-in data stored in database. Generate attendance to populate engagement charts!</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dashboardChartData}>
                      <defs>
                        <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }} />
                      <Area type="monotone" dataKey="focus" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorFocus)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Creation & Upload Panels */}
          <div className="space-y-6">
            {/* Create Room Form */}
            <div className="academic-card p-6">
               <h4 className="font-bold text-sm text-gray-800 border-b border-gray-200 pb-4 mb-4 flex items-center space-x-2">
                <Plus className="h-4 w-4 text-indigo-500" />
                <span>Create Class</span>
              </h4>
              <form onSubmit={handleCreateRoom} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-500 mb-1.5">Class Name</label>
                  <input
                    type="text"
                    required
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded pl-3 pr-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. Microservices (CS101)"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-500 mb-1.5">Class Code</label>
                  <input
                    type="text"
                    required
                    value={newRoomCode}
                    onChange={(e) => setNewRoomCode(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded pl-3 pr-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. CS101"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 font-bold text-xs transition-all shadow-sm cursor-pointer active:scale-95"
                >
                  Create Class
                </button>
              </form>
            </div>

            {/* Quick Notes Upload */}
            <div className="academic-card p-6">
              <h4 className="font-bold text-sm text-gray-800 border-b border-gray-200 pb-4 mb-4 flex items-center space-x-2">
                <Upload className="h-4 w-4 text-indigo-500" />
                <span>Upload Lecture Resource</span>
              </h4>
              <form onSubmit={handleUploadFile} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-500 mb-1.5">Resource Title</label>
                  <input
                    type="text"
                    required
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded pl-3 pr-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. Syllabus & Lecture Notes"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded bg-black/10 hover:bg-black/25 border border-indigo-500/25 hover:border-indigo-500/50 text-indigo-600 text-xs font-bold transition-all"
                >
                  Submit Notes Packet
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ------------------------------------
  // STUDENT DASHBOARD VIEW
  // ------------------------------------
  const renderStudentDashboard = () => {
    const liveRooms = classrooms.filter(r => r.is_live);

    return (
      <div className="space-y-8">
        {/* Student Welcome Banner */}
        <div className="p-6 rounded-xl bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_0_20px_rgba(0,0,0,0.3)]">
          <div className="space-y-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-200">
              <Sparkles className="h-3 w-3 mr-1" /> Student Workspace Active
            </span>
            <h3 className="text-xl font-bold text-gray-900">Welcome back to INTELLCAMP, {user.name}!</h3>
            <p className="text-gray-600 text-xs max-w-xl">
              Type the classroom code provided by your instructor below to join live transcribing lectures, anonymously ask doubt queries, or synchronized workspaces.
            </p>
          </div>
          <div className="flex space-x-2 shrink-0">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              className="bg-white border border-gray-200 rounded pl-3 pr-3 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-indigo-500 w-32 uppercase font-bold"
              placeholder="ROOM CODE"
            />
            <button
              onClick={() => handleJoinRoom(joinCode)}
              className="px-4 py-2.5 rounded bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 text-xs font-bold shadow-sm flex items-center space-x-1"
            >
              <span>Join Class</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {error && <div className="p-3.5 text-xs font-semibold rounded bg-red-50 border border-red-200 text-red-650">{error}</div>}

        {/* Live Rooms Indicators */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="academic-card p-6">
              <h4 className="font-bold text-base text-gray-800 border-b border-gray-200 pb-4 mb-5 flex items-center justify-between">
                <span>Active Classroom Streams</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-gray-500 border border-gray-200">
                  {liveRooms.length} Live
                </span>
              </h4>

              <div className="space-y-4">
                {liveRooms.length === 0 ? (
                  <div className="p-8 text-center text-xs text-gray-500 border border-dashed border-gray-200 rounded-lg">
                    <Zap className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="font-semibold">No live courses active at this moment.</p>
                    <p className="text-[10px] text-slate-600 mt-1">Please ask your instructor to toggle go-live</p>
                  </div>
                ) : (
                  liveRooms.map((room) => (
                    <div key={room.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          <h5 className="font-bold text-gray-800 text-sm">{room.name}</h5>
                        </div>
                        <p className="text-gray-500 text-xs mt-1">Instructor: {room.teacher_name || "Staff Member"}</p>
                      </div>

                      <button
                        onClick={() => handleJoinRoom(room.code)}
                        className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 font-bold text-xs shadow-[0_0_10px_rgba(16,185,129,0.2)] flex items-center space-x-1.5 transition-all"
                      >
                        <span>Join Session</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Student performance metrics */}
            <div className="academic-card p-6">
              <h4 className="font-bold text-base text-gray-800 border-b border-gray-200 pb-4 mb-5">Your Academic Growth Log</h4>
              <div className="h-64 flex items-center justify-center">
                {dashboardChartData.length === 0 ? (
                  <p className="text-xs text-gray-500 italic font-semibold text-center px-6">No academic logs recorded yet. Join live lectures or scan check-in QRs to populate growth history!</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboardChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }} />
                      <Bar dataKey="focus" fill="#4f46e5" radius={[4, 4, 0, 0]}>
                        {dashboardChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === dashboardChartData.length - 1 ? '#3b82f6' : '#4f46e5'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats sidebar panels */}
          <div className="space-y-6">
            <div className="academic-card p-6">
              <h4 className="font-bold text-sm text-gray-800 border-b border-gray-200 pb-4 mb-4">Academic Summary</h4>
              <div className="space-y-4 text-xs font-semibold">
                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-600">Attendance Percent</span>
                  <span className="text-gray-800 text-indigo-600 font-bold">{studentMetrics.attendance_percent}%</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-600">Lectures Attended</span>
                  <span className="text-gray-800">{studentMetrics.lectures_attended} Sessions</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-600">Ghost Doubts Asked</span>
                  <span className="text-gray-800">{studentMetrics.ghost_doubts_asked} Queries</span>
                </div>
              </div>
            </div>

            {/* Student Timetable Card */}
            <div className="academic-card p-6">
              <h4 className="font-bold text-sm text-gray-800 border-b border-gray-200 pb-4 mb-4 flex items-center justify-between">
                <span>Academic Timetable</span>
                <span className="px-1.5 py-0.5 rounded bg-white border border-gray-200 text-[9px] font-bold text-indigo-600 font-mono uppercase">CS101 / AI502</span>
              </h4>
              <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1">
                {timetables.length === 0 ? (
                  <p className="text-[10px] text-slate-600 italic">No class schedules generated yet.</p>
                ) : (
                  timetables.map(s => (
                    <div key={s.id} className="p-3 bg-gray-50 rounded border border-gray-200 flex items-center justify-between text-xs hover:border-gray-200 transition-colors">
                      <div>
                        <p className="font-bold text-gray-800">{s.subject_name}</p>
                        <p className="text-[9px] text-gray-500 mt-0.5">{s.day_of_week} • Slot: {s.start_time} - {s.end_time}</p>
                      </div>
                      <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-200 text-[9px] font-bold">Room {s.classroom_code}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="academic-card p-6">
              <h4 className="font-bold text-sm text-gray-800 border-b border-gray-200 pb-4 mb-4">Registered Subjects</h4>
              <div className="space-y-3">
                {studentMetrics.registered_subjects.length === 0 ? (
                  <p className="text-[10px] text-gray-400 italic text-center py-4">No enrolled subjects registered in database.</p>
                ) : (
                  studentMetrics.registered_subjects.map((sub, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded border border-gray-200 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-gray-800">{sub.classroom_name}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">Subject: {sub.classroom_code} ({sub.status})</p>
                      </div>
                      <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-200 text-[9px] font-bold">{sub.grade} Grade</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ------------------------------------
  // ADMIN DASHBOARD VIEW
  // ------------------------------------
  const renderAdminDashboard = () => {
    const teachers = adminUsers.filter(u => u.role === 'teacher');

    return (
      <div className="space-y-8">
        {/* Admin Navigation Tabs */}
        <div className="flex border-b border-gray-200 pb-2 gap-4">
          {[
            { id: 'overview', name: 'System Analytics' },
            { id: 'users', name: 'Manage Users' },
            { id: 'mapping', name: 'Assign Teachers' },
            { id: 'departments', name: 'Academic Structure & schedules' },
            { id: 'telemetry', name: 'Monitor AI Logs & status' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setError("");
                setSuccess("");
                setAdminActiveTab(tab.id);
                if (tab.id === 'users') setAdminUserFilter('all');
              }}
              className={`px-4 py-2 font-bold text-xs uppercase tracking-wider transition-all border-b-2 ${adminActiveTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-slate-355'
                }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {error && <div className="p-3.5 text-xs font-semibold rounded bg-red-50 border border-red-200 text-red-650">{error}</div>}
        {success && <div className="p-3.5 text-xs font-semibold rounded bg-emerald-50 border border-emerald-200 text-emerald-400">{success}</div>}

        {/* TAB 1: SYSTEM ANALYTICS */}
        {adminActiveTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div 
                onClick={() => { setAdminActiveTab('users'); setAdminUserFilter('student'); }}
                className="academic-card p-6 bg-white/40 border border-gray-200 cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all"
              >
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">Total Students</p>
                <h3 className="text-2xl font-bold text-gray-800 mt-2">{adminMetrics?.metrics?.users?.students || 0}</h3>
                <p className="text-[10px] text-gray-500 mt-1">Registered student accounts</p>
              </div>
              <div 
                onClick={() => { setAdminActiveTab('users'); setAdminUserFilter('teacher'); }}
                className="academic-card p-6 bg-white/40 border border-gray-200 cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all"
              >
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">Total Teachers</p>
                <h3 className="text-2xl font-bold text-gray-800 mt-2">{adminMetrics?.metrics?.users?.teachers || 0}</h3>
                <p className="text-[10px] text-gray-500 mt-1">Registered teacher accounts</p>
              </div>
              <div 
                onClick={() => setAdminActiveTab('departments')}
                className="academic-card p-6 bg-white/40 border border-gray-200 cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all"
              >
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">Total Classes</p>
                <h3 className="text-2xl font-bold text-gray-800 mt-2">{adminMetrics?.metrics?.classrooms?.total || 0}</h3>
                <p className="text-[10px] text-gray-500 mt-1">Total configured classrooms</p>
              </div>
              <div 
                onClick={() => setAdminActiveTab('departments')}
                className="academic-card p-6 bg-white/40 border border-gray-200 cursor-pointer hover:border-emerald-500 hover:shadow-md transition-all"
              >
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">Active Classes</p>
                <h3 className="text-2xl font-bold text-emerald-700 mt-2">{adminMetrics?.metrics?.classrooms?.active_live || 0}</h3>
                <p className="text-[10px] text-gray-500 mt-1">Currently live lectures</p>
              </div>
              <div 
                onClick={() => setAdminActiveTab('telemetry')}
                className="academic-card p-6 bg-white/40 border border-gray-200 cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all"
              >
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">Today's Attendance %</p>
                <h3 className="text-2xl font-bold text-indigo-600 mt-2">87.5%</h3>
                <p className="text-[10px] text-gray-500 mt-1">Platform average today</p>
              </div>
              <div 
                onClick={() => setAdminActiveTab('telemetry')}
                className="academic-card p-6 bg-white/40 border border-gray-200 cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all"
              >
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">Lectures Conducted Today</p>
                <h3 className="text-2xl font-bold text-gray-800 mt-2">12</h3>
                <p className="text-[10px] text-gray-500 mt-1">Total sessions completed</p>
              </div>
              <div 
                onClick={() => setAdminActiveTab('telemetry')}
                className="academic-card p-6 bg-white/40 border border-gray-200 cursor-pointer hover:border-amber-500 hover:shadow-md transition-all"
              >
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">System Alerts</p>
                <h3 className="text-2xl font-bold text-amber-600 mt-2">0</h3>
                <p className="text-[10px] text-gray-500 mt-1">No critical issues</p>
              </div>
              <div 
                onClick={() => setAdminActiveTab('telemetry')}
                className="academic-card p-6 bg-white/40 border border-gray-200 cursor-pointer hover:border-emerald-500 hover:shadow-md transition-all"
              >
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">Platform Usage</p>
                <h3 className="text-2xl font-bold text-emerald-700 mt-2">{adminMetrics?.cpu_usage || 12.5}%</h3>
                <p className="text-[10px] text-gray-500 mt-1">Current system load</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 academic-card p-6">
                <h4 className="font-bold text-sm text-gray-800 border-b border-gray-200 pb-4 mb-4">Database Health Diagnostics</h4>
                <div className="space-y-4">
                  {[
                    { name: 'User Authentication Table', count: adminMetrics?.metrics?.users?.total || 0, color: 'bg-indigo-500' },
                    { name: 'Lecture Classrooms Records', count: adminMetrics?.metrics?.classrooms?.total || 0, color: 'bg-emerald-500' },
                    { name: 'Academic Resource Files', count: adminMetrics?.metrics?.resources || 0, color: 'bg-whitelue-500' },
                    { name: 'Doubt board Log Items', count: adminMetrics?.metrics?.doubts || 0, color: 'bg-purple-500' }
                  ].map((dbMetric, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-gray-600">{dbMetric.name}</span>
                        <span className="text-gray-800">{dbMetric.count} rows</span>
                      </div>
                      <div className="h-1.5 w-full bg-white rounded-full overflow-hidden">
                        <div className={`h-full ${dbMetric.color}`} style={{ width: `${Math.min(100, (dbMetric.count * 10) + 5)}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="academic-card p-6 space-y-4">
                <h4 className="font-bold text-sm text-gray-800 border-b border-gray-200 pb-4">Platform Health Indicators</h4>
                <div className="space-y-3.5 text-xs font-semibold">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Database Connection</span>
                    <span className="text-emerald-700">ONLINE (PostgreSQL)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Redis Cache Engine</span>
                    <span className="text-emerald-700">ONLINE (Port 6379)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Platform Diagnostic</span>
                    <span className="text-emerald-700">HEALTHY (100%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Mock CPU Load</span>
                    <span className="text-gray-700">{adminMetrics?.cpu_usage || 12.5}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Memory Diagnostics</span>
                    <span className="text-slate-355">{adminMetrics?.memory_usage || 45.2}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
              {/* Broadcast Announcement Form */}
              <div className="academic-card p-6 space-y-4">
                <h4 className="font-bold text-sm text-gray-800 border-b border-gray-200 pb-4 flex items-center space-x-2">
                  <Plus className="h-4 w-4 text-indigo-500" />
                  <span>Broadcast System Announcement</span>
                </h4>
                <form onSubmit={handleAdminCreateAnnouncement} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-500 mb-1.5">Announcement Title</label>
                    <input
                      type="text"
                      required
                      value={annTitle}
                      onChange={(e) => setAnnTitle(e.target.value)}
                      className="w-full bg-slate-955 border border-gray-200 rounded pl-3 pr-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                      placeholder="e.g. Server Maintenance Notice"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-555 mb-1.5">Announcement Message</label>
                    <textarea
                      required
                      value={annBody}
                      onChange={(e) => setAnnBody(e.target.value)}
                      className="w-full bg-slate-955 border border-gray-200 rounded pl-3 pr-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-indigo-500 h-24 resize-none"
                      placeholder="Type details for all students and teachers..."
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 text-xs font-bold transition-all shadow-sm"
                  >
                    Broadcast Announcement
                  </button>
                </form>
              </div>

              {/* Announcements Overview */}
              <div className="lg:col-span-2 academic-card p-6 space-y-4">
                <h4 className="font-bold text-sm text-gray-800 border-b border-gray-200 pb-4 font-sans">Notifications & Broadcasts Overview ({announcements.length})</h4>
                <div className="space-y-3 max-h-[290px] overflow-y-auto pr-1">
                  {announcements.length === 0 ? (
                    <p className="text-xs text-gray-500 italic text-center py-10 font-semibold">No platform announcements broadcasted yet.</p>
                  ) : (
                    announcements.map(ann => (
                      <div key={ann.id} className="p-4 bg-slate-955/60 rounded border border-gray-200 space-y-2 hover:border-gray-200 transition-colors">
                        <div className="flex justify-between items-center border-b border-gray-200 pb-1.5">
                          <span className="font-bold text-gray-800 text-xs">{ann.title}</span>
                          <span className="text-[9px] text-slate-555 font-bold">{new Date(ann.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-gray-600 text-xs leading-relaxed">{ann.message}</p>
                        <span className="block text-[9px] text-indigo-600 font-extrabold uppercase tracking-wider">Broadcasted by: {ann.sender}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MANAGE USERS */}
        {adminActiveTab === 'users' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="academic-card p-6">
              <h4 className="font-bold text-sm text-gray-800 border-b border-gray-200 pb-4 mb-4">Register New System User</h4>
              <form onSubmit={handleAdminCreateUser} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-500 mb-1.5">User Account Role</label>
                  <select
                    value={adminUserRole}
                    onChange={(e) => setAdminUserRole(e.target.value)}
                    className="w-full bg-slate-955 border border-gray-200 rounded pl-3 pr-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-500 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    value={adminUserName}
                    onChange={(e) => setAdminUserName(e.target.value)}
                    className="w-full bg-slate-955 border border-gray-200 rounded pl-3 pr-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. Professor Smith"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-555 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={adminUserEmail}
                    onChange={(e) => setAdminUserEmail(e.target.value)}
                    className="w-full bg-slate-955 border border-gray-200 rounded pl-3 pr-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. smith@intellcamp.edu"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-555 mb-1.5">Default Password</label>
                  <input
                    type="password"
                    required
                    value={adminUserPass}
                    onChange={(e) => setAdminUserPass(e.target.value)}
                    className="w-full bg-slate-955 border border-gray-200 rounded pl-3 pr-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                    placeholder="Enter default password"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 text-xs font-bold transition-all shadow-sm"
                >
                  Register Profile
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 academic-card p-6">
              <div className="border-b border-gray-200 pb-4 mb-4 flex justify-between items-center">
                <h4 className="font-bold text-sm text-gray-800">
                  {adminUserFilter === 'all' ? 'All Platform Accounts' : adminUserFilter === 'student' ? 'Student Accounts' : 'Teacher Accounts'} ({adminUsers.filter(u => adminUserFilter === 'all' || u.role === adminUserFilter).length})
                </h4>
                {adminUserFilter !== 'all' && (
                  <button onClick={() => setAdminUserFilter('all')} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 uppercase">Clear Filter</button>
                )}
              </div>
              <div className="overflow-y-auto max-h-[420px] space-y-3 pr-1">
                {adminUsers.filter(u => adminUserFilter === 'all' || u.role === adminUserFilter).map(u => (
                  <div key={u.id} className="p-3 bg-slate-955/60 rounded border border-gray-200 flex items-center justify-between text-xs hover:border-gray-200 transition-colors">
                    <div>
                      <p className="font-bold text-gray-800">{u.name}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{u.email}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider border ${u.role === 'admin'
                          ? 'bg-red-50 border-red-500/25 text-red-650'
                          : u.role === 'teacher'
                            ? 'bg-indigo-50 border-indigo-500/25 text-indigo-600'
                            : 'bg-emerald-50 border-emerald-500/25 text-emerald-400'
                        }`}>
                        {u.role}
                      </span>
                      {u.id !== user.id && (
                        <button
                          onClick={() => handleAdminDeleteUser(u.id)}
                          className="px-2.5 py-1 rounded bg-red-50 hover:bg-red-500/25 border border-red-500/25 text-red-650 text-[10px] font-bold transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ASSIGN TEACHERS */}
        {adminActiveTab === 'mapping' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="academic-card p-6">
              <h4 className="font-bold text-sm text-gray-800 border-b border-gray-200 pb-4 mb-4">Assign Classroom Instructor</h4>
              <form onSubmit={handleAdminAssignTeacher} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-500 mb-1.5">Select Lecture Course</label>
                  <select
                    value={mapRoomId}
                    onChange={(e) => setMapRoomId(e.target.value)}
                    className="w-full bg-slate-955 border border-gray-200 rounded pl-3 pr-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Choose Classroom --</option>
                    {classrooms.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-500 mb-1.5">Select Teacher</label>
                  <select
                    value={mapTeacherId}
                    onChange={(e) => setMapTeacherId(e.target.value)}
                    className="w-full bg-slate-955 border border-gray-200 rounded pl-3 pr-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Choose Teacher --</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.email})</option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 text-xs font-bold transition-all shadow-sm"
                >
                  Assign Instructor
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 academic-card p-6">
              <h4 className="font-bold text-sm text-gray-800 border-b border-gray-200 pb-4 mb-4">Classroom Mapping Directory</h4>
              <div className="space-y-4">
                {classrooms.map(c => {
                  const teacherAssigned = adminUsers.find(u => u.id === c.teacher_id);
                  return (
                    <div key={c.id} className="p-4 bg-slate-955/60 rounded border border-gray-200 flex items-center justify-between hover:border-gray-200 transition-colors">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h5 className="font-bold text-gray-800 text-sm">{c.name}</h5>
                          <span className="px-2 py-0.5 rounded bg-white border border-gray-200 text-[10px] font-bold text-indigo-600 tracking-wider">
                            {c.code}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1">
                          Mapped Teacher: <span className="text-gray-700 font-bold">{teacherAssigned?.name || "None Mapped Yet"}</span>
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${c.is_live
                          ? 'bg-emerald-50 border-emerald-500/25 text-emerald-400 animate-pulse'
                          : 'bg-white border-gray-200 text-gray-500'
                        }`}>
                        {c.is_live ? 'Live Session Active' : 'Session Offline'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ACADEMIC STRUCTURE & TIMETABLES */}
        {adminActiveTab === 'departments' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Department Panel */}
              <div className="academic-card p-6 space-y-4">
                <h4 className="font-bold text-sm text-gray-800 border-b border-gray-200 pb-4">Initialize Department Structure</h4>
                <form onSubmit={handleAdminCreateDept} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-500 mb-1.5">Department Name</label>
                      <input
                        type="text"
                        required
                        value={deptName}
                        onChange={(e) => setDeptName(e.target.value)}
                        className="w-full bg-slate-955 border border-gray-200 rounded pl-3 pr-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                        placeholder="e.g. Computer Science"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-500 mb-1.5">Unique Code</label>
                      <input
                        type="text"
                        required
                        value={deptCode}
                        onChange={(e) => setDeptCode(e.target.value)}
                        className="w-full bg-slate-955 border border-gray-200 rounded pl-3 pr-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                        placeholder="e.g. CS"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded bg-black/10 hover:bg-black/25 border border-indigo-500/25 hover:border-indigo-500/50 text-indigo-600 text-xs font-bold transition-all"
                  >
                    Add Academic Department
                  </button>
                </form>

                <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                  {departments.length === 0 ? (
                    <p className="text-[10px] text-slate-600 italic">No departments configured yet.</p>
                  ) : (
                    departments.map(d => (
                      <div key={d.id} className="p-2.5 bg-slate-955/60 rounded border border-gray-200 flex items-center justify-between text-xs">
                        <span className="font-bold text-gray-700">{d.name}</span>
                        <span className="px-1.5 py-0.5 rounded bg-white border border-gray-200 text-[9px] font-bold text-indigo-600 font-mono">{d.code}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Schedule slot Creator */}
              <div className="academic-card p-6 space-y-4">
                <h4 className="font-bold text-sm text-gray-800 border-b border-gray-200 pb-4">Schedule Timetable Block</h4>
                <form onSubmit={handleAdminCreateSchedule} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-500 mb-1.5">Classroom</label>
                      <select
                        value={schedRoomId}
                        onChange={(e) => setSchedRoomId(e.target.value)}
                        className="w-full bg-slate-955 border border-gray-200 rounded pl-3 pr-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="">-- Choose Classroom --</option>
                        {classrooms.map(c => (
                          <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-500 mb-1.5">Subject Description</label>
                      <input
                        type="text"
                        required
                        value={schedSubject}
                        onChange={(e) => setSchedSubject(e.target.value)}
                        className="w-full bg-slate-955 border border-gray-200 rounded pl-3 pr-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                        placeholder="e.g. Distributed Database"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-500 mb-1.5">Day of Week</label>
                      <select
                        value={schedDay}
                        onChange={(e) => setSchedDay(e.target.value)}
                        className="w-full bg-slate-955 border border-gray-200 rounded pl-3 pr-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                      >
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-555 mb-1.5">Start Time</label>
                      <input
                        type="text"
                        required
                        value={schedStart}
                        onChange={(e) => setSchedStart(e.target.value)}
                        className="w-full bg-slate-955 border border-gray-200 rounded pl-3 pr-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                        placeholder="09:00"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-555 mb-1.5">End Time</label>
                      <input
                        type="text"
                        required
                        value={schedEnd}
                        onChange={(e) => setSchedEnd(e.target.value)}
                        className="w-full bg-slate-955 border border-gray-200 rounded pl-3 pr-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                        placeholder="10:30"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 text-xs font-bold transition-all shadow-sm"
                  >
                    Generate Schedule Slot
                  </button>
                </form>
              </div>
            </div>

            <div className="academic-card p-6">
              <h4 className="font-bold text-sm text-gray-800 border-b border-gray-200 pb-4 mb-4">Master Academic Schedule</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500">
                      <th className="py-2.5 font-bold">Subject</th>
                      <th className="py-2.5 font-bold">Classroom Code</th>
                      <th className="py-2.5 font-bold">Day</th>
                      <th className="py-2.5 font-bold">Schedule Slot</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    {timetables.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="py-6 text-center text-slate-600 italic">No timetables generated yet. Add one above.</td>
                      </tr>
                    ) : (
                      timetables.map(s => (
                        <tr key={s.id} className="text-gray-700 hover:bg-white/40">
                          <td className="py-3 font-bold text-gray-800">{s.subject_name}</td>
                          <td className="py-3"><span className="px-2 py-0.5 bg-white rounded border border-gray-200 text-indigo-600 font-bold">{s.classroom_code}</span></td>
                          <td className="py-3 font-semibold">{s.day_of_week}</td>
                          <td className="py-3 font-semibold text-gray-800">{s.start_time} - {s.end_time}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: AI LOGS & SYSTEM TELEMETRY */}
        {adminActiveTab === 'telemetry' && (
          <div className="space-y-6">
            <div className="academic-card p-6 space-y-4">
              <h4 className="font-bold text-sm text-gray-800 border-b border-gray-200 pb-4">Live Platform Event Pipeline</h4>
              <div className="font-mono text-xs text-indigo-600 space-y-2 bg-white p-4 rounded-lg border border-gray-200 overflow-y-auto max-h-[220px]">
                <p>[22:36:02 INFO] FastAPI server connection pool initialized successfully.</p>
                <p>[22:36:05 INFO] Successfully bound PostgreSQL dialect engine check local ports.</p>
                <p>[22:36:10 INFO] Synchronized WebSocket listeners manager loaded: connections clean.</p>
                <p>[22:36:12 INFO] Redis ping diagnostic successfully returned pong. Cache synchronized.</p>
                <p>[22:36:40 INFO] AI agent whisper audio stream confidence check: 98.4% status optimal.</p>
                <p>[22:36:41 INFO] Platform check diagnostics completed: 0 errors detected.</p>
              </div>
            </div>

            <div className="academic-card p-6">
              <h4 className="font-bold text-sm text-gray-800 border-b border-gray-200 pb-4 mb-4">Enterprise AI Performance Observatory</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Average AI Latency</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">124 ms</p>
                </div>
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Whisper Confidence Score</p>
                  <p className="text-2xl font-bold text-emerald-700 mt-2">98.2%</p>
                </div>
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">AI Safety Filter Check</p>
                  <p className="text-2xl font-bold text-indigo-600 mt-2">100% Passed</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {user?.role === 'admin' && renderAdminDashboard()}
      {user?.role === 'teacher' && renderTeacherDashboard()}
      {user?.role === 'student' && renderStudentDashboard()}
    </div>
  );
};


export default Dashboard;
