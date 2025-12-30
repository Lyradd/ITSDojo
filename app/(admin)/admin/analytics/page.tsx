"use client";

import { useState, useEffect } from 'react';
import { useUserStore } from '@/lib/store';
import { MOCK_STUDENTS, MOCK_ANALYTICS } from '@/lib/admin-data';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  TrendingUp,
  Users,
  Target,
  Award
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export default function AnalyticsPage() {
  const { role } = useUserStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  if (!isMounted) return null;

  // Top performers
  const topPerformers = [...MOCK_STUDENTS]
    .sort((a, b) => b.xp - a.xp)
    .slice(0, 5);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="w-8 h-8 text-green-600" />
          <h1 className="text-3xl font-bold text-zinc-800 dark:text-zinc-100">
            Analytics & Reports
          </h1>
        </div>
        <p className="text-zinc-600 dark:text-zinc-400">
          Insight dan statistik performa mahasiswa
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-6 rounded-2xl border-2">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Total Students
            </span>
          </div>
          <div className="text-3xl font-bold text-zinc-800 dark:text-zinc-100">
            {MOCK_ANALYTICS.totalStudents}
          </div>
        </Card>

        <Card className="p-6 rounded-2xl border-2">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Avg Score
            </span>
          </div>
          <div className="text-3xl font-bold text-zinc-800 dark:text-zinc-100">
            {MOCK_ANALYTICS.averageScore}%
          </div>
        </Card>

        <Card className="p-6 rounded-2xl border-2">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Completion Rate
            </span>
          </div>
          <div className="text-3xl font-bold text-zinc-800 dark:text-zinc-100">
            {MOCK_ANALYTICS.completionRate}%
          </div>
        </Card>

        <Card className="p-6 rounded-2xl border-2">
          <div className="flex items-center gap-3 mb-2">
            <Award className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Active Today
            </span>
          </div>
          <div className="text-3xl font-bold text-zinc-800 dark:text-zinc-100">
            {MOCK_ANALYTICS.activeToday}
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Activity Trend */}
        <Card className="p-6 rounded-2xl border-2">
          <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 mb-4">
            Activity Trend (7 Days)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={MOCK_ANALYTICS.activityTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="students" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Active Students"
              />
              <Line 
                type="monotone" 
                dataKey="evaluations" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                name="Evaluations"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Score Distribution */}
        <Card className="p-6 rounded-2xl border-2">
          <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 mb-4">
            Score Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={MOCK_ANALYTICS.scoreDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="range" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px'
                }}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Course Popularity */}
        <Card className="p-6 rounded-2xl border-2">
          <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 mb-4">
            Course Popularity
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={MOCK_ANALYTICS.coursePopularity} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" stroke="#6b7280" />
              <YAxis dataKey="course" type="category" stroke="#6b7280" width={120} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px'
                }}
              />
              <Bar dataKey="students" fill="#8b5cf6" radius={[0, 8, 8, 0]} name="Students" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Top Performers */}
        <Card className="p-6 rounded-2xl border-2">
          <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 mb-4">
            Top 5 Performers
          </h3>
          <div className="space-y-3">
            {topPerformers.map((student, index) => (
              <div 
                key={student.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900"
              >
                <div className="text-lg font-bold text-zinc-400 w-6">
                  #{index + 1}
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${student.avatar}`}>
                  {student.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-zinc-800 dark:text-zinc-100 truncate">
                    {student.name}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    {student.accuracy}% accuracy
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm text-blue-600">
                    {student.xp} XP
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    Level {student.level}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Export Actions */}
      <Card className="p-6 rounded-2xl border-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 mb-1">
              Export Reports
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Download data untuk analisis lebih lanjut
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="font-bold">
              Export CSV
            </Button>
            <Button variant="outline" className="font-bold">
              Export PDF
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
