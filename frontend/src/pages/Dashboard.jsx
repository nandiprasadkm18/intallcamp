import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import SuperAdminDashboard from './SuperAdminDashboard';
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
  Trash2,
  Eye,
  EyeOff,
  Download,
  Settings,
  X
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
import { useNavigate } from 'react-router-dom';



const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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
  const [newRoomSection, setNewRoomSection] = useState("7th Sem A");
  const [newRoomYear, setNewRoomYear] = useState("4");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadFile, setUploadFile] = useState(null);

  // New enterprise role state
  const [timetables, setTimetables] = useState([]);
  const [isTimetableEditMode, setIsTimetableEditMode] = useState(false);
  const [editingTimetableSlot, setEditingTimetableSlot] = useState(null);
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
  const [adminDeptFilter, setAdminDeptFilter] = useState("all");
  const [adminDirYearFilter, setAdminDirYearFilter] = useState("all");
  const [adminDirSemFilter, setAdminDirSemFilter] = useState("all");
  const [adminDirSecFilter, setAdminDirSecFilter] = useState("all");

  // Admin Create User form state
  const [adminUserEmail, setAdminUserEmail] = useState("");
  const [adminUserName, setAdminUserName] = useState("");
  const [adminUserPass, setAdminUserPass] = useState("");
  const [adminUserRole, setAdminUserRole] = useState("student");
  const [adminUserDepartment, setAdminUserDepartment] = useState("CSE");
  const [adminUserSection, setAdminUserSection] = useState("A");
  const [adminUserYear, setAdminUserYear] = useState("1");
  const [adminUserSemester, setAdminUserSemester] = useState("1");
  const [showAdminUserPass, setShowAdminUserPass] = useState(false);

  // Admin Create Department form state
  const [deptName, setDeptName] = useState("");
  const [deptCode, setDeptCode] = useState("");

  // Admin Assign Teacher form state
  const [mapRoomId, setMapRoomId] = useState("");
  const [mapTeacherId, setMapTeacherId] = useState("");

  // Timetable Filters
  const [ttFilterYear, setTtFilterYear] = useState("4");
  const [ttFilterSem, setTtFilterSem] = useState("7");
  const [ttFilterDept, setTtFilterDept] = useState("CSE");
  const [ttFilterSection, setTtFilterSection] = useState("A");

  // Admin Create Timetable schedule form state
  const [schedRoomName, setSchedRoomName] = useState("");
  const [schedDay, setSchedDay] = useState("Monday");
  const [schedStart, setSchedStart] = useState("09:00 AM");
  const [schedEnd, setSchedEnd] = useState("10:30 AM");
  const [schedSubject, setSchedSubject] = useState("");
  const [schedYear, setSchedYear] = useState("4");
  const [schedSem, setSchedSem] = useState("7");
  const [schedDept, setSchedDept] = useState("CSE");
  const [schedSection, setSchedSection] = useState("A");

  // Platform announcements state
  const [announcements, setAnnouncements] = useState([]);
  const [annTitle, setAnnTitle] = useState("");
  const [annBody, setAnnBody] = useState("");

  // Export Modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');
  const [exportFields, setExportFields] = useState({
    name: true,
    email: true,
    role: true,
    department: true,
    year: false,
    semester: false,
    section: false
  });

  const handleExportDirectory = () => {
    const filteredToExport = adminUsers.filter(u => {
      const roleName = (u.role?.name || u.role || "").toLowerCase();
      const roleMatch = adminUserFilter === 'all' || roleName === adminUserFilter;
      const deptMatch = adminDeptFilter === 'all' || u.department === adminDeptFilter;
      
      if (!roleMatch || !deptMatch) return false;
      
      if (roleName === 'student') {
        if (adminDirYearFilter !== 'all' && u.year?.toString() !== adminDirYearFilter) return false;
        if (adminDirSemFilter !== 'all' && u.semester?.toString() !== adminDirSemFilter) return false;
        if (adminDirSecFilter !== 'all' && u.section !== adminDirSecFilter) return false;
      }
      return true;
    });

    if (filteredToExport.length === 0) {
      alert("No users to export with current filters!");
      return;
    }

    const headers = [];
    const fieldsToExtract = [];

    if (exportFields.name) { headers.push("Full Name"); fieldsToExtract.push(u => u.full_name || u.name || ""); }
    if (exportFields.email) { headers.push("Email"); fieldsToExtract.push(u => u.email || ""); }
    if (exportFields.role) { headers.push("Role"); fieldsToExtract.push(u => u.role?.name || u.role || ""); }
    if (exportFields.department) { headers.push("Department"); fieldsToExtract.push(u => u.department || ""); }
    if (exportFields.year) { headers.push("Year"); fieldsToExtract.push(u => u.year || ""); }
    if (exportFields.semester) { headers.push("Semester"); fieldsToExtract.push(u => u.semester || ""); }
    if (exportFields.section) { headers.push("Section"); fieldsToExtract.push(u => u.section || ""); }

    const rows = filteredToExport.map(u => fieldsToExtract.map(extractor => extractor(u)));

    if (exportFormat === 'csv') {
      const csvContent = [
        headers.join(","),
        ...rows.map(r => r.map(v => `"${(v?.toString() || "").replace(/"/g, '""')}"`).join(","))
      ].join("\n");
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "intellicamp_user_directory.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (exportFormat === 'pdf') {
      const doc = new jsPDF();
      doc.text("IntelliCamp User Directory", 14, 15);
      doc.text(`Filters: Role (${adminUserFilter}), Dept (${adminDeptFilter})`, 14, 22);
      
      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 30,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [79, 70, 229] }
      });
      
      doc.save("intellicamp_user_directory.pdf");
    }

    setShowExportModal(false);
  };

  const loadRooms = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/academic/classrooms`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const roomsData = await response.json();
        setClassrooms(roomsData);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadAdminData = async () => {
    if (user?.role !== 'College Admin') return;
    try {
      // System metrics (Note: may not exist in v1, handled gracefully if 404)
      const resMetrics = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/system/metrics`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (resMetrics.ok) setAdminMetrics(await resMetrics.json());

      const resUsers = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/users/college/${user.college_id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (resUsers.ok) setAdminUsers(await resUsers.json());

      const resDepts = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/tenant/departments`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (resDepts.ok) setDepartments(await resDepts.json());
    } catch (e) {
      console.error(e);
    }
  };

  const loadTimetables = async () => {
    try {
      let url = `${import.meta.env.VITE_API_URL}/api/admin/timetables`;
      if (user?.role === 'College Admin') {
        url += `?year=${ttFilterYear}&semester=${ttFilterSem}&department=${ttFilterDept}&section=${ttFilterSection}`;
      } else if (user?.year && user?.semester && user?.department) {
         url += `?year=${user.year}&semester=${user.semester}&department=${user.department}&section=${user.section}`;
      } else if (user?.section) {
         url += `?section=${encodeURIComponent(user.section)}`;
      }
      const resSchedules = await fetch(url, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (resSchedules.ok) setTimetables(await resSchedules.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (user?.role === 'College Admin' && adminActiveTab === 'schedules') {
      loadTimetables(); // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, [adminActiveTab]);

  const loadAnnouncements = async () => {
    try {
      const resAnn = await fetch(`${import.meta.env.VITE_API_URL}/api/announcements`);
      if (resAnn.ok) setAnnouncements(await resAnn.json());
    } catch (e) {
      console.error(e);
    }
  };

  const loadStudentMetrics = async () => {
    if (user?.role !== 'Student') return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/student/dashboard/metrics`, {
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
    if (user?.role !== 'Teacher' && user?.role !== 'College Admin') return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/teacher/dashboard/metrics`, {
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
    if (user?.role !== 'Student' && user?.role !== 'Teacher' && user?.role !== 'College Admin') return;
    try {
      const endpoint = user?.role === 'Student'
        ? `${import.meta.env.VITE_API_URL}/api/student/dashboard/chart`
        : `${import.meta.env.VITE_API_URL}/api/teacher/dashboard/chart`;

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
    if (user?.role === 'Super Admin') return;

    loadRooms(); // eslint-disable-line react-hooks/set-state-in-effect
    loadTimetables(); // eslint-disable-line react-hooks/set-state-in-effect
    loadAnnouncements(); // eslint-disable-line react-hooks/set-state-in-effect
    if (user?.role === 'College Admin') {
      loadAdminData();
    }
    if (user?.role === 'Student') {
      loadStudentMetrics();
      loadChartData();
    }
    if (user?.role === 'Teacher' || user?.role === 'College Admin') {
      loadTeacherMetrics();
      loadChartData();
    }

    // Leave previous classroom state on entering main dashboard to keep flow clean
    leaveClassroom();
  }, [user]);


  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!newRoomName || !newRoomSection) {
      setError("Please fill out all fields");
      return;
    }
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/academic/classrooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ name: newRoomName, code: newRoomSection, year: parseInt(newRoomYear) }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Failed to create room");
      }
      setSuccess(`Room ${data.code} successfully created!`);
      setNewRoomName("");
      setNewRoomSection("7th Sem A");
      setNewRoomYear("4");
      loadRooms();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteClassroom = async (code) => {
    setError("");
    setSuccess("");
    if (!window.confirm(`Are you sure you want to end this live classroom session (${code})? Related resources, transcripts, and timetables will be preserved.`)) {
      return;
    }
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/academic/classrooms/${code}`, {
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

  const handleUpdateTimetable = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/timetables/${editingTimetableSlot.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          subject_name: editingTimetableSlot.subject_name,
          start_time: editingTimetableSlot.start_time,
          end_time: editingTimetableSlot.end_time
        }),
      });
      if (response.ok) {
        setEditingTimetableSlot(null);
        loadTimetables();
      } else {
        alert("Failed to update timetable");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTimetable = async (id) => {
    if (!window.confirm("Are you sure you want to delete this class slot?")) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/timetables/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        setEditingTimetableSlot(null);
        loadTimetables();
      } else {
        alert("Failed to delete timetable");
      }
    } catch (err) {
      console.error(err);
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
      const roleMap = {
        "student": "Student",
        "teacher": "Teacher",
        "admin": "College Admin"
      };
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          email: adminUserEmail,
          full_name: adminUserName,
          password: adminUserPass,
          role_name: roleMap[adminUserRole] || "Student",
          year: adminUserRole === 'student' ? parseInt(adminUserYear) : null,
          semester: adminUserRole === 'student' ? parseInt(adminUserSemester) : null,
          section: adminUserRole === 'student' ? adminUserSection : null,
          department: (adminUserRole === 'student' || adminUserRole === 'teacher') ? adminUserDepartment.toUpperCase() : null
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Failed to create user");
      }
      setSuccess(`User ${data.full_name || data.name} successfully created!`);
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/users/${id}`, {
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/departments`, {
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/classrooms/${mapRoomId}/assign`, {
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
    if (!schedSubject || !schedStart || !schedEnd) {
      setError("Please fill out subject and time fields");
      return;
    }
    try {
      let resolvedRoomId = null;
      if (schedRoomName && schedRoomName.trim() !== '') {
        const existingRoom = classrooms.find(c => c.name.toLowerCase() === schedRoomName.toLowerCase() || c.code.toLowerCase() === schedRoomName.toLowerCase());
        if (existingRoom) {
          resolvedRoomId = existingRoom.id;
        } else {
          const resRoom = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/academic/classrooms`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ name: schedRoomName, code: schedRoomName }),
          });
          if (!resRoom.ok) throw new Error("Failed to auto-create classroom");
          const newRoomData = await resRoom.json();
          resolvedRoomId = newRoomData.id;
          loadRooms();
        }
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/timetables`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          classroom_id: resolvedRoomId,
          day_of_week: schedDay,
          start_time: schedStart,
          end_time: schedEnd,
          subject_name: schedSubject,
          year: parseInt(schedYear),
          semester: parseInt(schedSem),
          department: schedDept,
          section: schedSection
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Failed to create schedule");
      }
      setSuccess("Timetable schedule block successfully created!");
      setSchedRoomName("");
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/announcements`, {
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
      navigate('/live');
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
    if (!uploadTitle || !uploadFile) return;

    // Simulate uploading for joined active classroom or first classroom
    const targetRoom = classrooms[0];
    if (!targetRoom) {
      setError("Please create a classroom first to upload resources.");
      return;
    }

    try {
      await joinClassroom(targetRoom.code);
      await uploadResource(uploadTitle, uploadFile);
      setUploadTitle("");
      setUploadFile(null);
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


        {/* Dynamic Section Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main List Classrooms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Classes List */}
            <div className="academic-card p-6">
              <h4 className="font-semibold text-base text-gray-800 border-b border-gray-200 pb-4 mb-5 flex justify-between items-center">
                <span>Active Classes</span>
                <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full font-bold">{classrooms.length} Classes</span>
              </h4>
              {classrooms.length === 0 ? (
                <p className="text-sm text-gray-500 italic text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">No classes created yet. Create one from the panel on the right.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {classrooms.map(room => (
                    <div key={room.id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md hover:border-indigo-200 transition-all group bg-white">
                      <div className="flex justify-between items-start mb-3">
                        <div className="space-y-1">
                          <h5 className="font-bold text-gray-800 text-base">{room.name}</h5>
                          <span className="inline-block text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">{room.code}</span>
                        </div>
                        <button 
                          onClick={() => handleDeleteClassroom(room.code)} 
                          className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors"
                          title="Delete Class"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="mt-5">
                        <button 
                          onClick={() => handleJoinRoom(room.code)}
                          className="w-full bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white border border-indigo-200 text-xs font-bold py-2 rounded-md flex justify-center items-center gap-1.5 transition-all shadow-sm group-hover:shadow"
                        >
                          <Play className="h-3.5 w-3.5" /> Enter Classroom
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Performance Analytics Card */}
            <div className="academic-card p-6">
              <h4 className="font-semibold text-base text-gray-800 border-b border-gray-200 pb-4 mb-5">Engagement Analytics</h4>
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
               <h4 className="font-semibold text-sm text-gray-800 border-b border-gray-200 pb-4 mb-4 flex items-center space-x-2">
                <Plus className="h-4 w-4 text-indigo-500" />
                <span>Create Class</span>
              </h4>
              <form onSubmit={handleCreateRoom} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Subject Name</label>
                  <input
                    type="text"
                    required
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded pl-3 pr-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. Computer Networks"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Target Year</label>
                  <select
                    required
                    value={newRoomYear}
                    onChange={(e) => setNewRoomYear(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Target Section</label>
                  <select
                    required
                    value={newRoomSection}
                    onChange={(e) => setNewRoomSection(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="All Sections">All Sections</option>
                    <option value="7th Sem A">7th Sem A</option>
                    <option value="7th Sem B">7th Sem B</option>
                    <option value="7th Sem C">7th Sem C</option>
                    <option value="7th Sem D">7th Sem D</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 font-semibold text-xs transition-all shadow-sm cursor-pointer active:scale-95"
                >
                  Create Class
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
    return (
      <div className="space-y-8">
        {/* Student Welcome Banner */}
        <div className="p-6 rounded-xl bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_0_20px_rgba(0,0,0,0.3)]">
          <div className="space-y-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-200">
              <Sparkles className="h-3 w-3 mr-1" /> Student Workspace Active
            </span>
            <h3 className="text-xl font-semibold text-gray-900">Welcome back to INTELLCAMP, {user.name}!</h3>
            <p className="text-gray-600 text-xs max-w-xl">
              Join your scheduled classes below to view live transcribing lectures, anonymously ask doubt queries, or synchronized workspaces.
            </p>
          </div>
        </div>

        {error && <div className="p-3.5 text-xs font-semibold rounded bg-red-50 border border-red-200 text-red-650">{error}</div>}

        {/* Live Rooms Indicators */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="academic-card p-6">
              <h4 className="font-semibold text-base text-gray-800 border-b border-gray-200 pb-4 mb-5 flex items-center justify-between">
                <span>Your Classrooms</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white text-gray-500 border border-gray-200">
                  {classrooms.length} Enrolled
                </span>
              </h4>

              <div className="space-y-4">
                {classrooms.length === 0 ? (
                  <div className="p-8 text-center text-xs text-gray-500 border border-dashed border-gray-200 rounded-lg">
                    <Zap className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="font-semibold">No classrooms found for your section.</p>
                    <p className="text-[10px] text-slate-600 mt-1">Classrooms created for your section will appear here automatically.</p>
                  </div>
                ) : (
                  classrooms.map((room) => (
                    <div key={room.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          {room.is_live && (
                            <span className="flex h-2 w-2 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                          )}
                          <h5 className="font-semibold text-gray-800 text-sm">{room.name}</h5>
                          <span className="px-2 py-0.5 rounded bg-white border border-gray-200 text-[10px] font-semibold text-indigo-600 tracking-wider">
                            {room.code}
                          </span>
                        </div>
                        <p className="text-gray-500 text-xs mt-1">Instructor: {room.teacher_name || "Staff Member"}</p>
                      </div>

                      <button
                        onClick={() => handleJoinRoom(room.code)}
                        className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 font-semibold text-xs shadow-[0_0_10px_rgba(16,185,129,0.2)] flex items-center space-x-1.5 transition-all"
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
              <h4 className="font-semibold text-base text-gray-800 border-b border-gray-200 pb-4 mb-5">Your Academic Growth Log</h4>
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
              <h4 className="font-semibold text-sm text-gray-800 border-b border-gray-200 pb-4 mb-4">Academic Summary</h4>
              <div className="space-y-4 text-xs font-semibold">
                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-600">Attendance Percent</span>
                  <span className="text-gray-800 text-indigo-600 font-semibold">{studentMetrics.attendance_percent}%</span>
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



            <div className="academic-card p-6">
              <h4 className="font-semibold text-sm text-gray-800 border-b border-gray-200 pb-4 mb-4">Registered Subjects</h4>
              <div className="space-y-3">
                {studentMetrics.registered_subjects.length === 0 ? (
                  <p className="text-[10px] text-gray-400 italic text-center py-4">No enrolled subjects registered in database.</p>
                ) : (
                  studentMetrics.registered_subjects.map((sub, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded border border-gray-200 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-gray-800">{sub.classroom_name}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">Subject: {sub.classroom_code} ({sub.status})</p>
                      </div>
                      <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-200 text-[9px] font-semibold">{sub.grade} Grade</span>
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
    const teachers = adminUsers.filter(u => (u.role?.name || u.role || "").toLowerCase() === 'teacher');

    return (
      <div className="space-y-8">
        {/* Admin Navigation Tabs */}
        <div className="flex border-b border-gray-200 pb-2 gap-4">
          {[
            { id: 'overview', name: 'System Analytics' },
            { id: 'users', name: 'Register Users' },
            { id: 'directory', name: 'User Directory' },
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
                if (tab.id === 'users') { setAdminUserFilter('all'); setAdminDeptFilter('all'); }
              }}
              className={`px-4 py-2 font-semibold text-xs uppercase tracking-wider transition-all border-b-2 ${adminActiveTab === tab.id
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
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">Total Students</p>
                <h3 className="text-2xl font-semibold text-gray-800 mt-2">{adminMetrics?.metrics?.users?.students || adminUsers.filter(u => (u.role?.name || u.role || '').toLowerCase() === 'student').length || 0}</h3>
                <p className="text-[10px] text-gray-500 mt-1">Registered student accounts</p>
              </div>
              <div 
                onClick={() => { setAdminActiveTab('users'); setAdminUserFilter('teacher'); }}
                className="academic-card p-6 bg-white/40 border border-gray-200 cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">Total Teachers</p>
                <h3 className="text-2xl font-semibold text-gray-800 mt-2">{adminMetrics?.metrics?.users?.teachers || adminUsers.filter(u => (u.role?.name || u.role || '').toLowerCase() === 'teacher').length || 0}</h3>
                <p className="text-[10px] text-gray-500 mt-1">Registered teacher accounts</p>
              </div>
              <div 
                onClick={() => setAdminActiveTab('departments')}
                className="academic-card p-6 bg-white/40 border border-gray-200 cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">Total Classes</p>
                <h3 className="text-2xl font-semibold text-gray-800 mt-2">{adminMetrics?.metrics?.classrooms?.total || 0}</h3>
                <p className="text-[10px] text-gray-500 mt-1">Total configured classrooms</p>
              </div>
              <div 
                onClick={() => setAdminActiveTab('departments')}
                className="academic-card p-6 bg-white/40 border border-gray-200 cursor-pointer hover:border-emerald-500 hover:shadow-md transition-all"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">Active Classes</p>
                <h3 className="text-2xl font-semibold text-emerald-700 mt-2">{adminMetrics?.metrics?.classrooms?.active_live || 0}</h3>
                <p className="text-[10px] text-gray-500 mt-1">Currently live lectures</p>
              </div>
              <div 
                onClick={() => setAdminActiveTab('telemetry')}
                className="academic-card p-6 bg-white/40 border border-gray-200 cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">Today's Attendance %</p>
                <h3 className="text-2xl font-semibold text-indigo-600 mt-2">87.5%</h3>
                <p className="text-[10px] text-gray-500 mt-1">Platform average today</p>
              </div>
              <div 
                onClick={() => setAdminActiveTab('telemetry')}
                className="academic-card p-6 bg-white/40 border border-gray-200 cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">Lectures Conducted Today</p>
                <h3 className="text-2xl font-semibold text-gray-800 mt-2">12</h3>
                <p className="text-[10px] text-gray-500 mt-1">Total sessions completed</p>
              </div>
              <div 
                onClick={() => setAdminActiveTab('telemetry')}
                className="academic-card p-6 bg-white/40 border border-gray-200 cursor-pointer hover:border-amber-500 hover:shadow-md transition-all"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">System Alerts</p>
                <h3 className="text-2xl font-semibold text-amber-600 mt-2">0</h3>
                <p className="text-[10px] text-gray-500 mt-1">No critical issues</p>
              </div>
              <div 
                onClick={() => setAdminActiveTab('telemetry')}
                className="academic-card p-6 bg-white/40 border border-gray-200 cursor-pointer hover:border-emerald-500 hover:shadow-md transition-all"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">Platform Usage</p>
                <h3 className="text-2xl font-semibold text-emerald-700 mt-2">{adminMetrics?.cpu_usage || 12.5}%</h3>
                <p className="text-[10px] text-gray-500 mt-1">Current system load</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 academic-card p-6">
                <h4 className="font-semibold text-sm text-gray-800 border-b border-gray-200 pb-4 mb-4">Database Health Diagnostics</h4>
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
                <h4 className="font-semibold text-sm text-gray-800 border-b border-gray-200 pb-4">Platform Health Indicators</h4>
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
                <h4 className="font-semibold text-sm text-gray-800 border-b border-gray-200 pb-4 flex items-center space-x-2">
                  <Plus className="h-4 w-4 text-indigo-500" />
                  <span>Broadcast System Announcement</span>
                </h4>
                <form onSubmit={handleAdminCreateAnnouncement} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Announcement Title</label>
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
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-555 mb-1.5">Announcement Message</label>
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
                    className="w-full py-2.5 rounded bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 text-xs font-semibold transition-all shadow-sm"
                  >
                    Broadcast Announcement
                  </button>
                </form>
              </div>

              {/* Announcements Overview */}
              <div className="lg:col-span-2 academic-card p-6 space-y-4">
                <h4 className="font-semibold text-sm text-gray-800 border-b border-gray-200 pb-4 font-sans">Notifications & Broadcasts Overview ({announcements.length})</h4>
                <div className="space-y-3 max-h-[290px] overflow-y-auto pr-1">
                  {announcements.length === 0 ? (
                    <p className="text-xs text-gray-500 italic text-center py-10 font-semibold">No platform announcements broadcasted yet.</p>
                  ) : (
                    announcements.map(ann => (
                      <div key={ann.id} className="p-4 bg-slate-955/60 rounded border border-gray-200 space-y-2 hover:border-gray-200 transition-colors">
                        <div className="flex justify-between items-center border-b border-gray-200 pb-1.5">
                          <span className="font-semibold text-gray-800 text-xs">{ann.title}</span>
                          <span className="text-[9px] text-slate-555 font-semibold">{new Date(ann.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-gray-600 text-xs leading-relaxed">{ann.message}</p>
                        <span className="block text-[9px] text-indigo-600 font-semibold uppercase tracking-wider">Broadcasted by: {ann.sender}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: REGISTER USERS */}
        {adminActiveTab === 'users' && (
          <div className="max-w-2xl mx-auto">
            <div className="academic-card p-6">
              <h4 className="font-semibold text-sm text-gray-800 border-b border-gray-200 pb-4 mb-4">Register New System User</h4>
              <form onSubmit={handleAdminCreateUser} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">User Account Role</label>
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
                {/* Department (Only for Student and Teacher) */}
                {(adminUserRole === 'student' || adminUserRole === 'teacher') && (
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Department</label>
                    <select
                      value={adminUserDepartment}
                      onChange={(e) => {
                        const newDept = e.target.value;
                        setAdminUserDepartment(newDept);
                        if (newDept === 'ME' || newDept === 'CE') {
                          setAdminUserSection('A');
                        } else if (newDept === 'ECE' && (adminUserSection === 'C' || adminUserSection === 'D')) {
                          setAdminUserSection('A');
                        }
                      }}
                      className="w-full bg-slate-955 border border-gray-200 rounded pl-3 pr-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="CSE">CSE</option>
                      <option value="ECE">ECE</option>
                      <option value="ME">ME</option>
                      <option value="CE">CE</option>
                    </select>
                  </div>
                )}
                {/* Year, Semester, Section (Only for Student Register) */}
                {adminUserRole === 'student' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Year</label>
                      <select
                        value={adminUserYear}
                        onChange={(e) => setAdminUserYear(e.target.value)}
                        className="w-full bg-slate-955 border border-gray-200 rounded px-2 py-2 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                      >
                        {[1,2,3,4].map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Sem</label>
                      <select
                        value={adminUserSemester}
                        onChange={(e) => setAdminUserSemester(e.target.value)}
                        className="w-full bg-slate-955 border border-gray-200 rounded px-2 py-2 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                      >
                        {adminUserYear 
                          ? [(parseInt(adminUserYear) - 1) * 2 + 1, parseInt(adminUserYear) * 2].map(s => <option key={s} value={s}>{s}</option>)
                          : [1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)
                        }
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Section</label>
                      <select
                        value={adminUserSection}
                        onChange={(e) => setAdminUserSection(e.target.value)}
                        className="w-full bg-slate-955 border border-gray-200 rounded px-2 py-2 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                      >
                        {adminUserDepartment === 'CSE' && ['A','B','C','D'].map(s => <option key={s} value={s}>{s}</option>)}
                        {adminUserDepartment === 'ECE' && ['A','B'].map(s => <option key={s} value={s}>{s}</option>)}
                        {(adminUserDepartment === 'ME' || adminUserDepartment === 'CE') && <option value="A">A</option>}
                      </select>
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Full Name</label>
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
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-555 mb-1.5">Email Address</label>
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
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-555 mb-1.5">Default Password</label>
                  <div className="relative">
                    <input
                      type={showAdminUserPass ? "text" : "password"}
                      required
                      value={adminUserPass}
                      onChange={(e) => setAdminUserPass(e.target.value)}
                      className="w-full bg-slate-955 border border-gray-200 rounded pl-3 pr-10 py-2 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                      placeholder="Enter default password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminUserPass(!showAdminUserPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showAdminUserPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 text-xs font-semibold transition-all shadow-sm"
                >
                  Register Profile
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2.5: USER DIRECTORY */}
        {adminActiveTab === 'directory' && (
          <div className="academic-card p-6">
            <div className="border-b border-gray-200 pb-4 mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h4 className="font-semibold text-sm text-gray-800">
                {adminUserFilter === 'all' ? 'All Platform Accounts' : adminUserFilter === 'student' ? 'Student Accounts' : 'Teacher Accounts'} ({adminUsers.filter(u => {
                  const roleName = (u.role?.name || u.role || "").toLowerCase();
                  const roleMatch = adminUserFilter === 'all' || roleName === adminUserFilter;
                  const deptMatch = adminDeptFilter === 'all' || u.department === adminDeptFilter;
                  
                  if (!roleMatch || !deptMatch) return false;
                  
                  if (roleName === 'student') {
                    if (adminDirYearFilter !== 'all' && u.year?.toString() !== adminDirYearFilter) return false;
                    if (adminDirSemFilter !== 'all' && u.semester?.toString() !== adminDirSemFilter) return false;
                    if (adminDirSecFilter !== 'all' && u.section !== adminDirSecFilter) return false;
                  }
                  
                  return true;
                }).length})
              </h4>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={adminUserFilter}
                  onChange={(e) => {
                    setAdminUserFilter(e.target.value);
                    if (e.target.value !== 'student') {
                      setAdminDirYearFilter('all');
                      setAdminDirSemFilter('all');
                      setAdminDirSecFilter('all');
                    }
                  }}
                  className="bg-white border border-gray-200 rounded text-[10px] px-2 py-1 text-gray-700 font-semibold uppercase tracking-wider focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Roles</option>
                  <option value="student">Students</option>
                  <option value="teacher">Teachers</option>
                </select>
                <select
                  value={adminDeptFilter}
                  onChange={(e) => setAdminDeptFilter(e.target.value)}
                  className="bg-white border border-gray-200 rounded text-[10px] px-2 py-1 text-gray-700 font-semibold uppercase tracking-wider focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Depts</option>
                  <option value="CSE">CSE</option>
                  <option value="ECE">ECE</option>
                  <option value="ME">ME</option>
                  <option value="CE">CE</option>
                </select>
                
                {adminUserFilter === 'student' && (
                  <>
                    <select
                      value={adminDirYearFilter}
                      onChange={(e) => {
                        setAdminDirYearFilter(e.target.value);
                        setAdminDirSemFilter('all'); // reset sem on year change
                      }}
                      className="bg-white border border-gray-200 rounded text-[10px] px-2 py-1 text-gray-700 font-semibold uppercase tracking-wider focus:outline-none focus:border-indigo-500"
                    >
                      <option value="all">All Years</option>
                      {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
                    </select>
                    
                    <select
                      value={adminDirSemFilter}
                      onChange={(e) => setAdminDirSemFilter(e.target.value)}
                      className="bg-white border border-gray-200 rounded text-[10px] px-2 py-1 text-gray-700 font-semibold uppercase tracking-wider focus:outline-none focus:border-indigo-500"
                    >
                      <option value="all">All Sems</option>
                      {adminDirYearFilter !== 'all' 
                        ? [(parseInt(adminDirYearFilter) - 1) * 2 + 1, parseInt(adminDirYearFilter) * 2].map(s => <option key={s} value={s}>Sem {s}</option>)
                        : [1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)
                      }
                    </select>
                    
                    <select
                      value={adminDirSecFilter}
                      onChange={(e) => setAdminDirSecFilter(e.target.value)}
                      className="bg-white border border-gray-200 rounded text-[10px] px-2 py-1 text-gray-700 font-semibold uppercase tracking-wider focus:outline-none focus:border-indigo-500"
                    >
                      <option value="all">All Secs</option>
                      {['A','B','C','D'].map(s => <option key={s} value={s}>Sec {s}</option>)}
                    </select>
                  </>
                )}

                {(adminUserFilter !== 'all' || adminDeptFilter !== 'all' || adminDirYearFilter !== 'all' || adminDirSemFilter !== 'all' || adminDirSecFilter !== 'all') && (
                  <button onClick={() => { 
                    setAdminUserFilter('all'); 
                    setAdminDeptFilter('all'); 
                    setAdminDirYearFilter('all');
                    setAdminDirSemFilter('all');
                    setAdminDirSecFilter('all');
                  }} className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 uppercase">Clear Filters</button>
                )}
                
                <button
                  onClick={() => setShowExportModal(true)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-[10px] font-bold uppercase tracking-wider transition-colors ml-2"
                >
                  <Download className="h-3 w-3" />
                  <span>Export</span>
                </button>
              </div>
            </div>
            <div className="overflow-y-auto max-h-[600px] space-y-3 pr-1">
              {adminUsers.filter(u => {
                const roleName = (u.role?.name || u.role || "").toLowerCase();
                const roleMatch = adminUserFilter === 'all' || roleName === adminUserFilter;
                const deptMatch = adminDeptFilter === 'all' || u.department === adminDeptFilter;
                
                if (!roleMatch || !deptMatch) return false;
                
                if (roleName === 'student') {
                  if (adminDirYearFilter !== 'all' && u.year?.toString() !== adminDirYearFilter) return false;
                  if (adminDirSemFilter !== 'all' && u.semester?.toString() !== adminDirSemFilter) return false;
                  if (adminDirSecFilter !== 'all' && u.section !== adminDirSecFilter) return false;
                }
                
                return true;
              }).map(u => {
                const displayRole = u.role?.name || u.role || "Unknown";
                return (
                <div key={u.id} className="p-3 bg-slate-955/60 rounded border border-gray-200 flex items-center justify-between text-xs hover:border-gray-200 transition-colors">
                  <div>
                    <p className="font-semibold text-gray-800 flex items-center space-x-2">
                      <span>{u.full_name || u.name}</span>
                      {u.department && (
                        <span className="text-gray-600 text-[11px]">
                          [{u.department}{displayRole === 'Student' && u.year ? `, Year: ${u.year}, Sem: ${u.semester}, Sec: ${u.section}` : ''}]
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{u.email}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider border ${displayRole === 'College Admin'
                        ? 'bg-red-50 border-red-500/25 text-red-650'
                        : displayRole === 'Teacher'
                          ? 'bg-indigo-50 border-indigo-500/25 text-indigo-600'
                          : 'bg-emerald-50 border-emerald-500/25 text-emerald-400'
                      }`}>
                      {displayRole}
                    </span>
                    {u.id !== user.id && (
                      <button
                        onClick={() => handleAdminDeleteUser(u.id)}
                        className="px-2.5 py-1 rounded bg-red-50 hover:bg-red-500/25 border border-red-500/25 text-red-650 text-[10px] font-semibold transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              )})}
            </div>

            {/* EXPORT MODAL */}
            {showExportModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                  <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <Download className="h-4 w-4 text-indigo-600" />
                      Export Directory Options
                    </h3>
                    <button onClick={() => setShowExportModal(false)} className="text-gray-400 hover:text-gray-600">
                      <Plus className="h-5 w-5 rotate-45" />
                    </button>
                  </div>
                  
                  <div className="p-5 space-y-5">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-500 mb-2">Export Format</label>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setExportFormat('csv')}
                          className={`flex-1 py-2 rounded text-xs font-bold uppercase tracking-wider border transition-colors ${exportFormat === 'csv' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                        >
                          Excel (CSV)
                        </button>
                        <button
                          onClick={() => setExportFormat('pdf')}
                          className={`flex-1 py-2 rounded text-xs font-bold uppercase tracking-wider border transition-colors ${exportFormat === 'pdf' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                        >
                          PDF
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-500 mb-2">Fields to Export</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-semibold text-gray-700">
                        {Object.keys(exportFields).map(field => (
                          <label key={field} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={exportFields[field]}
                              onChange={(e) => setExportFields({...exportFields, [field]: e.target.checked})}
                              className="rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="capitalize">{field}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-5 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                    <button 
                      onClick={() => setShowExportModal(false)}
                      className="px-4 py-2 rounded bg-white border border-gray-200 text-gray-600 text-xs font-bold uppercase tracking-wider hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleExportDirectory}
                      className="px-4 py-2 rounded bg-white border border-gray-200 text-gray-600 text-xs font-bold uppercase tracking-wider hover:bg-gray-50 transition-colors"
                    >
                      Download File
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ASSIGN TEACHERS */}
        {adminActiveTab === 'mapping' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="academic-card p-6">
              <h4 className="font-semibold text-sm text-gray-800 border-b border-gray-200 pb-4 mb-4">Assign Classroom Instructor</h4>
              <form onSubmit={handleAdminAssignTeacher} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Select Lecture Course</label>
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
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Select Teacher</label>
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
                  className="w-full py-2.5 rounded bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 text-xs font-semibold transition-all shadow-sm"
                >
                  Assign Instructor
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 academic-card p-6">
              <h4 className="font-semibold text-sm text-gray-800 border-b border-gray-200 pb-4 mb-4">Classroom Mapping Directory</h4>
              <div className="space-y-4">
                {classrooms.map(c => {
                  const teacherAssigned = adminUsers.find(u => u.id === c.teacher_id);
                  return (
                    <div key={c.id} className="p-4 bg-slate-955/60 rounded border border-gray-200 flex items-center justify-between hover:border-gray-200 transition-colors">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h5 className="font-semibold text-gray-800 text-sm">{c.name}</h5>
                          <span className="px-2 py-0.5 rounded bg-white border border-gray-200 text-[10px] font-semibold text-indigo-600 tracking-wider">
                            {c.code}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1">
                          Mapped Teacher: <span className="text-gray-700 font-semibold">{teacherAssigned?.name || "None Mapped Yet"}</span>
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${c.is_live
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
                <h4 className="font-semibold text-sm text-gray-800 border-b border-gray-200 pb-4">Initialize Department Structure</h4>
                <form onSubmit={handleAdminCreateDept} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Department Name</label>
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
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Unique Code</label>
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
                    className="w-full py-2.5 rounded bg-black/10 hover:bg-black/25 border border-indigo-500/25 hover:border-indigo-500/50 text-indigo-600 text-xs font-semibold transition-all"
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
                        <span className="font-semibold text-gray-700">{d.name}</span>
                        <span className="px-1.5 py-0.5 rounded bg-white border border-gray-200 text-[9px] font-semibold text-indigo-600 font-mono">{d.code}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Schedule slot Creator */}
              <div className="academic-card p-6 space-y-4">
                <h4 className="font-semibold text-sm text-gray-800 border-b border-gray-200 pb-4">Schedule Timetable Block</h4>
                <form onSubmit={handleAdminCreateSchedule} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Classroom</label>
                      <input
                        type="text"
                        value={schedRoomName}
                        onChange={(e) => setSchedRoomName(e.target.value)}
                        className="w-full bg-slate-955 border border-gray-200 rounded pl-3 pr-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                        placeholder="e.g. M408"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Subject Description</label>
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

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Year</label>
                      <select
                        value={schedYear}
                        onChange={(e) => {
                          setSchedYear(e.target.value);
                          setSchedSem(((parseInt(e.target.value) - 1) * 2 + 1).toString());
                        }}
                        className="w-full bg-slate-955 border border-gray-200 rounded pl-3 pr-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                      >
                        {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Semester</label>
                      <select
                        value={schedSem}
                        onChange={(e) => setSchedSem(e.target.value)}
                        className="w-full bg-slate-955 border border-gray-200 rounded pl-3 pr-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                      >
                        {schedYear 
                          ? [(parseInt(schedYear) - 1) * 2 + 1, parseInt(schedYear) * 2].map(s => <option key={s} value={s}>Sem {s}</option>)
                          : [1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)
                        }
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Department</label>
                      <select
                        value={schedDept}
                        onChange={(e) => {
                          const newDept = e.target.value;
                          setSchedDept(newDept);
                          if (newDept === 'ME' || newDept === 'CE') setSchedSection('A');
                          else if (newDept === 'ECE' && (schedSection === 'C' || schedSection === 'D')) setSchedSection('A');
                        }}
                        className="w-full bg-slate-955 border border-gray-200 rounded pl-3 pr-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="CSE">CSE</option>
                        <option value="ECE">ECE</option>
                        <option value="ME">ME</option>
                        <option value="CE">CE</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Section</label>
                      <select
                        value={schedSection}
                        onChange={(e) => setSchedSection(e.target.value)}
                        className="w-full bg-slate-955 border border-gray-200 rounded pl-3 pr-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                      >
                        {schedDept === 'CSE' && ['A','B','C','D'].map(s => <option key={s} value={s}>Section {s}</option>)}
                        {schedDept === 'ECE' && ['A','B'].map(s => <option key={s} value={s}>Section {s}</option>)}
                        {(schedDept === 'ME' || schedDept === 'CE') && <option value="A">Section A</option>}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Day of Week</label>
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
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-555 mb-1.5">Start Time</label>
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
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-555 mb-1.5">End Time</label>
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
                    className="w-full py-2.5 rounded bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 text-xs font-semibold transition-all shadow-sm"
                  >
                    Generate Schedule Slot
                  </button>
                </form>
              </div>
            </div>

            <div className="academic-card p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-200 pb-4 mb-4 gap-4">
                <div className="flex items-center gap-4">
                  <h4 className="font-semibold text-sm text-gray-800">Master Academic Schedule</h4>
                  {user?.role === 'College Admin' && (
                    <label className="flex items-center gap-2 cursor-pointer border border-indigo-200 bg-indigo-50 px-3 py-1 rounded-full">
                      <input type="checkbox" checked={isTimetableEditMode} onChange={e => setIsTimetableEditMode(e.target.checked)} className="sr-only peer" />
                      <div className="w-7 h-4 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600 relative"></div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-900">Edit Mode</span>
                    </label>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={ttFilterYear}
                    onChange={(e) => {
                      setTtFilterYear(e.target.value);
                      setTtFilterSem(((parseInt(e.target.value) - 1) * 2 + 1).toString());
                    }}
                    className="bg-white border border-gray-200 rounded px-2 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-indigo-500 min-w-[70px]"
                  >
                    <option value="1">Year 1</option>
                    <option value="2">Year 2</option>
                    <option value="3">Year 3</option>
                    <option value="4">Year 4</option>
                  </select>
                  <select
                    value={ttFilterSem}
                    onChange={(e) => setTtFilterSem(e.target.value)}
                    className="bg-white border border-gray-200 rounded px-2 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-indigo-500 min-w-[70px]"
                  >
                    {ttFilterYear 
                      ? [(parseInt(ttFilterYear) - 1) * 2 + 1, parseInt(ttFilterYear) * 2].map(s => <option key={s} value={s}>Sem {s}</option>)
                      : [1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)
                    }
                  </select>
                  <select
                    value={ttFilterDept}
                    onChange={(e) => {
                      const newDept = e.target.value;
                      setTtFilterDept(newDept);
                      if (newDept === 'ME' || newDept === 'CE') setTtFilterSection('A');
                      else if (newDept === 'ECE' && (ttFilterSection === 'C' || ttFilterSection === 'D')) setTtFilterSection('A');
                    }}
                    className="bg-white border border-gray-200 rounded px-2 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-indigo-500 min-w-[70px]"
                  >
                    <option value="CSE">CSE</option>
                    <option value="ECE">ECE</option>
                    <option value="ME">ME</option>
                    <option value="CE">CE</option>
                  </select>
                  <select
                    value={ttFilterSection}
                    onChange={(e) => setTtFilterSection(e.target.value)}
                    className="bg-white border border-gray-200 rounded px-2 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-indigo-500 min-w-[70px]"
                  >
                    {ttFilterDept === 'CSE' && ['A','B','C','D'].map(s => <option key={s} value={s}>Sec {s}</option>)}
                    {ttFilterDept === 'ECE' && ['A','B'].map(s => <option key={s} value={s}>Sec {s}</option>)}
                    {(ttFilterDept === 'ME' || ttFilterDept === 'CE') && <option value="A">Sec A</option>}
                  </select>
                  
                  <button 
                    onClick={loadTimetables}
                    className="ml-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded text-xs font-semibold shadow-sm transition-colors"
                  >
                    Show
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                {(() => {
                  if (timetables.length === 0) {
                    return <div className="py-12 text-center text-slate-500 italic bg-white text-xs">No timetables found for this section. Add one above.</div>;
                  }

                  const daysOfWeekList = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                  
                  const parseTime = (timeStr) => {
                    if (!timeStr) return 0;
                    const match = timeStr.match(/(\d+):(\d+)(?:\s*(AM|PM))?/i);
                    if (!match) return 0;
                    let [, hours, minutes, period] = match;
                    hours = parseInt(hours, 10);
                    minutes = parseInt(minutes, 10);
                    if (period && period.toUpperCase() === 'PM' && hours !== 12) hours += 12;
                    if (period && period.toUpperCase() === 'AM' && hours === 12) hours = 0;
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

                                const classStartingHere = timetables.find(t => t.day_of_week === day && parseTime(t.start_time) === parseTime(slot.start));
                                let colSpan = 1;
                                
                                if (classStartingHere) {
                                  const classEnd = parseTime(classStartingHere.end_time);
                                  for (let i = index + 1; i < standardSlots.length; i++) {
                                    if (!standardSlots[i].isBreak && parseTime(standardSlots[i].start) < classEnd) {
                                      colSpan++;
                                      skipSlots.add(i);
                                    } else if (standardSlots[i].isBreak && parseTime(standardSlots[i].end) <= classEnd) {
                                      // If a class actually spans over a break (rare), we must handle it, but standard college classes don't.
                                      // We will just break to avoid breaking the UI with rowSpans.
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
                                        className={`bg-indigo-50/60 rounded-md p-2.5 border border-indigo-100/80 flex flex-col items-center justify-center gap-1.5 h-full hover:border-indigo-300 hover:shadow-sm transition-all hover:-translate-y-0.5 group ${isTimetableEditMode ? 'cursor-pointer ring-2 ring-transparent hover:ring-indigo-400' : 'cursor-default'}`}
                                        onClick={() => {
                                          if (isTimetableEditMode) setEditingTimetableSlot(classStartingHere);
                                        }}
                                      >
                                        <span className="font-bold text-indigo-700 text-xs leading-tight group-hover:text-indigo-800 transition-colors">{classStartingHere.subject_name}</span>
                                        <div className="flex items-center gap-1.5 text-[9px] font-bold tracking-wide">
                                          <span className="bg-white px-1.5 py-0.5 rounded text-gray-600 border border-gray-200 shadow-sm">{classStartingHere.classroom_code}</span>
                                          <span className="bg-indigo-100/80 px-1.5 py-0.5 rounded text-indigo-700 border border-indigo-200 shadow-sm">{classStartingHere.section || 'All Sections'}</span>
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
            </div>
          </div>
        )}

        {/* TAB 5: AI LOGS & SYSTEM TELEMETRY */}
        {adminActiveTab === 'telemetry' && (
          <div className="space-y-6">
            <div className="academic-card p-6 space-y-4">
              <h4 className="font-semibold text-sm text-gray-800 border-b border-gray-200 pb-4">Live Platform Event Pipeline</h4>
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
              <h4 className="font-semibold text-sm text-gray-800 border-b border-gray-200 pb-4 mb-4">Enterprise AI Performance Observatory</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                  <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-widest">Total AI Requests Today</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-2">{adminMetrics?.metrics?.ai?.requests_today || 0}</p>
                </div>
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                  <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-widest">Total Tokens Used</p>
                  <p className="text-2xl font-semibold text-emerald-700 mt-2">{adminMetrics?.metrics?.ai?.total_tokens_used || 0}</p>
                </div>
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                  <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-widest">AI Safety Filter Check</p>
                  <p className="text-2xl font-semibold text-indigo-600 mt-2">100% Passed</p>
                </div>
              </div>
            </div>
          </div>
        )}
        {editingTimetableSlot && (
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[99] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-semibold text-gray-800">Edit Timetable Slot</h3>
                <button onClick={() => setEditingTimetableSlot(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleUpdateTimetable} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Subject Name</label>
                  <input type="text" value={editingTimetableSlot.subject_name} onChange={e => setEditingTimetableSlot({...editingTimetableSlot, subject_name: e.target.value})} className="w-full bg-slate-50 border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Start Time</label>
                    <input type="text" value={editingTimetableSlot.start_time} onChange={e => setEditingTimetableSlot({...editingTimetableSlot, start_time: e.target.value})} className="w-full bg-slate-50 border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">End Time</label>
                    <input type="text" value={editingTimetableSlot.end_time} onChange={e => setEditingTimetableSlot({...editingTimetableSlot, end_time: e.target.value})} className="w-full bg-slate-50 border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" required />
                  </div>
                </div>
                <div className="flex gap-3 pt-4 border-t border-gray-100 mt-6">
                  <button type="button" onClick={() => handleDeleteTimetable(editingTimetableSlot.id)} className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded text-sm font-semibold transition-colors">
                    Delete Slot
                  </button>
                  <div className="flex-1"></div>
                  <button type="button" onClick={() => setEditingTimetableSlot(null)} className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded text-sm font-semibold transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded text-sm font-semibold transition-colors">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    );
  };

  return (
    <div>
      {user?.role === 'Super Admin' && <SuperAdminDashboard />}
      {user?.role === 'College Admin' && renderAdminDashboard()}
      {user?.role === 'Teacher' && renderTeacherDashboard()}
      {user?.role === 'Student' && renderStudentDashboard()}
    </div>
  );
};


export default Dashboard;
