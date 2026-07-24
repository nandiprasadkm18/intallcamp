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
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  
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
  const [whisperMetrics, setWhisperMetrics] = useState({ latency_ms: 0, confidence: 1.0 });
  const [activeStudentsList, setActiveStudentsList] = useState([]);

  const ws = useRef(null);


  // Load classroom history when joined
  const fetchClassroomDetails = async (code) => {
    try {
      // 1. Fetch main info
      const resMain = await fetch(`http://127.0.0.1:8000/api/classrooms/${code}`);
      if (!resMain.ok) throw new Error("Classroom room not found");
      const mainInfo = await resMain.json();

      // Restrict students from joining offline/non-live classrooms
      if (user?.role === 'student' && !mainInfo.is_live) {
        throw new Error("Classroom session is currently offline. Please wait for your instructor to launch the classroom session.");
      }

      setActiveClassroom(mainInfo);

      // 2. Fetch transcript log
      const resTrans = await fetch(`http://127.0.0.1:8000/api/classrooms/${code}/transcripts`);
      if (resTrans.ok) {
        const transData = await resTrans.json();
        setTranscripts(transData);
      }

      // 3. Fetch doubt board log
      const resDoubts = await fetch(`http://127.0.0.1:8000/api/classrooms/${code}/doubts`);
      if (resDoubts.ok) {
        const doubtsData = await resDoubts.json();
        setDoubts(doubtsData);
      }

      // 4. Fetch subject resources
      const resRes = await fetch(`http://127.0.0.1:8000/api/classrooms/${code}/resources`);
      if (resRes.ok) {
        const resourcesData = await resRes.json();
        setResources(resourcesData);
      }
      
      // 5. Fetch Attendance
      const resAtt = await fetch(`http://127.0.0.1:8000/api/classrooms/${code}/attendance`);
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

    const socketUrl = `ws://127.0.0.1:8000/ws/classroom/${roomCode.toUpperCase()}?user_name=${encodeURIComponent(user?.name || "Anonymous")}&user_id=${encodeURIComponent(user?.id || "")}`;
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
      } else if (msg.type === "transcript_segment") {
        setTranscripts(prev => [...prev, {
          id: Date.now(),
          text: msg.text,
          timestamp: msg.timestamp
        }]);
        setWhisperMetrics({
          latency_ms: msg.latency_ms,
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
  };

  // Actions broadcasted to server over WebSocket
  const startLiveClassroomSession = async (code, isLive) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/classrooms/${code}/live`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ is_live: isLive }),
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
        type: "code_change",
        code: newCode,
        language: lang,
        sender: user?.name
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
        student_name: user?.name
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

  const uploadResource = async (title, fileType, fileSize, classroomCode = null) => {
    const targetCode = classroomCode || activeClassroom?.code;
    if (!targetCode) return;
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/classrooms/${targetCode}/resources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ title, file_type: fileType, file_size: fileSize }),
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

  const downloadResource = async (id) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/resources/${id}/download`, {
        method: 'POST'
      });
      if (response.ok) {
        setResources(prev => prev.map(r => r.id === id ? { ...r, downloads: r.downloads + 1 } : r));
      }
    } catch (error) {
      console.error("Error tracking download:", error);
    }
  };

  const simulateAttendance = async () => {
    if (!activeClassroom) return;
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/classrooms/${activeClassroom.code}/attendance/simulate`, {
        method: 'POST'
      });
      if (response.ok) {
        const resAtt = await fetch(`http://127.0.0.1:8000/api/classrooms/${activeClassroom.code}/attendance`);
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
      simulateAttendance
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
