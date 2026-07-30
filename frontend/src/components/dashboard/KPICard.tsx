import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export const KPICard: React.FC<KPICardProps> = ({ title, value, subtitle, icon: Icon, trend }) => {
  return (
    <div className="bg-white border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{title}</p>
          <h3 className="text-3xl font-semibold text-gray-900 mt-2">{value}</h3>
          
          <div className="flex items-center mt-3">
            {trend && (
              <span className={`text-xs font-bold mr-2 ${trend.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </span>
            )}
            {subtitle && <span className="text-xs text-gray-500 font-medium">{subtitle}</span>}
          </div>
        </div>
        <div className="p-3 bg-gray-50 border border-gray-100 text-gray-700">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};
