'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { TrendingUp, Users, CalendarCheck, Award, ArrowLeft, BarChart3, PieChart } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { api, adminApi, apiCall } from '@/lib/api-config'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart as RechartsPieChart,
  Pie
} from 'recharts'

type EventData = {
  id: number
  title: string
  date: string
  status: string
  participants: any[]
  registration_count?: number
  attended_count?: number
}

export default function AdminInsights() {
  const router = useRouter()
  const [events, setEvents] = useState<EventData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await apiCall.get(adminApi.events())
        if (res.ok) {
          const data = await res.json()
          let eventList = []
          if (Array.isArray(data)) eventList = data
          else if (data.results) eventList = data.results
          else if (data.data) eventList = data.data

          setEvents(eventList)
        }
      } catch (err) {
        console.error("Failed to fetch events for insights", err)
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [])

  // Derived Metrics
  const totalEvents = events.length
  const totalParticipants = events.reduce((sum, e) => sum + (e.registration_count || 0), 0)
  const totalAttended = events.reduce((sum, e) => sum + (e.attended_count || 0), 0)
  const attendanceRate = totalParticipants > 0 ? Math.round((totalAttended / totalParticipants) * 100) : 0

  // Chart Data Preparation
  const participantsOverTime = useMemo(() => {
    const sorted = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    return sorted.map(e => ({
      name: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      participants: e.registration_count || 0,
      attended: e.attended_count || 0
    })).slice(-10)
  }, [events])

  // ... (topEvents and statusDistribution logic remains mostly similar but using registration_count)
  const topEvents = useMemo(() => {
    return [...events]
      .sort((a, b) => (b.registration_count || 0) - (a.registration_count || 0))
      .slice(0, 5)
      .map(e => ({
        name: e.title.length > 20 ? e.title.substring(0, 20) + '...' : e.title,
        participants: e.registration_count || 0
      }))
  }, [events])

  const statusDistribution = useMemo(() => {
    // ... existing logic ...
    const counts = { Upcoming: 0, Completed: 0, Cancelled: 0 }
    events.forEach(e => {
      const s = (e.status || '').toLowerCase()
      if (s === 'completed' || s === 'concluded') counts.Completed++
      else if (s === 'cancelled') counts.Cancelled++
      else counts.Upcoming++
    })
    return [
      { name: 'Upcoming', value: counts.Upcoming, color: '#10b981' }, // Green
      { name: 'Completed', value: counts.Completed, color: '#059669' }, // Darker Green
      { name: 'Cancelled', value: counts.Cancelled, color: '#737373' }  // Neutral
    ].filter(item => item.value > 0)
  }, [events])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-neutral-900 p-3 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-lg">
          <p className="font-semibold text-neutral-900 dark:text-white mb-1">{label}</p>
          {payload.map((p: any, idx: number) => (
            <p key={idx} className="text-sm" style={{ color: p.color }}>
              {p.name}: <span className="font-bold">{p.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-neutral-50/50 dark:bg-neutral-950 p-6 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors text-neutral-500"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">Insights</h1>
          </div>
          <p className="text-neutral-500 dark:text-neutral-400 ml-12">Real-time analytics and performance metrics.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Total Events</p>
              <p className="text-3xl font-bold text-neutral-900 dark:text-white mt-1">{totalEvents}</p>
            </div>
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Total Participants</p>
              <p className="text-3xl font-bold text-neutral-900 dark:text-white mt-1">{totalParticipants}</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Attendance Rate</p>
              <p className="text-3xl font-bold text-neutral-900 dark:text-white mt-1">{attendanceRate}%</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
              <CalendarCheck className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Avg. Per Event</p>
              <p className="text-3xl font-bold text-neutral-900 dark:text-white mt-1">
                {totalEvents > 0 ? Math.round(totalParticipants / totalEvents) : 0}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
              <Award className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Participation Growth */}
        <Card className="p-6 border border-neutral-200 dark:border-neutral-800 bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-900 dark:to-neutral-950 shadow-2xl col-span-1 lg:col-span-2 relative overflow-hidden">
          {/* Background Grid */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 dark:hidden" style={{
              backgroundImage: 'linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }} />
            <div className="absolute inset-0 hidden dark:block" style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }} />
          </div>

          <div className="flex items-center justify-between mb-6 relative z-10">
            <div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Participation Trends
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Registrations vs Attendance over last 10 events</p>
            </div>
          </div>
          <div className="h-[300px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={participantsOverTime}>
                <defs>
                  <linearGradient id="colorRegistered" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="50%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorAttended" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                    <stop offset="50%" stopColor="#059669" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#d4d4d4" className="dark:stroke-neutral-700" opacity={0.3} />
                <XAxis
                  dataKey="name"
                  stroke="#737373"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: '#d4d4d4', strokeWidth: 1 }}
                  className="dark:stroke-neutral-500"
                />
                <YAxis
                  stroke="#737373"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: '#d4d4d4', strokeWidth: 1 }}
                  className="dark:stroke-neutral-500"
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="participants"
                  name="Registered"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorRegistered)"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
                  activeDot={{ r: 7, strokeWidth: 2, stroke: '#10b981', fill: '#fff' }}
                />
                <Area
                  type="monotone"
                  dataKey="attended"
                  name="Attended"
                  stroke="#059669"
                  fillOpacity={1}
                  fill="url(#colorAttended)"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#059669', strokeWidth: 0 }}
                  activeDot={{ r: 7, strokeWidth: 2, stroke: '#059669', fill: '#fff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Top Events */}
        <Card className="p-6 border border-neutral-200 dark:border-neutral-800 bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-900 dark:to-neutral-950 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 dark:hidden" style={{
              backgroundImage: 'linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }} />
            <div className="absolute inset-0 hidden dark:block" style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }} />
          </div>

          <div className="flex items-center justify-between mb-6 relative z-10">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              Top Events
            </h3>
          </div>
          <div className="h-[300px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topEvents} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="5 5" horizontal={true} vertical={false} stroke="#d4d4d4" className="dark:stroke-neutral-700" opacity={0.3} />
                <XAxis
                  type="number"
                  stroke="#737373"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: '#d4d4d4', strokeWidth: 1 }}
                  className="dark:stroke-neutral-500"
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#737373"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: '#d4d4d4', strokeWidth: 1 }}
                  width={100}
                  className="dark:stroke-neutral-500"
                />
                <Tooltip cursor={{ fill: 'rgba(16, 185, 129, 0.1)' }} content={<CustomTooltip />} />
                <Bar dataKey="participants" name="Participants" radius={[0, 8, 8, 0]}>
                  {topEvents.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={'#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Status Distribution */}
        <Card className="p-6 border border-neutral-200 dark:border-neutral-800 bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-900 dark:to-neutral-950 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 dark:hidden" style={{
              backgroundImage: 'linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }} />
            <div className="absolute inset-0 hidden dark:block" style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }} />
          </div>

          <div className="flex items-center justify-between mb-6 relative z-10">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <PieChart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              Event Status
            </h3>
          </div>
          <div className="h-[300px] w-full flex justify-center relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  strokeWidth={2}
                  stroke="#fff"
                  className="dark:stroke-neutral-900"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-4 relative z-10">
            {statusDistribution.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">{item.name}</span>
              </div>
            ))}
          </div>
        </Card>

      </div>
    </div>
  )
}
