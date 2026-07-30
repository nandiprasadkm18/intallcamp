import React, { useEffect, useState } from 'react';
import { 
  Building2, Users, HardDrive, Brain, DollarSign, Activity, 
  Settings, Bell, Search, MoreVertical 
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { platformService, PlatformKPIs, Activity as ActivityType } from '../services/platformService';
import { analyticsService } from '../services/analyticsService';
import { KPICard } from '../components/dashboard/KPICard';

const SuperAdminDashboard: React.FC = () => {
  const [kpis, setKpis] = useState<PlatformKPIs | null>(null);
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [growthData, setGrowthData] = useState<any[]>([]);
  const [subData, setSubData] = useState<any[]>([]);
  const [storageData, setStorageData] = useState<any[]>([]);
  const [healthData, setHealthData] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const [k, a, g, s, st, h] = await Promise.all([
        platformService.getKPIs(),
        platformService.getRecentActivities(),
        analyticsService.getPlatformGrowth(),
        analyticsService.getSubscriptionDistribution(),
        analyticsService.getStorageUsage(),
        analyticsService.getSystemHealth()
      ]);
      setKpis(k);
      setActivities(a);
      setGrowthData(g);
      setSubData(s);
      setStorageData(st);
      setHealthData(h);
    };
    loadData();
  }, []);

  if (!kpis) return (
    <div className="flex justify-center items-center h-full">
      <div className="h-8 w-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-fade-in font-sans">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-gray-500 mt-1 text-sm">Real-time metrics for INTELLCAMP infrastructure.</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-4">
          <button className="flex items-center text-sm font-medium text-gray-700 bg-white border border-gray-300 px-4 py-2 hover:bg-gray-50 transition-colors">
            Last 30 Days
          </button>
          <button className="flex items-center text-sm font-medium text-white bg-black px-4 py-2 hover:bg-gray-800 transition-colors">
            Generate Report
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <KPICard title="Total Colleges" value={kpis.totalColleges} icon={Building2} />
        <KPICard title="Active Students" value={kpis.totalStudents.toLocaleString()} icon={Users} />
        <KPICard title="AI Requests Today" value={kpis.aiRequestsToday.toLocaleString()} icon={Brain} />
        <KPICard title="Monthly Revenue" value={`$${kpis.monthlyRevenue.toLocaleString()}`} icon={DollarSign} />
        <KPICard title="Storage Used" value={`${kpis.storageUsedTB} TB`} subtitle={`of ${kpis.storageTotalTB} TB limit`} icon={HardDrive} />
        <KPICard title="Platform Uptime" value={`${kpis.platformUptime}%`} icon={Activity} />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        
        {/* Main Growth Chart */}
        <div className="lg:col-span-2 bg-white border border-gray-200 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-6 uppercase tracking-wider">Platform Growth</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dx={-10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#111827', color: '#f9fafb', borderRadius: '4px', fontSize: '12px' }}
                  itemStyle={{ color: '#f9fafb' }}
                />
                <Line type="monotone" dataKey="colleges" stroke="#000000" strokeWidth={3} dot={{r: 4, fill: '#000000', strokeWidth: 0}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subscription Distribution */}
        <div className="bg-white border border-gray-200 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-6 uppercase tracking-wider">Subscriptions</h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={subData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                  {subData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 space-y-3">
            {subData.map((item, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: item.color}}></span>
                  <span className="text-gray-600 font-medium">{item.name}</span>
                </div>
                <span className="font-bold text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Storage, Health, Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Storage Usage Bar Chart */}
        <div className="bg-white border border-gray-200 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-6 uppercase tracking-wider">Top Storage Usage</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={storageData} layout="vertical" margin={{top: 0, right: 0, left: 0, bottom: 0}}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#4b5563', fontSize: 12, fontWeight: 600}} width={60} />
                <Tooltip cursor={{fill: '#f3f4f6'}} />
                <Bar dataKey="storage" fill="#000000" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white border border-gray-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">System Health</h3>
            <button className="text-xs text-blue-600 font-bold hover:underline">View All</button>
          </div>
          <div className="space-y-4">
            {healthData.map((item, i) => (
              <div key={i} className="flex justify-between items-center p-3 border border-gray-100 bg-gray-50/50">
                <span className="text-sm font-medium text-gray-700">{item.service}</span>
                <span className={`inline-flex items-center text-xs font-bold uppercase tracking-wider ${item.color}`}>
                  <span className={`h-2 w-2 rounded-full mr-2 ${item.status === 'Healthy' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white border border-gray-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Recent Activity</h3>
            <button className="text-gray-400 hover:text-gray-900"><MoreVertical className="h-5 w-5" /></button>
          </div>
          <div className="relative border-l border-gray-200 ml-3 space-y-6">
            {activities.map((act) => (
              <div key={act.id} className="relative pl-6">
                <span className={`absolute -left-1.5 top-1 h-3 w-3 rounded-full border-2 border-white ${
                  act.type === 'success' ? 'bg-emerald-500' : act.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                }`}></span>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{act.message}</p>
                    <p className="text-xs font-medium text-gray-500 mt-0.5">{act.college}</p>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400">{act.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default SuperAdminDashboard;
