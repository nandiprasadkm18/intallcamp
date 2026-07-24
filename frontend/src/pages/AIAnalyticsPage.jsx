import React from 'react';
import { useClassroom } from '../contexts/ClassroomContext';
import { 
  BrainCircuit, 
  Clock, 
  Activity, 
  Terminal, 
  FileCode, 
  Database,
  BarChart4
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

const mockPerformanceData = [
  { name: 'Q1', latency: 320, tokens: 120 },
  { name: 'Q2', latency: 450, tokens: 180 },
  { name: 'Q3', latency: 280, tokens: 90 },
  { name: 'Q4', latency: 620, tokens: 280 },
  { name: 'Q5', latency: 390, tokens: 140 },
  { name: 'Q6', latency: 410, tokens: 190 },
  { name: 'Q7', latency: 340, tokens: 130 }
];

const AIAnalyticsPage = () => {
  const { aiLogs } = useClassroom();

  const totalQueries = aiLogs.length > 0 ? aiLogs.length : 7;
  const averageLatency = aiLogs.length > 0 
    ? Math.round(aiLogs.reduce((acc, log) => acc + log.latency_ms, 0) / aiLogs.length) 
    : 400;

  const totalTokens = aiLogs.length > 0
    ? aiLogs.reduce((acc, log) => acc + log.prompt_tokens + log.completion_tokens, 0)
    : 1050;

  return (
    <div className="space-y-8">
      {/* Overview stats panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="academic-card p-6 bg-white/40 border border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs uppercase font-extrabold tracking-wider text-gray-600">Active AI Model</p>
              <h3 className="text-xl font-bold text-gray-900 mt-2">Llama-3-Academic</h3>
            </div>
            <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-lg">
              <BrainCircuit className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="academic-card p-6 bg-white/40 border border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs uppercase font-extrabold tracking-wider text-gray-600">Avg Latency Time</p>
              <h3 className="text-xl font-bold text-gray-900 mt-2">{averageLatency} ms</h3>
            </div>
            <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-lg">
              <Clock className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="academic-card p-6 bg-white/40 border border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs uppercase font-extrabold tracking-wider text-gray-600">Tokens Utilized</p>
              <h3 className="text-xl font-bold text-gray-900 mt-2">{totalTokens} Tokens</h3>
            </div>
            <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-lg">
              <Activity className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="academic-card p-6 bg-white/40 border border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs uppercase font-extrabold tracking-wider text-gray-600">Doubt Log Queries</p>
              <h3 className="text-xl font-bold text-gray-900 mt-2">{totalQueries} Items</h3>
            </div>
            <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-lg">
              <BarChart4 className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Graphs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Latency Speed Graph */}
        <div className="academic-card p-6">
          <h4 className="font-bold text-base text-gray-800 border-b border-gray-200 pb-4 mb-5">LLM Latency Log Index</h4>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft', fill: '#64748b' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }} />
                <Line type="monotone" dataKey="latency" stroke="#4f46e5" strokeWidth={3} dot={{ fill: '#4f46e5', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tokens utilization chart */}
        <div className="academic-card p-6">
          <h4 className="font-bold text-base text-gray-800 border-b border-gray-200 pb-4 mb-5">Context Token Balances</h4>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }} />
                <Bar dataKey="tokens" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Response telemetry logs */}
      <div className="academic-card p-6">
        <h4 className="font-bold text-base text-gray-800 border-b border-gray-200 pb-4 mb-5 flex items-center space-x-2">
          <Terminal className="h-5 w-5 text-indigo-500" />
          <span>Telemetry Execution Log</span>
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 uppercase tracking-widest font-bold">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">LLM Framework</th>
                <th className="py-3 px-4">Prompt Tokens</th>
                <th className="py-3 px-4">Completion Tokens</th>
                <th className="py-3 px-4">Response Speed</th>
                <th className="py-3 px-4 text-right">API Code Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-gray-700">
              {aiLogs.length === 0 ? (
                // Mock execution log when no doubts asked yet
                [
                  { time: '2026-05-28 19:54:10', model: 'Llama-3-Academic-70B', pT: 42, cT: 78, speed: '340ms' },
                  { time: '2026-05-28 19:52:12', model: 'Llama-3-Academic-70B', pT: 35, cT: 62, speed: '280ms' }
                ].map((item, idx) => (
                  <tr key={idx} className="hover:bg-white/35 transition-colors">
                    <td className="py-3.5 px-4 font-mono">{item.time}</td>
                    <td className="py-3.5 px-4 font-semibold text-gray-800">{item.model}</td>
                    <td className="py-3.5 px-4">{item.pT}</td>
                    <td className="py-3.5 px-4">{item.cT}</td>
                    <td className="py-3.5 px-4 font-semibold text-indigo-600">{item.speed}</td>
                    <td className="py-3.5 px-4 text-right text-emerald-700 font-bold">HTTP 200 OK</td>
                  </tr>
                ))
              ) : (
                aiLogs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-white/35 transition-colors">
                    <td className="py-3.5 px-4 font-mono">{log.timestamp}</td>
                    <td className="py-3.5 px-4 font-semibold text-gray-800">{log.model}</td>
                    <td className="py-3.5 px-4">{log.prompt_tokens}</td>
                    <td className="py-3.5 px-4">{log.completion_tokens}</td>
                    <td className="py-3.5 px-4 font-semibold text-indigo-600">{log.latency_ms}ms</td>
                    <td className="py-3.5 px-4 text-right text-emerald-700 font-bold">HTTP 200 OK</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AIAnalyticsPage;
