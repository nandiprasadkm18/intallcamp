import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, 
  Clock, 
  Activity, 
  Terminal, 
  BarChart4,
  Loader2
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

const AIAnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState({
    overview: { total_queries: 0, avg_latency: 0, total_tokens: 0 },
    performance_chart: [],
    models_chart: []
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/tenant/analytics/ai`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to load analytics");
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded border border-red-200 font-semibold">
        {error}
      </div>
    );
  }

  const { overview, performance_chart, models_chart } = data;
  
  // Determine most active model
  let activeModel = "No Active Models";
  if (models_chart && models_chart.length > 0) {
    const sorted = [...models_chart].sort((a, b) => b.value - a.value);
    if (sorted[0].value > 0) {
        activeModel = sorted[0].name;
    }
  }

  return (
    <div className="space-y-8">
      {/* Overview stats panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="academic-card p-6 bg-white/40 border border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs uppercase font-extrabold tracking-wider text-gray-600">Active AI Model</p>
              <h3 className="text-xl font-bold text-gray-900 mt-2">{activeModel}</h3>
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
              <h3 className="text-xl font-bold text-gray-900 mt-2">{overview.avg_latency} ms</h3>
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
              <h3 className="text-xl font-bold text-gray-900 mt-2">{overview.total_tokens} Tokens</h3>
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
              <h3 className="text-xl font-bold text-gray-900 mt-2">{overview.total_queries} Items</h3>
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
              <LineChart data={performance_chart}>
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
              <BarChart data={models_chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }} />
                <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
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

        <div className="overflow-x-auto mt-4 p-4 text-sm text-gray-500 bg-gray-50 rounded-lg text-center">
          Telemetry execution log list moved to deep observability tab. Chart aggregates are live!
        </div>
      </div>
    </div>
  );
};

export default AIAnalyticsPage;
