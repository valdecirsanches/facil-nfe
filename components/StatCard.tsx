import React from 'react';
import { Card } from './ui/Card';
import { BoxIcon } from 'lucide-react';
interface StatCardProps {
  title: string;
  value: string;
  icon: BoxIcon;
  trend?: string;
  trendUp?: boolean;
}
export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendUp
}: StatCardProps) {
  return <Card className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {trend && <p className={`text-sm mt-2 ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
              {trend}
            </p>}
        </div>
        <div className="p-3 bg-green-100 rounded-lg">
          <Icon size={24} className="text-green-600" />
        </div>
      </div>
    </Card>;
}