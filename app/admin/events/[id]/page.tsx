'use client'

import { useRouter, useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Calendar, Clock, ArrowLeft, Ticket, Users, Info, Edit, Trash2, Power, BarChart, Landmark, AlertCircle, Shield } from 'lucide-react'
import { getEventById, Event } from '@/lib/event-context'
import { api, apiCall, adminApi } from '@/lib/api-config'

// Define the precise color palette from user request
const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string; gradient: string }> = {
  'STE': { bg: 'bg-blue-600', text: 'text-blue-100', border: 'border-blue-400', gradient: 'from-blue-600 to-blue-900' },
  'CET': { bg: 'bg-orange-600', text: 'text-orange-100', border: 'border-orange-400', gradient: 'from-orange-600 to-orange-900' },
  'SBME': { bg: 'bg-yellow-500', text: 'text-yellow-50', border: 'border-yellow-400', gradient: 'from-yellow-500 to-yellow-800' },
  'CHATME': { bg: 'bg-zinc-600', text: 'text-zinc-100', border: 'border-zinc-400', gradient: 'from-zinc-600 to-zinc-900' },
  'HUSOCOM': { bg: 'bg-[#831843]', text: 'text-pink-100', border: 'border-pink-500', gradient: 'from-[#831843] to-[#500724]' },
  'COME': { bg: 'bg-sky-600', text: 'text-sky-100', border: 'border-sky-400', gradient: 'from-sky-600 to-sky-900' },
  'CCJE': { bg: 'bg-red-600', text: 'text-red-100', border: 'border-red-400', gradient: 'from-red-600 to-red-900' },
  'HCDC': { bg: 'bg-gradient-to-r from-blue-700 to-red-600', text: 'text-white', border: 'border-blue-600', gradient: 'from-blue-900 via-blue-800 to-red-900' },
}

const DEPARTMENT_ABBR = {
  'College of Criminal Justice Education': 'CCJE',
  'College of Engineering and Technology': 'CET',
  'College of Hospitality & Tourism Management': 'CHATME',
  'College of Humanities, Social Sciences and Communication': 'HUSOCOM',
  'College of Maritime Education': 'COME',
  'School of Business & Management': 'SBME',
  'School of Teacher Education': 'STE',
}

const getDepartmentAbbr = (fullName: string): string | null => {
  if (!fullName) return null
  if (Object.values(DEPARTMENT_ABBR).includes(fullName as any)) {
    return fullName
  }
  return DEPARTMENT_ABBR[fullName as keyof typeof DEPARTMENT_ABBR] || null
}

const getCategoryFromEvent = (event: Event): string => {
  if (event.category === 'HCDC') return 'HCDC'
  const deptAbbr = getDepartmentAbbr(event.department || '')
  return deptAbbr || 'HCDC'
}

export default function AdminEventDetailPage() {
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false)
  const [showConcludeConfirm, setShowConcludeConfirm] = useState<boolean>(false)

  // Countdown Logic - Moved up to fix Rules of Hooks
  const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number } | null>(null)

  useEffect(() => {
    if (!event) return

    const calculateTimeLeft = () => {
      try {
        const eventDateStr = new Date(event.date).toLocaleDateString('en-US')
        let timeStr = event.startTime || event.start_time || '00:00'
        timeStr = timeStr.replace(/([AP]M)/i, ' $1').trim()

        const startDateTimeStr = `${eventDateStr} ${timeStr}`
        const targetDate = new Date(startDateTimeStr).getTime()
        const now = new Date().getTime()
        const difference = targetDate - now

        if (isNaN(targetDate)) return null

        if (difference > 0) {
          return {
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60),
          }
        }
      } catch (e) { console.error(e) }
      return null
    }

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    setTimeLeft(calculateTimeLeft()) // Initial call

    return () => clearInterval(timer)
  }, [event])

  const router = useRouter()
  const params = useParams()

  useEffect(() => {
    const eventId = params.id as string

    async function fetchEvent() {
      setLoading(true)
      try {
        const eventUrl = adminApi.eventById(eventId)
        const response = await apiCall.get(eventUrl)

        if (response.ok) {
          const apiEvent = await response.json()
          setEvent(apiEvent as Event)
        } else {
          // Fallback to local
          const localEvent = getEventById(eventId)
          if (localEvent) {
            setEvent(localEvent)
          }
        }
      } catch (error) {
        console.error('Error fetching event details:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvent()
  }, [params.id])

  const handleDelete = async () => {
    if (!event) return
    try {
      await apiCall.delete(adminApi.eventById(event.id))
      router.push('/admin/events')
    } catch {
      alert('Failed to delete event')
    }
  }

  const handleConclude = async () => {
    if (!event) return
    // Assuming a status update endpoint or patch
    try {
      // Mock implementation for now as specific conclude endpoint might not be exposed yet
      alert('Event marked as concluded (mock).')
      setShowConcludeConfirm(false)
      router.refresh()
    } catch {
      alert('Failed to conclude event')
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white">Loading event experience...</div>
  if (!event) return <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white">Event not found</div>

  const eventCategory = getCategoryFromEvent(event)
  const colors = CATEGORY_COLORS[eventCategory] || CATEGORY_COLORS['HCDC']
  const isConcluded = event.status?.toLowerCase() === 'completed' || event.status?.toLowerCase() === 'concluded'

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">

      {/* 1. IMMERSIVE HERO SECTION */}
      <div className="relative w-full h-[60vh] md:h-[75vh] overflow-hidden">
        {/* Dynamic Background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-90 transition-all duration-1000`} />
        {event.coverImage || event.cover_image && (
          <img
            src={event.coverImage || event.cover_image}
            alt={event.name}
            className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-50"
          />
        )}

        {/* Texture Overlay */}
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20 mix-blend-soft-light" />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end pb-12 md:pb-20 px-6 md:px-12 max-w-[1700px] mx-auto">

          {/* Top Nav Placeholder */}
          <div className="absolute top-8 left-6 md:left-12">
            <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 backdrop-blur-md rounded-full px-6" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5 mr-2" /> Back to Dashboard
            </Button>
          </div>

          <div className="w-full flex flex-col md:flex-row items-end justify-between gap-12">
            <div className="flex-1 space-y-6 animate-in slide-in-from-bottom-10 duration-700">

              {/* Category Pill */}
              <div className="flex items-center gap-3">
                <Badge className={`${colors.bg} text-white hover:${colors.bg} border-none px-4 py-1.5 text-sm uppercase tracking-widest font-bold shadow-lg shadow-black/20`}>
                  {eventCategory}
                </Badge>
                {isConcluded && (
                  <Badge className="bg-neutral-800 text-white border-none px-4 py-1.5 font-bold uppercase tracking-wider">
                    Concluded
                  </Badge>
                )}
                <Badge variant="outline" className={`${event.isPublic ? 'border-green-400 text-green-400' : 'border-amber-400 text-amber-400'} px-3 py-1.5 uppercase tracking-wide text-xs font-bold bg-black/20 backdrop-blur-md`}>
                  {event.isPublic ? 'Public Event' : 'Private'}
                </Badge>
              </div>

              {/* Massive Title */}
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter leading-[0.9] drop-shadow-2xl max-w-5xl">
                {event.name || event.title}
              </h1>

              {/* Meta Data Row */}
              <div className="flex flex-wrap items-center gap-6 text-white/80 font-medium text-lg pt-4">
                <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
                  <Calendar className="w-5 h-5 text-white" />
                  <span>{new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                </div>
                <div className="hidden md:block w-px h-8 bg-white/20" />
                <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
                  <Clock className="w-5 h-5 text-white" />
                  <span>{event.startTime || event.start_time} - {event.endTime || event.end_time}</span>
                </div>
                <div className="hidden md:block w-px h-8 bg-white/20" />
                <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
                  <MapPin className="w-5 h-5 text-white" />
                  <span>{event.venue || event.location}</span>
                </div>
              </div>
            </div>

            {/* Live Countdown Circle */}
            {timeLeft && (
              <div className="hidden lg:flex items-center justify-center relative w-40 h-40 rounded-full border border-white/20 bg-black/20 backdrop-blur-xl animate-in fade-in zoom-in duration-1000 delay-300">
                <div className="text-center">
                  <div className="text-3xl font-black text-white">{timeLeft.days}</div>
                  <div className="text-[10px] uppercase tracking-widest text-white/60 font-bold mb-1">Days Left</div>
                  <div className="text-xs text-white/80 font-mono">{timeLeft.hours}h {timeLeft.minutes}m</div>
                </div>
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle cx="80" cy="80" r="78" stroke="white" strokeWidth="1" fill="none" className="opacity-10" />
                  <circle cx="80" cy="80" r="78" stroke="white" strokeWidth="2" fill="none" strokeDasharray="490" strokeDashoffset="100" className="opacity-30" />
                </svg>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. BENTO LAYOUT CONTENT */}
      <div className="max-w-[1700px] mx-auto px-6 md:px-12 -mt-24 relative z-10 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* MAIN CONTENT (Left 8) */}
          <div className="lg:col-span-8 flex flex-col gap-8">

            {/* About Card */}
            <Card className="p-8 md:p-10 border-none shadow-2xl bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-xl rounded-[2.5rem]">
              <div className="flex items-center gap-4 mb-6">
                <div className={`p-3 rounded-2xl ${colors.bg} bg-opacity-10`}>
                  <Info className={`w-8 h-8 ${colors.text.replace('100', '600')}`} />
                </div>
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 to-neutral-500 dark:from-white dark:to-neutral-500">
                  Event Description
                </h2>
              </div>
              <div className="prose dark:prose-invert prose-lg max-w-none text-neutral-600 dark:text-neutral-300 leading-relaxed">
                <p className="whitespace-pre-wrap">{event.description}</p>
              </div>
            </Card>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Speakers Tile */}
              <Card className="p-6 border-none shadow-xl bg-neutral-100 dark:bg-neutral-900 rounded-[2rem] overflow-hidden relative hover:shadow-2xl transition-all duration-300">
                <div className="absolute top-0 right-0 p-32 bg-gradient-to-br from-transparent to-black/5 dark:to-white/5 rounded-bl-full" />
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-6 flex items-center gap-2">
                  <Users className="w-5 h-5 text-neutral-500" /> Key Speakers
                </h3>
                {event.speakers ? (
                  <div className="flex flex-col gap-3">
                    {(Array.isArray(event.speakers) ? event.speakers : String(event.speakers).split(',')).map((s: string, i: number) => (
                      <div key={i} className="flex items-center gap-4 p-3 bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-700">
                        <div className={`w-10 h-10 rounded-full ${colors.bg} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                          {s.trim().charAt(0)}
                        </div>
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200">{s.trim()}</span>
                      </div>
                    ))}
                  </div>
                ) : <div className="text-neutral-500 italic">No speakers announced.</div>}
              </Card>

              <div className="flex flex-col gap-6">
                {/* Visual Venue Tile */}
                <Card className="flex-1 p-6 border-none shadow-xl bg-neutral-900 dark:bg-black rounded-[2rem] text-white relative overflow-hidden group">
                  <img
                    src={event.coverImage || "/placeholder-venue.jpg"}
                    className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700"
                    alt="Venue"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                  <div className="relative z-10 h-full flex flex-col justify-end">
                    <p className="text-neutral-400 text-xs uppercase tracking-widest font-bold mb-1">Venue</p>
                    <p className="text-2xl font-bold">{event.venue || event.location}</p>
                  </div>
                </Card>

                {/* Participation Tile */}
                <Card className="p-6 border-none shadow-xl bg-white dark:bg-neutral-900 rounded-[2rem] flex items-center justify-between">
                  <div>
                    <p className="text-neutral-500 text-xs uppercase tracking-widest font-bold mb-1">Total Registrations</p>
                    <p className="text-4xl font-black text-neutral-900 dark:text-white tracking-tighter">
                      {event.registration_count || 0}<span className="text-lg text-neutral-400 font-medium">/{event.capacity || '∞'}</span>
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-full ${colors.bg} bg-opacity-10 flex items-center justify-center`}>
                    <Ticket className={`w-6 h-6 ${colors.text.replace('100', '600')}`} />
                  </div>
                </Card>
              </div>

            </div>
          </div>

          {/* RIGHT COLUMN: ADMIN COMMAND CENTER (Sticky) */}
          <div className="lg:col-span-4">
            <div className="sticky top-8">

              <div className="relative group">
                {/* Border Effect */}
                <div className={`absolute -inset-0.5 bg-gradient-to-br ${colors.gradient} opacity-50 blur-md rounded-3xl`} />

                {/* Admin Card */}
                <Card className="relative p-6 pt-8 bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border-none">
                  <div className="absolute top-0 left-0 w-full h-2 rounded-t-3xl bg-neutral-800" />

                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                      <Shield className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Admin Controls</h3>
                      <p className="text-sm text-neutral-500">Manage Event Context</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Primary Actions */}
                    <div className="space-y-3">
                      <Button
                        onClick={() => router.push(`/admin/events/${event.id}/edit`)}
                        className="w-full h-14 text-sm font-bold shadow-lg shadow-blue-500/20 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl"
                      >
                        <Edit className="w-4 h-4 mr-3" /> Edit Event
                      </Button>

                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          onClick={() => alert('View Participants functionality coming soon!')}
                          variant="outline"
                          className="h-12 border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-bold uppercase tracking-wider"
                        >
                          <Users className="w-4 h-4 mr-2" /> Attendees
                        </Button>

                        <Button
                          onClick={() => alert('Analytics Dashboard coming soon!')}
                          variant="outline"
                          className="h-12 border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-bold uppercase tracking-wider"
                        >
                          <BarChart className="w-4 h-4 mr-2" /> Data
                        </Button>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="my-6 border-t border-neutral-100 dark:border-neutral-800" />

                    {/* Danger Zone */}
                    <div className="space-y-3">
                      {!isConcluded && (
                        <Button
                          onClick={() => setShowConcludeConfirm(true)}
                          className="w-full h-12 bg-neutral-900 hover:bg-black text-white rounded-xl font-medium"
                        >
                          <Power className="w-4 h-4 mr-2" /> Conclude Event
                        </Button>
                      )}

                      <Button
                        onClick={() => setShowDeleteConfirm(true)}
                        variant="ghost"
                        className="w-full h-12 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl font-medium"
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Delete Event
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Confirmation Modals */}
              {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
                  <Card className="max-w-md w-full p-8 text-center m-4 rounded-[2rem]">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold mb-2">Delete Event?</h3>
                    <p className="text-neutral-500 mb-6">Are you sure you want to delete this event? This action cannot be undone.</p>
                    <div className="flex gap-4">
                      <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="flex-1 h-12 rounded-xl">Cancel</Button>
                      <Button onClick={handleDelete} className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white">Delete</Button>
                    </div>
                  </Card>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </div >
  )
}
