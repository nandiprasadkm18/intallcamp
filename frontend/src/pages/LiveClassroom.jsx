import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useClassroom } from '../contexts/ClassroomContext';
import { 
  Tv, 
  Code2, 
  HelpCircle, 
  Send, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Maximize2,
  ChevronDown,
  UserCheck,
  BrainCircuit,
  MessageSquare,
  AlertTriangle,
  Play,
  Square,
  RefreshCw,
  BellRing
} from 'lucide-react';

const LiveClassroom = ({ setCurrentPage }) => {
  const { user } = useAuth();
  const {
    activeClassroom,
    transcripts,
    doubts,
    code,
    language,
    alerts,
    isWhisperRunning,
    whisperMetrics,
    activeStudentsList,
    setIsWhisperRunning,
    leaveClassroom,
    broadcastCodeChange,
    askAnonymousDoubt,
    triggerLiveTranscriptLine,
    broadcastAlert,
    sentiment
  } = useClassroom();


  const [activeTab, setActiveTab] = useState('transcript'); // transcript, code, doubts
  const [doubtText, setDoubtText] = useState("");
  const [isAnon, setIsAnon] = useState(false);
  
  // Custom Chat bot state
  const [chatQuestion, setChatQuestion] = useState("");
  const [chatResponses, setChatResponses] = useState([
    { role: 'assistant', text: "Greetings. I am your AI Classroom Assistant. I can generate summaries or analyze details from the live lecture. Ask me anything!" }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  // Administrative Announcements form
  const [announceTitle, setAnnounceTitle] = useState("");
  const [announceBody, setAnnounceBody] = useState("");
  
  // Code editor local state
  const [localCode, setLocalCode] = useState(code);
  const [selectedLang, setSelectedLang] = useState(language);

  const transcriptsEndRef = useRef(null);

  // Sync incoming code changes from socket into local editor state
  useEffect(() => {
    setLocalCode(code);
  }, [code]);

  useEffect(() => {
    setSelectedLang(language);
  }, [language]);

  // Keep scrollbar pinned to bottom of transcript log during live streams
  useEffect(() => {
    if (transcriptsEndRef.current) {
      transcriptsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcripts]);

  // Simulated Speech transcribing tick when Whisper is set live
  useEffect(() => {
    let timer = null;
    if (isWhisperRunning && user?.role === 'teacher') {
      timer = setInterval(() => {
        triggerLiveTranscriptLine(activeClassroom?.code === 'AI502' ? 'AI502' : 'CS101');
      }, 5500);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isWhisperRunning, user]);

  const handleAskDoubt = (e) => {
    e.preventDefault();
    if (!doubtText) return;
    askAnonymousDoubt(doubtText, isAnon);
    setDoubtText("");
  };

  const handleChatQuestion = async (e) => {
    e.preventDefault();
    if (!chatQuestion) return;
    
    const userMsg = { role: 'user', text: chatQuestion };
    setChatResponses(prev => [...prev, userMsg]);
    setChatQuestion("");
    setChatLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/classrooms/doubts', {
        // We will call the AI service directly from backend simulated API
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question: userMsg.text })
      });
      // Just simulate latency directly
      setTimeout(() => {
        let answer = "Based on the live transcripts, the instructor is focusing on structural paradigms. Under high loads, this eliminates performance blockages and ensures higher redundancy.";
        if (userMsg.text.toLowerCase().includes("saga")) {
          answer = "The Saga Pattern implements distributed transactions via a sequence of local transactions. Each updates the DB and publishes events to trigger next steps. If one step fails, backward compensating events execute.";
        } else if (userMsg.text.toLowerCase().includes("attention") || userMsg.text.toLowerCase().includes("transformer")) {
          answer = "Self-attention computes token relationship scores by taking QK^T, scaling it by the square root of key dimensions, applying Softmax, and multiplying the result by the Value matrix.";
        }
        
        setChatResponses(prev => [...prev, { role: 'assistant', text: answer }]);
        setChatLoading(false);
      }, 800);

    } catch (err) {
      setChatLoading(false);
    }
  };

  const handleSendAnnouncement = (e) => {
    e.preventDefault();
    if (!announceTitle || !announceBody) return;
    broadcastAlert(announceTitle, announceBody);
    setAnnounceTitle("");
    setAnnounceBody("");
  };

  const handleCodeChange = (e) => {
    const newCode = e.target.value;
    setLocalCode(newCode);
    broadcastCodeChange(newCode, selectedLang);
  };

  const handleLangChange = (e) => {
    const lang = e.target.value;
    setSelectedLang(lang);
    broadcastCodeChange(localCode, lang);
  };

  const triggerSelfExplainConcept = () => {
    if (transcripts.length === 0) return;
    const lastLine = transcripts[transcripts.length - 1].text;
    setChatQuestion(`Explain this statement from the transcript: "${lastLine}"`);
  };

  if (!activeClassroom) {
    return (
      <div className="p-8 text-center bg-white/40 border border-gray-200 rounded-xl max-w-2xl mx-auto">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-800">No active lecture room connected</h3>
        <p className="text-gray-500 text-xs mt-2">
          Please return to the dashboard and join or start a classroom session first.
        </p>
        <button
          onClick={() => setCurrentPage('dashboard')}
          className="mt-6 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 text-xs font-bold rounded shadow-sm transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Upper header controls */}
      <div className="p-4 rounded-xl bg-white/50 border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${isWhisperRunning ? 'bg-red-50 text-red-650 border border-red-200' : 'bg-white border border-gray-200 text-gray-500'}`}>
            <Volume2 className={`h-5 w-5 ${isWhisperRunning ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-gray-800 text-sm">{activeClassroom.name}</span>
              <span className="px-2 py-0.5 rounded bg-white border border-gray-200 text-[10px] font-bold text-indigo-600 tracking-wider">
                {activeClassroom.code}
              </span>
            </div>
            <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mt-0.5">
              Live Session Pipeline State
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {isTeacher ? (
            <button
              onClick={() => setIsWhisperRunning(!isWhisperRunning)}
              className={`px-4 py-2 rounded text-xs font-bold flex items-center space-x-1.5 transition-all ${
                isWhisperRunning 
                  ? 'bg-red-50 hover:bg-red-500/20 border border-red-500/30 text-red-650' 
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-glow-emerald'
              }`}
            >
              {isWhisperRunning ? (
                <>
                  <Square className="h-3 w-3 fill-red-400" />
                  <span>Stop Speech API</span>
                </>
              ) : (
                <>
                  <Play className="h-3 w-3 fill-white" />
                  <span>Start Live Whisper</span>
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center space-x-2.5 px-3.5 py-2 rounded bg-white border border-gray-200 text-xs">
              <span className={`h-2 w-2 rounded-full ${isWhisperRunning ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`}></span>
              <span className="font-semibold text-gray-600">
                {isWhisperRunning ? "Whisper Active (Streams Live)" : "Speech Input Offline"}
              </span>
            </div>
          )}

          <button
            onClick={() => { leaveClassroom(); setCurrentPage('dashboard'); }}
            className="px-4 py-2 rounded bg-white hover:bg-white border border-gray-200 hover:border-gray-200 text-xs font-bold text-gray-700 transition-colors"
          >
            Leave Room
          </button>
        </div>
      </div>

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Area (Live feed/Editor/Doubts tabs) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Module navigation tabs */}
          <div className="flex border-b border-gray-200 pb-2">
            {[
              { id: 'transcript', name: 'Live Speech Whisper', icon: Tv },
              { id: 'code', name: 'Collaborative Code Workspace', icon: Code2 },
              { id: 'doubts', name: 'Ghost Doubt Board', icon: HelpCircle }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 border-b-2 font-bold text-xs uppercase tracking-wider transition-all ${
                    isActive 
                      ? 'border-indigo-500 text-indigo-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>

          {/* TAB CONTENT 1: TRANSCRIPT */}
          {activeTab === 'transcript' && (
            <div className="academic-card p-6 min-h-[420px] flex flex-col justify-between">
              {/* Telemetry metadata */}
              <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                <span>Whisper Audio Stream</span>
                {isWhisperRunning && (
                  <div className="flex space-x-4">
                    <span>Latency: <span className="text-gray-700 font-semibold">{whisperMetrics.latency_ms}ms</span></span>
                    <span>Confidence: <span className="text-emerald-700 font-semibold">{(whisperMetrics.confidence * 100).toFixed(1)}%</span></span>
                  </div>
                )}
              </div>

              {/* Log wrapper */}
              <div className="flex-1 overflow-y-auto max-h-[300px] space-y-4 pr-2 select-text">
                {transcripts.length === 0 ? (
                  <div className="h-full flex flex-col justify-center items-center text-center py-20 text-slate-600">
                    <VolumeX className="h-10 w-10 text-slate-700 mb-2" />
                    <p className="text-xs font-semibold">No lecture segments recorded yet.</p>
                    <p className="text-[10px] text-gray-400 mt-1">Start speech input to record transcript</p>
                  </div>
                ) : (
                  transcripts.map((line, idx) => (
                    <div key={line.id || idx} className="p-3 bg-gray-50 rounded border border-gray-200 text-xs flex gap-3.5 transition-colors hover:border-gray-200">
                      <span className="text-[10px] text-gray-500 font-mono font-bold tracking-wider pt-0.5 select-none">{line.timestamp}</span>
                      <p className="text-gray-800 leading-relaxed font-sans">{line.text}</p>
                    </div>
                  ))
                )}
                <div ref={transcriptsEndRef} />
              </div>

              {/* Explainer trigger */}
              {transcripts.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-200 flex justify-end">
                  <button
                    onClick={triggerSelfExplainConcept}
                    className="px-3 py-1.5 rounded bg-indigo-50 hover:bg-gray-800/20 border border-indigo-200 text-indigo-600 font-bold text-[10px] uppercase tracking-wider flex items-center space-x-1.5 transition-colors"
                  >
                    <BrainCircuit className="h-3.5 w-3.5" />
                    <span>Explain Last Statement</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT 2: COLLABORATIVE EDITOR */}
          {activeTab === 'code' && (
            <div className="academic-card p-6 min-h-[420px] flex flex-col justify-between">
              {/* Header selection controls */}
              <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-4">
                <div className="flex items-center space-x-2">
                  <Code2 className="h-4 w-4 text-indigo-500" />
                  <span className="text-xs font-bold text-gray-700">Synchronized Workspace</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <select
                    value={selectedLang}
                    onChange={handleLangChange}
                    disabled={!isTeacher}
                    className="bg-white border border-gray-200 rounded text-gray-600 font-bold text-[10px] px-2.5 py-1 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="cpp">C++</option>
                  </select>
                  {!isTeacher && (
                    <span className="px-2 py-0.5 rounded bg-white border border-gray-200 text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                      Read-Only View
                    </span>
                  )}
                </div>
              </div>

              {/* Editor Workspace Input */}
              <textarea
                value={localCode}
                onChange={handleCodeChange}
                disabled={!isTeacher}
                className="w-full flex-1 min-h-[260px] max-h-[300px] font-mono text-xs text-gray-700 bg-white p-4 rounded-lg border border-gray-200 focus:outline-none focus:border-indigo-500/80 resize-none leading-relaxed select-text"
                placeholder={isTeacher ? "// Type collaborative lecture code snippet here..." : "// Awaiting instructor's code broadcast..."}
              />

              <div className="text-[10px] text-gray-500 font-semibold mt-3">
                {isTeacher 
                  ? "✓ Active broadcast mode enabled. Your changes sync instantly to all classrooms." 
                  : "✓ Integrated listener active. Syncing changes from instructor."
                }
              </div>
            </div>
          )}

          {/* TAB CONTENT 3: GHOST DOUBTS */}
          {activeTab === 'doubts' && (
            <div className="academic-card p-6 min-h-[420px] flex flex-col justify-between">
              {/* Header and submission fields */}
              <div>
                <h4 className="font-bold text-base text-gray-800 border-b border-gray-200 pb-3.5 mb-5 flex items-center justify-between">
                  <span>Doubt Query Board</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-indigo-600 border border-gray-200">
                    {doubts.length} Submissions
                  </span>
                </h4>

                {/* Submissions form (for students) */}
                {!isTeacher && (
                  <form onSubmit={handleAskDoubt} className="p-4 bg-white rounded-lg border border-gray-200 space-y-3 mb-6">
                    <p className="text-[10px] uppercase font-extrabold tracking-widest text-gray-500">Pose Doubt Ticket</p>
                    <textarea
                      required
                      value={doubtText}
                      onChange={(e) => setDoubtText(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded p-2.5 text-xs text-gray-800 focus:outline-none focus:border-indigo-500 resize-none h-16"
                      placeholder="e.g. Can you explain why the scaling coefficient is necessary in self-attention?"
                    />
                    <div className="flex items-center justify-between">
                      <label className="flex items-center space-x-2 text-xs font-semibold text-gray-600 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isAnon}
                          onChange={(e) => setIsAnon(e.target.checked)}
                          className="rounded bg-white border-gray-200 text-indigo-600 focus:ring-0 cursor-pointer"
                        />
                        <span>Ask anonymously (Ghost doubt)</span>
                      </label>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 text-xs font-bold transition-all shadow-sm flex items-center space-x-1"
                      >
                        <span>Send Doubtnut</span>
                        <Send className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </form>
                )}

                {/* Log Doubts lists */}
                <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
                  {doubts.length === 0 ? (
                    <p className="text-center text-xs text-gray-500 py-10 font-semibold">No questions submitted yet.</p>
                  ) : (
                    doubts.map((doubt) => (
                      <div key={doubt.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide border ${
                            doubt.is_anonymous 
                              ? 'bg-purple-500/10 border-purple-500/25 text-purple-400' 
                              : 'bg-indigo-50 border-indigo-500/25 text-indigo-600'
                          }`}>
                            {doubt.is_anonymous ? 'Ghost Query' : 'Public query'}
                          </span>
                          <span className="text-[10px] text-gray-500 font-bold">{doubt.student_name}</span>
                        </div>
                        <p className="text-gray-800 text-xs font-semibold">{doubt.question}</p>
                        
                        {doubt.ai_answer && (
                          <div className="p-3 bg-white/80 rounded border border-gray-200 flex gap-2.5">
                            <Sparkles className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-[10px] uppercase font-bold tracking-widest text-indigo-600">Suggested AI Answer</p>
                              <p className="text-gray-600 text-xs mt-1 leading-relaxed">{doubt.ai_answer}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Area (AI Chat & Alerts dashboard panels) */}
        <div className="space-y-6">
          {/* Real-time metrics overview (Academic theme) */}
          <div className="academic-card p-5">
            <h4 className="font-bold text-xs uppercase text-gray-600 tracking-wider mb-4 border-b border-gray-200 pb-2">Lecture telemetry</h4>
            <div className="space-y-3.5 text-xs font-semibold">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Student Focus Index</span>
                <span className="text-indigo-600 font-bold">{sentiment?.focus_level || 90.0}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Class Participation</span>
                <span className="text-gray-800 font-bold">{sentiment?.engagement || 85.0}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Active Students</span>
                <span className="text-gray-800 font-bold">{sentiment?.active_students || 0} Connected</span>
              </div>
            </div>
          </div>

          {/* Active Joined Students List */}
          <div className="academic-card p-5">
            <h4 className="font-bold text-xs uppercase text-gray-600 tracking-wider mb-3 border-b border-gray-200 pb-2">
              Joined Students ({activeStudentsList.length})
            </h4>
            <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
              {activeStudentsList.length === 0 ? (
                <p className="text-[10px] text-gray-500 font-semibold italic">No students active in room.</p>
              ) : (
                activeStudentsList.map((st, idx) => (
                  <div key={idx} className="flex items-center space-x-2 py-1 border-b border-gray-200 last:border-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                    <span className="text-[11px] text-gray-700 font-bold">{st.user_name}</span>
                  </div>
                ))
              )}
            </div>
          </div>


          {/* Live Chat / AI Assistant */}
          <div className="academic-card p-5 min-h-[290px] flex flex-col justify-between">
            <h4 className="font-bold text-sm text-gray-800 border-b border-gray-200 pb-3.5 mb-3.5 flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <span>AI Classroom Explainer</span>
            </h4>

            {/* Responses Wrapper */}
            <div className="flex-1 max-h-[160px] overflow-y-auto space-y-3.5 pr-1.5 mb-3">
              {chatResponses.map((msg, idx) => (
                <div key={idx} className={`p-2.5 rounded text-xs leading-relaxed ${
                  msg.role === 'assistant' 
                    ? 'bg-black/5 border border-gray-200/40 text-gray-700' 
                    : 'bg-white border border-gray-200 text-gray-800 font-semibold'
                }`}>
                  <span className="block text-[9px] uppercase font-bold tracking-widest text-gray-500 mb-1">
                    {msg.role === 'assistant' ? 'AI Bot' : 'You'}
                  </span>
                  {msg.text}
                </div>
              ))}
              {chatLoading && (
                <div className="p-2 bg-gray-100/50 border border-gray-200 text-xs rounded text-gray-500 italic flex items-center space-x-2">
                  <RefreshCw className="h-3 w-3 animate-spin text-indigo-600" />
                  <span>AI Agent drafting explanation...</span>
                </div>
              )}
            </div>

            {/* Question Input Form */}
            <form onSubmit={handleChatQuestion} className="flex gap-2">
              <input
                type="text"
                value={chatQuestion}
                onChange={(e) => setChatQuestion(e.target.value)}
                className="flex-1 bg-white border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                placeholder="Ask doubt about concepts..."
              />
              <button
                type="submit"
                className="p-1.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 rounded transition-colors shadow-sm"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* Notifications Board */}
          <div className="academic-card p-5">
            <h4 className="font-bold text-sm text-gray-800 border-b border-gray-200 pb-3.5 mb-3.5 flex items-center space-x-2">
              <BellRing className="h-4 w-4 text-indigo-600" />
              <span>Announcements Board</span>
            </h4>

            {isTeacher && (
              <form onSubmit={handleSendAnnouncement} className="p-3 bg-white border border-gray-200 rounded space-y-2 mb-4">
                <input
                  type="text"
                  required
                  value={announceTitle}
                  onChange={(e) => setAnnounceTitle(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded px-2.5 py-1 text-[11px] text-gray-800 focus:outline-none focus:border-indigo-500 font-bold"
                  placeholder="Alert Title"
                />
                <textarea
                  required
                  value={announceBody}
                  onChange={(e) => setAnnounceBody(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded px-2.5 py-1 text-[11px] text-gray-800 focus:outline-none focus:border-indigo-500 resize-none h-12"
                  placeholder="Announcement description..."
                />
                <button
                  type="submit"
                  className="w-full py-1.5 rounded bg-black/10 hover:bg-black/25 border border-indigo-200 text-indigo-600 text-[10px] font-bold uppercase transition-colors"
                >
                  Broadcast Alert
                </button>
              </form>
            )}

            <div className="space-y-3.5 max-h-[140px] overflow-y-auto pr-1">
              {alerts.length === 0 ? (
                <p className="text-center text-[10px] text-slate-600 py-6 font-semibold">No alerts broadcasted.</p>
              ) : (
                alerts.map((al) => (
                  <div key={al.id} className="p-2.5 bg-gray-50/80 rounded border border-gray-200 text-xs">
                    <p className="font-bold text-gray-800">{al.title}</p>
                    <p className="text-gray-600 mt-1 leading-relaxed">{al.message}</p>
                    <span className="block text-[9px] text-gray-500 font-bold mt-1">From: {al.sender}</span>
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

export default LiveClassroom;
