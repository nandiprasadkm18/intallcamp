/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';

const ClassroomContext = createContext(null);

export const ClassroomProvider = ({ children }) => {
  const { user } = useAuth();
  const [activeClassroom, setActiveClassroom] = useState(null);
  const [transcripts, setTranscripts] = useState([]);
  const [doubts, setDoubts] = useState([]);
  const [resources, setResources] = useState([]);
  const [attendance, setAttendance] = useState([]);
  
  // Real-time Collaborative Code States
  const [code, setCode] = useState("// Loading code workspace...");
  const [language, setLanguage] = useState("plain_text");
  
  // Real-time Observability Logs
  const [sentiment, setSentiment] = useState({
    engagement: 85.0,
    focus_level: 90.0,
    sentiment: { positive: 75.0, neutral: 15.0, negative: 10.0 },
    active_students: 45
  });
  const [aiLogs, setAiLogs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isWhisperRunning, setIsWhisperRunning] = useState(false);
  const [whisperMetrics, setWhisperMetrics] = useState({ latency: 0, confidence: 100 });
  const [activeStudentsList, setActiveStudentsList] = useState([]);
  const mediaRecorderRef = useRef(null);

  const ws = useRef(null);


  // Load classroom history when joined
  const fetchClassroomDetails = async (code) => {
    try {
      // 1. Fetch main info
      const resMain = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/academic/classrooms`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!resMain.ok) throw new Error("Classroom room not found");
      const mainInfoList = await resMain.json();
      const mainInfo = mainInfoList.find(c => c.code.toLowerCase() === code.toLowerCase()) || { code, is_live: true, name: "Live Session" };

      // Allow students to join and wait for instructor to go live

      setActiveClassroom(mainInfo);

      // 2. Fetch transcript log
      const resTrans = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/academic/classrooms/${code}/records`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (resTrans.ok) {
        const transData = await resTrans.json();
        setTranscripts(transData);
      }

      // 3. Fetch doubt board log
      const resDoubts = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/academic/classrooms/${code}/doubts`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (resDoubts.ok) {
        const doubtsData = await resDoubts.json();
        setDoubts(doubtsData);
      }

      // 4. Fetch subject resources
      const resRes = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/academic/classrooms/${code}/resources`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (resRes.ok) {
        const resourcesData = await resRes.json();
        setResources(resourcesData);
      }
      
      // 5. Fetch Attendance
      const resAtt = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/academic/classrooms/${code}/attendance`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (resAtt.ok) {
        const attData = await resAtt.json();
        setAttendance(attData);
      }
    } catch (err) {
      console.error("Error fetching classroom history:", err);
      throw err;
    }
  };

  const connectWebSocket = (roomCode) => {
    if (ws.current) {
      ws.current.close();
    }

    const socketUrl = `${import.meta.env.VITE_WS_URL}/ws/classroom/${roomCode.toUpperCase()}?user_name=${encodeURIComponent(user?.full_name || "Anonymous")}&user_id=${encodeURIComponent(user?.id || "")}`;
    const socket = new WebSocket(socketUrl);
    ws.current = socket;

    socket.onopen = () => {
      console.log(`WebSocket Connected to room: ${roomCode}`);
    };

    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      
      if (msg.type === "code_sync") {
        setCode(msg.code);
        setLanguage(msg.language);
      } else if (msg.type === "doubt_added") {
        setDoubts(prev => [msg.doubt, ...prev]);
        if (msg.observability) {
          setAiLogs(prev => [msg.observability, ...prev]);
        }
      } else if (msg.type === "doubt_answered") {
        setDoubts(prev => prev.map(d => d.id === msg.doubt_id ? { ...d, ai_answer: msg.ai_answer } : d));
      } else if (msg.type === "transcript_segment") {
        setTranscripts(prev => [...prev, {
          id: Date.now(),
          text: msg.text,
          timestamp: msg.timestamp
        }]);
        setWhisperMetrics({
          latency: msg.latency_ms,
          confidence: msg.confidence
        });
      } else if (msg.type === "sentiment_sync") {
        setSentiment(msg.data);
      } else if (msg.type === "connections_update") {
        setActiveStudentsList(msg.active_students || []);
        setSentiment(prev => ({
          ...prev,
          active_students: msg.count || 0
        }));
      } else if (msg.type === "alert") {
        setAlerts(prev => [{
          id: Date.now(),
          title: msg.title,
          message: msg.message,
          sender: msg.sender
        }, ...prev]);
      }
    };

    socket.onclose = () => {
      console.log("WebSocket Disconnected");
    };
  };


  const joinClassroom = async (code) => {
    await fetchClassroomDetails(code);
    connectWebSocket(code);
  };

  const leaveClassroom = () => {
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    setActiveClassroom(null);
    setTranscripts([]);
    setDoubts([]);
    setCode("");
    setAlerts([]);
    setIsWhisperRunning(false);
    setActiveStudentsList([]);
    stopAudioStream();
  };

  const audioIntervalRef = useRef(null);

  const startAudioStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const recordChunk = () => {
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0 && ws.current && ws.current.readyState === WebSocket.OPEN) {
            const reader = new FileReader();
            reader.readAsDataURL(event.data);
            reader.onloadend = () => {
              const base64Audio = reader.result;
              ws.current.send(JSON.stringify({
                type: "audio_chunk",
                audio: base64Audio
              }));
            };
          }
        };

        mediaRecorder.start();
        setTimeout(() => {
          if (mediaRecorder.state !== "inactive") {
            mediaRecorder.stop();
          }
        }, 2000);
      };

      recordChunk();
      audioIntervalRef.current = setInterval(recordChunk, 2000);
      setIsWhisperRunning(true);
    } catch (err) {
      console.error("Error accessing microphone", err);
      setIsWhisperRunning(false);
    }
  };

  const stopAudioStream = () => {
    if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    setIsWhisperRunning(false);
  };

  // Actions broadcasted to server over WebSocket
  const startLiveClassroomSession = async (code, isLive, storeRecord = false, year = null, semester = null, section = null) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/academic/classrooms/${code}/live`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          is_live: isLive,
          store_record: storeRecord,
          year: year ? parseInt(year) : null,
          semester: semester ? parseInt(semester) : null,
          section: section || null
        }),
      });
      if (response.ok) {
        setActiveClassroom(prev => prev ? { ...prev, is_live: isLive } : null);
      }
    } catch (error) {
      console.error("Error setting session state:", error);
    }
  };

  const broadcastCodeChange = (newCode, lang = "javascript") => {
    setCode(newCode);
    setLanguage(lang);
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: "code_sync",
        code: newCode,
        language: lang,
        sender: user?.full_name
      }));
    }
  };

  const askAnonymousDoubt = (question, isAnon = false) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: "ask_doubt",
        question: question,
        is_anonymous: isAnon,
        student_id: user?.id,
        student_name: user?.full_name
      }));
    }
  };

  const triggerLiveTranscriptLine = (subject = "CS101") => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: "request_transcript_step",
        subject: subject
      }));
    }
  };

  const triggerSentimentUpdate = () => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: "request_sentiment_update"
      }));
    }
  };

  const broadcastAlert = (title, message) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: "classroom_alert",
        title: title,
        message: message,
        sender: user?.name || "Instructor"
      }));
    }
  };

  const fetchGlobalResources = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/academic/classrooms/GLOBAL/resources`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setResources(data);
      }
    } catch (error) {
      console.error("Error fetching global resources:", error);
    }
  };

  const uploadResource = async (title, file, targetFilters = {}, classroomCode = null) => {
    const targetCode = classroomCode || activeClassroom?.code;
    if (!targetCode || !file) return;
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("file", file);
      
      if (targetFilters.year) formData.append("target_year", targetFilters.year);
      if (targetFilters.department && targetFilters.department !== "All") formData.append("target_department", targetFilters.department);
      if (targetFilters.semester) formData.append("target_semester", targetFilters.semester);
      if (targetFilters.className && targetFilters.className !== "All") formData.append("target_class", targetFilters.className);
      if (targetFilters.section && targetFilters.section !== "All Sections" && targetFilters.section !== "All") {
        formData.append("target_section", targetFilters.section);
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/academic/classrooms/${targetCode}/resources`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData,
      });
      if (response.ok) {
        const newRes = await response.json();
        setResources(prev => [newRes, ...prev]);
        return newRes;
      }
    } catch (error) {
      console.error("Error uploading resource:", error);
    }
  };

  const downloadResource = async (id, title, fileType) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/academic/classrooms/${id}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title}.${fileType.toLowerCase()}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        
        // Track download count (optimistic update since backend doesn't track it currently in download)
        setResources(prev => prev.map(r => r.id === id ? { ...r, downloads: r.downloads + 1 } : r));
      } else {
        console.error("Failed to download resource");
      }
    } catch (error) {
      console.error("Error downloading resource:", error);
    }
  };

  const deleteResource = async (id) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/academic/classrooms/resources/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        setResources(prev => prev.filter(r => r.id !== id));
      } else {
        console.error("Failed to delete resource");
      }
    } catch (error) {
      console.error("Error deleting resource:", error);
    }
  };

  const simulateAttendance = async () => {
    if (!activeClassroom) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/academic/classrooms/${activeClassroom.code}/attendance/simulate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const resAtt = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/academic/classrooms/${activeClassroom.code}/attendance`);
        if (resAtt.ok) {
          const attData = await resAtt.json();
          setAttendance(attData);
        }
      }
    } catch (error) {
      console.error("Error simulating attendance:", error);
    }
  };

  // Helper trigger to poll sentiment metrics automatically during live mode
  useEffect(() => {
    let interval = null;
    if (activeClassroom?.is_live && user?.role === 'teacher') {
      interval = setInterval(() => {
        triggerSentimentUpdate();
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeClassroom?.is_live, user]);

  return (
    <ClassroomContext.Provider value={{
      activeClassroom,
      transcripts,
      doubts,
      resources,
      attendance,
      code,
      language,
      sentiment,
      aiLogs,
      alerts,
      isWhisperRunning,
      whisperMetrics,
      activeStudentsList,
      setIsWhisperRunning,
      joinClassroom,
      leaveClassroom,
      startLiveClassroomSession,
      broadcastCodeChange,
      askAnonymousDoubt,
      triggerLiveTranscriptLine,
      broadcastAlert,
      uploadResource,
      downloadResource,
      deleteResource,
      fetchGlobalResources,
      simulateAttendance,
      startAudioStream,
      stopAudioStream
    }}>
      {children}
    </ClassroomContext.Provider>

  );
};

export const useClassroom = () => {
  const context = useContext(ClassroomContext);
  if (!context) {
    throw new Error('useClassroom must be used within a ClassroomProvider');
  }
  return context;
};
