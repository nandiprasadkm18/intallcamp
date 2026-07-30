import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Video, Play, FileText, Search, Clock, Download } from 'lucide-react';

const RecordsPage = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    // In a real app, we would fetch the list of classrooms, then their records
    // For this demo, we'll fetch the records of the first class directly
    const loadRecords = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/v1/academic/classrooms/C1/records', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
          const data = await response.json();
          // Group transcripts by a mocked "session" or just list them
          setRecords([{
            id: 1,
            title: "Live Classroom Session - C1",
            date: new Date().toLocaleDateString(),
            duration: "1h 15m",
            transcripts: data
          }]);
        }
      } catch (err) {
        console.error("Failed to load records", err);
      } finally {
        setLoading(false);
      }
    };
    loadRecords();
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-6 w-6 text-indigo-600" /> 
            Classroom Transcripts
          </h2>
          <p className="text-gray-500 text-sm mt-1">Review past live AI lecture transcripts.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">Available Transcripts</h3>
          {loading ? (
            <div className="text-sm text-gray-500 text-center p-8 bg-gray-50 rounded-xl">Loading transcripts...</div>
          ) : records.length === 0 ? (
            <div className="text-sm text-gray-500 text-center p-8 bg-gray-50 rounded-xl">No transcripts found.</div>
          ) : (
            records.map(record => (
              <button 
                key={record.id}
                onClick={() => setSelectedRecord(record)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${selectedRecord?.id === record.id ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-gray-200 hover:border-indigo-300'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-gray-800 text-sm">{record.title}</h4>
                  <span className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg"><FileText className="h-4 w-4" /></span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {record.duration}</span>
                  <span>•</span>
                  <span>{record.date}</span>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="md:col-span-2">
          {selectedRecord ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-gray-800">{selectedRecord.title} - Transcript</h3>
                <button className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors">
                  <Download className="h-4 w-4" /> Download PDF
                </button>
              </div>
              <div className="flex-1 p-6 overflow-y-auto space-y-6">
                {selectedRecord.transcripts.length === 0 ? (
                  <div className="text-center text-gray-500 italic py-12">No transcript data recorded for this session.</div>
                ) : (
                  selectedRecord.transcripts.map((t, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="w-12 text-xs font-bold text-gray-400 shrink-0 text-right mt-1">
                        {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-bold text-indigo-600 mb-1">{t.speaker_name || "Instructor"}</div>
                        <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg rounded-tl-none border border-gray-100 leading-relaxed">
                          {t.text}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 h-[600px] flex flex-col items-center justify-center text-gray-500">
              <FileText className="h-12 w-12 text-gray-400 mb-4" />
              <p className="font-medium text-sm">Select a session from the left to view its transcript</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecordsPage;
