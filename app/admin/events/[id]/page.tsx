'use client'

import { useRouter, useParams } from 'next/navigation'
import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Calendar, Clock, ArrowLeft, Ticket, Users, Info, Edit, Trash2, Power, BarChart, Landmark, AlertCircle, Shield, X, Search, FileDown, Printer, CheckCircle2 } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { getEventById, Event } from '@/lib/event-context'
import { api, apiCall, adminApi } from '@/lib/api-config'

// Define the precise color palette
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

interface Registration {
  id: number
  first_name: string
  last_name: string
  email: string
  affiliation: string
  is_present: boolean
  has_evaluated?: boolean
  created_at?: string
}

export default function AdminEventDetailPage() {
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false)
  const [showConcludeConfirm, setShowConcludeConfirm] = useState<boolean>(false)
  const [showConcludeSuccess, setShowConcludeSuccess] = useState<boolean>(false)
  const [concluding, setConcluding] = useState<boolean>(false)

  // Real Data States
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [registrationsLoading, setRegistrationsLoading] = useState<boolean>(false)
  const [searchTerm, setSearchTerm] = useState<string>('')

  // Modal States
  const [showParticipantsModal, setShowParticipantsModal] = useState<boolean>(false)
  const [showAnalyticsModal, setShowAnalyticsModal] = useState<boolean>(false)
  const [selectedParticipant, setSelectedParticipant] = useState<Registration | null>(null)
  const [selectedParticipantFull, setSelectedParticipantFull] = useState<any>(null)

  // Countdown Logic
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

    setTimeLeft(calculateTimeLeft())

    return () => clearInterval(timer)
  }, [event])

  const router = useRouter()
  const params = useParams()

  useEffect(() => {
    const eventId = params.id as string

    async function fetchEventAndData() {
      setLoading(true)
      try {
        // Fetch Event
        const eventUrl = adminApi.eventById(eventId)
        const response = await apiCall.get(eventUrl)

        if (response.ok) {
          const apiEvent = await response.json()
          setEvent(apiEvent as Event)
        } else {
          const localEvent = getEventById(eventId)
          if (localEvent) setEvent(localEvent)
        }

        // Fetch Registrations (Data for Modals)
        setRegistrationsLoading(true)
        const regsUrl = `${api.registrations()}?event=${eventId}`
        const regsResponse = await apiCall.get(regsUrl)
        if (regsResponse.ok) {
          const data = await regsResponse.json()
          setRegistrations(Array.isArray(data) ? data : data.results || [])
        }
      } catch (error) {
        console.error('Error fetching event details:', error)
      } finally {
        setLoading(false)
        setRegistrationsLoading(false)
      }
    }

    fetchEventAndData()
  }, [params.id])

  // Compute Analytics
  const analytics = useMemo(() => {
    const total = registrations.length
    const present = registrations.filter(r => r.is_present).length
    // const evaluated = registrations.filter(r => r.has_evaluated).length // Mock if property missing
    const rate = total > 0 ? ((present / total) * 100).toFixed(1) : '0'

    const deptCounts: Record<string, number> = {}
    registrations.forEach(r => {
      const dept = r.affiliation || 'Unknown'
      deptCounts[dept] = (deptCounts[dept] || 0) + 1
    })

    return { total, present, rate, deptCounts }
  }, [registrations])

  // Filtered Participants
  const filteredParticipants = useMemo(() => {
    if (!searchTerm) return registrations
    const term = searchTerm.toLowerCase()
    return registrations.filter(r =>
      r.first_name.toLowerCase().includes(term) ||
      r.last_name.toLowerCase().includes(term) ||
      r.email.toLowerCase().includes(term) ||
      r.affiliation?.toLowerCase().includes(term)
    )
  }, [registrations, searchTerm])

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
    setConcluding(true)
    try {
      const response = await apiCall.post(adminApi.eventById(event.id) + 'conclude/', {})

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        alert(errorData.error || 'Failed to conclude event')
        setConcluding(false)
        return
      }

      // Success - refresh event data
      const eventUrl = adminApi.eventById(event.id)
      const eventResponse = await apiCall.get(eventUrl)

      if (eventResponse.ok) {
        const updatedEvent = await eventResponse.json()
        setEvent(updatedEvent as Event)
      }

      setShowConcludeConfirm(false)
      setShowConcludeSuccess(true)
    } catch (error) {
      console.error('Error concluding event:', error)
      alert('Failed to conclude event. Please try again.')
    } finally {
      setConcluding(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white animate-pulse">Loading event experience...</div>
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
        <div className="absolute inset-0 flex flex-col justify-end pb-12 md:pb-24 px-6 md:px-12 max-w-[1700px] mx-auto">

          <div className="absolute top-8 left-6 md:left-12">
            <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 backdrop-blur-md rounded-full px-6" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5 mr-2" /> Back to Dashboard
            </Button>
          </div>

          <div className="w-full flex flex-col md:flex-row items-end justify-between gap-12">
            <div className="flex-1 space-y-6 animate-in slide-in-from-bottom-10 duration-700">

              <div className="flex items-center gap-3">
                <Badge className={`${colors.bg} text-white hover:${colors.bg} border-none px-4 py-1.5 text-sm uppercase tracking-widest font-bold shadow-lg shadow-black/20`}>
                  {eventCategory}
                </Badge>
                {isConcluded && (
                  <Badge className="bg-neutral-800 text-white border-none px-4 py-1.5 font-bold uppercase tracking-wider">
                    Concluded
                  </Badge>
                )}
                <Badge variant="outline" className={`${(event.isPublic || (event as any).is_public) ? 'border-green-400 text-green-400' : 'border-amber-400 text-amber-400'} px-3 py-1.5 uppercase tracking-wide text-xs font-bold bg-black/20 backdrop-blur-md`}>
                  {(event.isPublic || (event as any).is_public) ? 'Public Event' : 'Private'}
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
      {/* Adjusted negative margin -mt-16 */}
      <div className="max-w-[1700px] mx-auto px-6 md:px-12 -mt-16 relative z-10 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* MAIN CONTENT (Left 8) */}
          <div className="lg:col-span-8 flex flex-col gap-8">

            {/* Extended Details Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-4 bg-white/90 dark:bg-neutral-900/90 backdrop-blur border-none rounded-2xl shadow-lg flex flex-col items-center justify-center text-center">
                <p className="text-xs text-neutral-500 uppercase tracking-wider font-bold mb-1">Semester</p>
                <p className="font-bold text-neutral-900 dark:text-white">{event.semester || '1st Semester'}</p>
              </Card>
              <Card className="p-4 bg-white/90 dark:bg-neutral-900/90 backdrop-blur border-none rounded-2xl shadow-lg flex flex-col items-center justify-center text-center">
                <p className="text-xs text-neutral-500 uppercase tracking-wider font-bold mb-1">School Year</p>
                <p className="font-bold text-neutral-900 dark:text-white">{event.school_year || '2025-2026'}</p>
              </Card>
              <Card className="p-4 bg-white/90 dark:bg-neutral-900/90 backdrop-blur border-none rounded-2xl shadow-lg flex flex-col items-center justify-center text-center">
                <p className="text-xs text-neutral-500 uppercase tracking-wider font-bold mb-1">Capacity</p>
                <p className="font-bold text-neutral-900 dark:text-white">{event.capacity || 'Unlimited'}</p>
              </Card>
              <Card className="p-4 bg-white/90 dark:bg-neutral-900/90 backdrop-blur border-none rounded-2xl shadow-lg flex flex-col items-center justify-center text-center">
                <p className="text-xs text-neutral-500 uppercase tracking-wider font-bold mb-1">Access</p>
                <p className="font-bold text-neutral-900 dark:text-white">{event.isPaidEvent ? 'Paid Ticket' : 'Free Entry'}</p>
              </Card>
            </div>

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

                {/* Visual Venue Tile - REMOVED AS REQUESTED */}

                {/* Participation Tile */}
                <Card className="flex-1 p-6 border-none shadow-xl bg-white dark:bg-neutral-900 rounded-[2rem] flex flex-col justify-center">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-neutral-500 text-xs uppercase tracking-widest font-bold">Total Registrations</p>
                    <div className={`w-10 h-10 rounded-full ${colors.bg} bg-opacity-10 flex items-center justify-center`}>
                      <Ticket className={`w-5 h-5 ${colors.text.replace('100', '600')}`} />
                    </div>
                  </div>
                  <p className="text-5xl font-black text-neutral-900 dark:text-white tracking-tighter">
                    {analytics.total}<span className="text-lg text-neutral-400 font-medium ml-2">/{event.capacity || '∞'}</span>
                  </p>
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
                          onClick={() => setShowParticipantsModal(true)}
                          variant="outline"
                          className="h-12 border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-bold uppercase tracking-wider"
                        >
                          <Users className="w-4 h-4 mr-2" /> Attendees
                        </Button>

                        <Button
                          onClick={() => setShowAnalyticsModal(true)}
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

              {showConcludeConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
                  <Card className="max-w-md w-full p-8 text-center m-4 rounded-[2rem]">
                    <Power className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold mb-2">Conclude Event?</h3>
                    <p className="text-neutral-500 mb-6">
                      This will mark the event as completed. After conclusion:
                      <br />• Check-in will be <strong>disabled</strong>
                      <br />• Check-out will be <strong>enabled</strong>
                      <br />• Participants can be checked out
                    </p>
                    <div className="flex gap-4">
                      <Button variant="outline" onClick={() => setShowConcludeConfirm(false)} className="flex-1 h-12 rounded-xl" disabled={concluding}>Cancel</Button>
                      <Button onClick={handleConclude} className="flex-1 h-12 rounded-xl bg-neutral-900 hover:bg-black text-white" disabled={concluding}>
                        {concluding ? 'Concluding...' : 'Conclude'}
                      </Button>
                    </div>
                  </Card>
                </div>
              )}

              {showConcludeSuccess && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
                  <Card className="max-w-md w-full p-8 text-center m-4 rounded-[2rem]">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                      <CheckCircle2 className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2 text-green-600 dark:text-green-500">Event Successfully Concluded!</h3>
                    <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                      Check-in is now <strong className="text-red-600">disabled</strong> and check-out is <strong className="text-green-600">enabled</strong>.
                    </p>
                    <Button onClick={() => setShowConcludeSuccess(false)} className="w-full h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white">
                      Got it!
                    </Button>
                  </Card>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>

      {/* VIEW PARTICIPANTS MODAL */}
      {showParticipantsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-4xl mx-6 bg-white dark:bg-neutral-950 border-none rounded-3xl overflow-hidden shadow-2xl max-h-[85vh] flex flex-col">
            <div className={`flex items-center justify-between p-6 border-b border-neutral-100 dark:border-neutral-800 ${colors.bg} text-white`}>
              <div>
                <h2 className="text-2xl font-bold">Event Participants</h2>
                <p className="text-white/80 text-sm">Registered Attendees for {event.name}</p>
              </div>
              <Button variant="ghost" onClick={() => setShowParticipantsModal(false)} className="rounded-full hover:bg-white/20 text-white">
                <X className="w-6 h-6" />
              </Button>
            </div>

            <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-4 bg-neutral-50 dark:bg-neutral-900">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search participants..."
                  className="w-full pl-10 pr-4 h-10 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-black text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="text-sm text-neutral-500 font-medium">
                {filteredParticipants.length} results
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-0">
              <table className="w-full text-left border-collapse">
                <thead className="bg-neutral-50 dark:bg-neutral-900 sticky top-0 z-10">
                  <tr>
                    <th className="p-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Name</th>
                    <th className="p-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Email</th>
                    <th className="p-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Affiliation</th>
                    <th className="p-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Affiliation</th>
                    <th className="p-4 text-xs font-bold text-neutral-500 uppercase tracking-wider text-right">Status</th>
                    <th className="p-4 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {filteredParticipants.length > 0 ? (
                    filteredParticipants.map((reg) => (
                      <tr key={reg.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                        <td className="p-4 font-medium">{reg.first_name} {reg.last_name}</td>
                        <td className="p-4 text-neutral-500 text-sm">
                          {reg.email.length > 25 ? `${reg.email.substring(0, 25)}...` : reg.email}
                        </td>
                        <td className="p-4"><Badge variant="outline" className="bg-neutral-50 dark:bg-neutral-900">{reg.affiliation}</Badge></td>
                        <td className="p-4 text-right">
                          {reg.is_present ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-none">Checked In</Badge>
                          ) : (
                            <Badge className="bg-neutral-100 text-neutral-600 hover:bg-neutral-200 border-none">Registered</Badge>
                          )}
                        </td>
                        <td className="p-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
                            onClick={async () => {
                              setSelectedParticipant(reg)
                              // Fetch full registration data with qr_code_value
                              try {
                                const regResponse = await apiCall.get(api.registrationById(reg.id))
                                if (regResponse.ok) {
                                  const fullReg = await regResponse.json()
                                  setSelectedParticipantFull(fullReg)
                                  setTimeout(() => window.print(), 100)
                                } else {
                                  setSelectedParticipantFull(reg)
                                  setTimeout(() => window.print(), 100)
                                }
                              } catch {
                                setSelectedParticipantFull(reg)
                                setTimeout(() => window.print(), 100)
                              }
                            }}
                          >
                            <Printer className="w-4 h-4 text-neutral-400" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-neutral-400 italic">
                        {registrationsLoading ? 'Loading data...' : 'No participants found.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* DATA ANALYTICS MODAL */}
      {showAnalyticsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-5xl mx-6 bg-neutral-50 dark:bg-neutral-950 border-none rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <div className={`flex items-center justify-between p-6 border-b border-neutral-100 dark:border-neutral-800 ${colors.bg} text-white`}>
              <div>
                <h2 className="text-2xl font-bold">Event Analytics</h2>
                <p className="text-white/80 text-sm">Real-time insights for {event.name}</p>
              </div>
              <Button variant="ghost" onClick={() => setShowAnalyticsModal(false)} className="rounded-full hover:bg-white/20 text-white">
                <X className="w-6 h-6" />
              </Button>
            </div>

            <div className="p-8 overflow-y-auto">
              {/* Top Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card className="p-6 border-none shadow-md bg-white dark:bg-neutral-900 rounded-2xl">
                  <p className="text-xs text-neutral-500 uppercase tracking-bold font-bold mb-2">Total Registrations</p>
                  <p className="text-4xl font-black text-neutral-900 dark:text-white">{analytics.total}</p>
                  <p className="text-neutral-400 text-xs font-bold mt-2">
                    {((analytics.total / (Number(event.capacity) || 1)) * 100).toFixed(0)}% Capacity
                  </p>
                </Card>
                <Card className="p-6 border-none shadow-md bg-white dark:bg-neutral-900 rounded-2xl">
                  <p className="text-xs text-neutral-500 uppercase tracking-bold font-bold mb-2">Actual Turnout</p>
                  <p className="text-4xl font-black text-neutral-900 dark:text-white">{analytics.present}</p>
                  <p className="text-neutral-400 text-xs font-bold mt-2">
                    {analytics.rate}% Attendance Rate
                  </p>
                </Card>
                <Card className="p-6 border-none shadow-md bg-white dark:bg-neutral-900 rounded-2xl">
                  <p className="text-xs text-neutral-500 uppercase tracking-bold font-bold mb-2">Departments</p>
                  <p className="text-4xl font-black text-neutral-900 dark:text-white">{Object.keys(analytics.deptCounts).length}</p>
                  <p className="text-neutral-400 text-xs font-bold mt-2">Active colleges</p>
                </Card>
                <Card className="p-6 border-none shadow-md bg-white dark:bg-neutral-900 rounded-2xl">
                  <p className="text-xs text-neutral-500 uppercase tracking-bold font-bold mb-2">Ticket Revenue</p>
                  <p className="text-4xl font-black text-neutral-900 dark:text-white">
                    {event.isPaidEvent ? `₱${(analytics.total * (Number(event.ticketPrice) || 0)).toLocaleString()}` : 'Free'}
                  </p>
                </Card>
              </div>

              {/* Visual Charts Area */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Attendance Chart Mockup */}
                <Card className="p-6 border-none shadow-md bg-white dark:bg-neutral-900 rounded-3xl h-[400px] flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg">Registration Status</h3>
                  </div>
                  <div className="flex-1 flex flex-col justify-center gap-4 px-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1 font-medium">
                        <span>Registered</span>
                        <span>{analytics.total}</span>
                      </div>
                      <div className="h-4 bg-neutral-100 rounded-full overflow-hidden">
                        <div className={`h-full ${colors.bg} opacity-50`} style={{ width: '100%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1 font-medium">
                        <span>Checked In (Present)</span>
                        <span>{analytics.present}</span>
                      </div>
                      <div className="h-4 bg-neutral-100 rounded-full overflow-hidden">
                        <div className={`h-full ${colors.bg}`} style={{ width: `${analytics.rate}%` }} />
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Department Distribution */}
                <Card className="p-6 border-none shadow-md bg-white dark:bg-neutral-900 rounded-3xl h-[400px] flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg">Department Distribution</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                    {Object.entries(analytics.deptCounts)
                      .sort(([, a], [, b]) => b - a)
                      .map(([dept, count]) => (
                        <div key={dept}>
                          <div className="flex justify-between text-xs mb-1 font-bold text-neutral-500 uppercase">
                            <span>{dept || 'External / Other'}</span>
                            <span>{count}</span>
                          </div>
                          <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-neutral-800 dark:bg-white"
                              style={{ width: `${(count / analytics.total) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                </Card>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* HIDDEN PRINT COMPONENT */}
      <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-0">
        {selectedParticipant && selectedParticipantFull && (
          <div className="w-[300px] mx-auto pt-8 flex flex-col items-center font-mono text-black">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-black uppercase tracking-tight mb-2">EVENT PASS</h1>
              <p className="text-xs uppercase tracking-widest border-b border-black pb-4 mb-4">Official Entry Pass</p>
              <h2 className="text-lg font-bold leading-tight mb-1">{event.name}</h2>
              <p className="text-xs">{new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              <p className="text-xs mt-1">{event.startTime || event.start_time} - {event.endTime || event.end_time}</p>
              <p className="text-xs mt-1">{event.venue || event.location}</p>
            </div>

            <div className="border-4 border-black p-2 rounded-xl mb-6">
              <QRCodeSVG
                value={selectedParticipantFull.qr_code_value || `REG-${event.id}-${selectedParticipant.email}`}
                size={150}
                level="H"
              />
            </div>

            <div className="text-center w-full border-t border-dashed border-black pt-6">
              <p className="text-[10px] uppercase tracking-wider mb-1">Attendee</p>
              <p className="text-xl font-bold uppercase mb-4">{selectedParticipant.first_name} {selectedParticipant.last_name}</p>

              <p className="text-[10px] uppercase tracking-wider mb-1">Affiliation</p>
              <p className="font-bold uppercase mb-6">{selectedParticipant.affiliation}</p>

              <p className="text-[10px] uppercase tracking-wider mb-2">Ticket ID</p>
              <p className="bg-black text-white px-2 py-1 inline-block text-xs font-mono rounded">
                {selectedParticipantFull.qr_code_value || `REG-${selectedParticipant.id}`}
              </p>
            </div>

            <div className="mt-12 text-[10px] text-center opacity-50">
              <p>Powered by CROSSCERT</p>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
