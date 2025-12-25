'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Edit, Trash2, Eye, Calendar, MapPin, Search, ChevronDown, X, Sparkles, Filter } from 'lucide-react'
import { adminApi, apiCall } from '@/lib/api-config'

type AdminEvent = {
  id: number | string
  title?: string
  name?: string
  date?: string
  start_time?: string
  startTime?: string
  end_time?: string
  endTime?: string
  location?: string
  venue?: string
  cover_image?: string
  coverImage?: string
  category?: string
  department?: string
  speakers?: string
  description?: string
  status?: string
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

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  'CCJE': { bg: 'bg-red-500', border: 'border-red-500', text: 'text-white', glow: 'shadow-red-500/50' },
  'CET': { bg: 'bg-orange-500', border: 'border-orange-500', text: 'text-white', glow: 'shadow-orange-500/50' },
  'CHATME': { bg: 'bg-neutral-500', border: 'border-neutral-500', text: 'text-white', glow: 'shadow-neutral-500/50' },
  'HUSOCOM': { bg: 'bg-fuchsia-500', border: 'border-fuchsia-500', text: 'text-white', glow: 'shadow-fuchsia-500/50' },
  'COME': { bg: 'bg-sky-500', border: 'border-sky-500', text: 'text-white', glow: 'shadow-sky-500/50' },
  'SBME': { bg: 'bg-yellow-500', border: 'border-yellow-500', text: 'text-black', glow: 'shadow-yellow-500/50' },
  'STE': { bg: 'bg-blue-600', border: 'border-blue-600', text: 'text-white', glow: 'shadow-blue-600/50' },
  'HCDC': { bg: 'bg-red-600', border: 'border-red-600', text: 'text-white', glow: 'shadow-red-600/50' },
}

const getDepartmentAbbr = (fullName: string): string | null => {
  if (!fullName) return null
  if (Object.values(DEPARTMENT_ABBR).includes(fullName as any)) {
    return fullName
  }
  return DEPARTMENT_ABBR[fullName as keyof typeof DEPARTMENT_ABBR] || null
}

const getCategoryFromEvent = (event: AdminEvent): string => {
  if (event.category === 'HCDC') return 'HCDC'
  const deptAbbr = getDepartmentAbbr(event.department || '')
  return deptAbbr || 'HCDC'
}

export default function AdminEvents() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [selectedSemester, setSelectedSemester] = useState('ALL')
  const [selectedMonth, setSelectedMonth] = useState('ALL')
  const [selectedSchoolYear, setSelectedSchoolYear] = useState('ALL')
  const [isMonthsOpen, setIsMonthsOpen] = useState(true)
  const [showPastEvents, setShowPastEvents] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | string | null>(null)
  const [events, setEvents] = useState<AdminEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventsUrl = adminApi.events().endsWith('/') ? adminApi.events() : `${adminApi.events()}/`
        const res = await apiCall.get(eventsUrl)

        if (!res.ok) {
          const existing = localStorage.getItem('crosscert_local_events')
          if (existing) {
            const list = JSON.parse(existing) as AdminEvent[]
            setEvents(Array.isArray(list) ? list : [])
          } else {
            setEvents([])
          }
          return
        }

        let data: unknown = []
        try {
          data = await res.json()
        } catch {
          setEvents([])
          return
        }

        let eventsList: AdminEvent[] = []
        if (Array.isArray(data)) {
          eventsList = data as AdminEvent[]
        } else if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
          eventsList = data.results as AdminEvent[]
        } else if (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data)) {
          eventsList = data.data as AdminEvent[]
        }

        setEvents(eventsList)
      } catch (err) {
        console.error('Error fetching events:', err)
        const existing = localStorage.getItem('crosscert_local_events')
        if (existing) {
          try {
            const list = JSON.parse(existing) as AdminEvent[]
            setEvents(Array.isArray(list) ? list : [])
          } catch {
            setEvents([])
          }
        } else {
          setEvents([])
        }
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [])

  const getSemester = (dateStr: string): string => {
    if (!dateStr) return 'UNKNOWN'
    const date = new Date(dateStr)
    const month = date.getMonth() + 1
    if (month >= 1 && month <= 4) return '1ST'
    if (month >= 5 && month <= 8) return '2ND'
    return 'SUMMER'
  }

  const getMonth = (dateStr: string): string => {
    if (!dateStr) return 'UNKNOWN'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'long' }).toUpperCase()
  }

  const getSchoolYear = (dateStr: string): string => {
    if (!dateStr) return 'UNKNOWN'
    const d = new Date(dateStr)
    const m = d.getMonth() + 1
    const y = d.getFullYear()
    return m >= 8 ? `${y}-${y + 1}` : `${y - 1}-${y}`
  }

  const getYearOfCourse = (event: AdminEvent): string => {
    const value =
      (event as any).year_of_course ||
      (event as any).course_year ||
      (event as any).year
    if (!value) return 'ALL YEARS'
    const normalized = String(value).trim()
    if (!normalized) return 'ALL YEARS'
    return normalized
  }

  const availableSchoolYears = ['ALL', '2025-2026', '2024-2025', '2023-2024', '2022-2023', '2021-2022']

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const eventName = (event.name || event.title || '').toString()
      const matchesSearch = eventName.toLowerCase().includes(searchTerm.toLowerCase())

      if (!matchesSearch) return false

      if (selectedCategory !== 'ALL') {
        const eventCategory = getCategoryFromEvent(event)
        if (selectedCategory === 'HCDC') {
          if (eventCategory !== 'HCDC') return false
        } else {
          if (eventCategory !== selectedCategory) return false
        }
      }

      if (selectedSemester !== 'ALL') {
        const eventSemester = getSemester(event.date || '')
        if (eventSemester !== selectedSemester) return false
      }

      if (selectedMonth !== 'ALL') {
        const eventMonth = getMonth(event.date || '')
        if (eventMonth !== selectedMonth) return false
      }

      if (selectedSchoolYear !== 'ALL') {
        const sy = getSchoolYear(event.date || '')
        if (!sy || sy !== selectedSchoolYear) return false
      }

      return true
    })
  }, [events, searchTerm, selectedCategory, selectedSemester, selectedMonth, selectedSchoolYear])

  const { upcomingEvents, pastEvents } = useMemo(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    const upcoming: AdminEvent[] = []
    const past: AdminEvent[] = []

    filteredEvents.forEach(event => {
      const isCompleted = event.status?.toLowerCase() === 'completed' || event.status?.toLowerCase() === 'concluded'

      if (isCompleted) {
        past.push(event)
      } else if (event.date) {
        const eventDate = new Date(event.date)
        eventDate.setHours(0, 0, 0, 0)

        if (eventDate >= now) {
          upcoming.push(event)
        } else {
          past.push(event)
        }
      } else {
        upcoming.push(event)
      }
    })

    return { upcomingEvents: upcoming, pastEvents: past }
  }, [filteredEvents])

  const upcomingEventsByMonth = useMemo(() => {
    const grouped: Record<string, AdminEvent[]> = {}
    upcomingEvents.forEach(event => {
      const month = getMonth(event.date || '')
      if (!grouped[month]) {
        grouped[month] = []
      }
      grouped[month].push(event)
    })

    const monthOrder = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
      'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER']
    const sorted: Record<string, AdminEvent[]> = {}
    Object.keys(grouped).sort((a, b) => {
      const aIdx = monthOrder.indexOf(a)
      const bIdx = monthOrder.indexOf(b)
      if (aIdx === -1 && bIdx === -1) return 0
      if (aIdx === -1) return 1
      if (bIdx === -1) return -1
      return aIdx - bIdx
    }).forEach(month => {
      sorted[month] = grouped[month].sort((a, b) => {
        const dateA = new Date(a.date || '').getTime()
        const dateB = new Date(b.date || '').getTime()
        return dateA - dateB
      })
    })

    return sorted
  }, [upcomingEvents])

  const pastEventsByMonth = useMemo(() => {
    const grouped: Record<string, AdminEvent[]> = {}
    pastEvents.forEach(event => {
      const month = getMonth(event.date || '')
      if (!grouped[month]) {
        grouped[month] = []
      }
      grouped[month].push(event)
    })

    const monthOrder = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
      'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER']
    const sorted: Record<string, AdminEvent[]> = {}
    Object.keys(grouped).sort((a, b) => {
      const aIdx = monthOrder.indexOf(a)
      const bIdx = monthOrder.indexOf(b)
      if (aIdx === -1 && bIdx === -1) return 0
      if (aIdx === -1) return 1
      if (bIdx === -1) return -1
      return bIdx - aIdx
    }).forEach(month => {
      sorted[month] = grouped[month].sort((a, b) => {
        const dateA = new Date(a.date || '').getTime()
        const dateB = new Date(b.date || '').getTime()
        return dateB - dateA
      })
    })

    return sorted
  }, [pastEvents])

  const clearFilters = () => {
    setSelectedCategory('ALL')
    setSelectedSemester('ALL')
    setSelectedMonth('ALL')
    setSelectedSchoolYear('ALL')
    setSearchTerm('')
  }

  const categories = ['ALL', 'HCDC', 'CCJE', 'CET', 'CHATME', 'HUSOCOM', 'COME', 'SBME', 'STE']
  const semesters = ['ALL', '1ST', '2ND', 'SUMMER']
  const months = ['ALL', 'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER']

  const hasActiveFilters = selectedCategory !== 'ALL' || selectedSemester !== 'ALL' ||
    selectedMonth !== 'ALL' || selectedSchoolYear !== 'ALL' || searchTerm !== ''

  const handleDelete = async (id: number | string) => {
    setShowDeleteConfirm(null)

    try {
      const eventUrl = adminApi.eventById(id)
      const response = await apiCall.delete(eventUrl)

      if (!response.ok) {
        alert(`Failed to delete event: ${response.status} ${response.statusText}`)
        return
      }

      const remaining = events.filter(e => String(e.id) !== String(id))
      setEvents(remaining)

      try {
        const existing = localStorage.getItem('crosscert_local_events')
        if (existing) {
          const list = JSON.parse(existing) as AdminEvent[]
          const filtered = list.filter(e => String(e.id) !== String(id))
          localStorage.setItem('crosscert_local_events', JSON.stringify(filtered))
        }
      } catch (lsErr) {
        console.warn('Could not update localStorage:', lsErr)
      }
    } catch (err: any) {
      alert(`Failed to delete event: ${err.message || 'Unknown error'}`)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50/50 dark:bg-neutral-950 p-6 space-y-8 max-w-[1800px] mx-auto animate-in fade-in duration-500">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-8 shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-red-500/10 via-rose-500/5 to-transparent rounded-full blur-3xl -mr-48 -mt-48" />
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-8 h-8 text-red-500" />
              <h1 className="text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight">Manage Events</h1>
            </div>
            <p className="text-neutral-500 dark:text-neutral-400 text-lg">View, organize, and manage all your events</p>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">{events.length} Total Events</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <Calendar className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span className="text-sm font-medium text-red-600 dark:text-red-400">{upcomingEvents.length} Upcoming</span>
              </div>
            </div>
          </div>
          <Button
            className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white gap-2 shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 transition-all hover:scale-105"
            size="lg"
            onClick={() => router.push('/admin/events/create')}
          >
            <Plus className="w-5 h-5" />
            Create Event
          </Button>
        </div>
      </div>

      {/* Enhanced Search Bar */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-neutral-400 group-focus-within:text-red-500 transition-colors" />
        </div>
        <Input
          placeholder="Search events by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-12 pr-12 h-14 text-lg bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all shadow-sm"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Enhanced Category Filter */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-neutral-500" />
            <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">Categories</label>
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <X className="w-3 h-3 mr-1" />
              Clear All Filters
            </Button>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat
            const colors = cat !== 'ALL' && cat !== 'HCDC' ? CATEGORY_COLORS[cat] : null

            return (
              <Button
                key={cat}
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className={`
                  ${isSelected && colors
                    ? `${colors.bg} ${colors.text} border-0 shadow-lg ${colors.glow} hover:opacity-90 scale-105`
                    : isSelected
                      ? 'bg-red-600 text-white shadow-lg shadow-red-500/30 hover:bg-red-700 scale-105'
                      : colors
                        ? `${colors.border} border-2 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800`
                        : 'border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800'}
                  font-semibold transition-all duration-200 hover:scale-105
                `}
              >
                {cat === 'HCDC' ? 'HCDC EVENTS' : cat}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar - Semesters */}
        <div className="lg:col-span-2 space-y-2 order-2 lg:order-1">
          <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide block mb-3">Semesters</label>
          <div className="space-y-1">
            {semesters.map((sem) => (
              <button
                key={sem}
                onClick={() => setSelectedSemester(sem)}
                className={`
                  w-full text-left px-4 py-3 rounded-lg transition-all font-medium
                  ${selectedSemester === sem
                    ? 'bg-red-600 text-white shadow-lg shadow-red-500/30'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700'}
                  flex items-center gap-2
                `}
              >
                <span className={`w-2 h-2 rounded-full ${selectedSemester === sem ? 'bg-white' : 'bg-neutral-400'}`} />
                {sem}
              </button>
            ))}
          </div>
        </div>

        {/* Center - Events List */}
        <div className="lg:col-span-8 space-y-6 order-1 lg:order-2">
          {loading && (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-64 bg-neutral-200 dark:bg-neutral-800 rounded-2xl animate-pulse" />
              ))}
            </div>
          )}

          {/* Upcoming Events */}
          {!loading && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <div className="w-1 h-8 bg-gradient-to-b from-red-600 to-rose-600 rounded-full" />
                  Upcoming Events
                </h2>
                <span className="px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-sm font-semibold text-neutral-600 dark:text-neutral-300">
                  {upcomingEvents.length} event{upcomingEvents.length !== 1 ? 's' : ''}
                </span>
              </div>

              {Object.keys(upcomingEventsByMonth).length === 0 ? (
                <Card className="p-12 border-2 border-dashed border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 text-center">
                  <Calendar className="w-16 h-16 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
                  <p className="text-neutral-500 dark:text-neutral-400 text-lg">No upcoming events found</p>
                  <p className="text-neutral-400 dark:text-neutral-500 text-sm mt-2">Try adjusting your filters</p>
                </Card>
              ) : (
                Object.entries(upcomingEventsByMonth).map(([month, monthEvents]) => (
                  <div key={month} className="space-y-4">
                    <h3 className="text-xl font-bold text-neutral-800 dark:text-neutral-200 border-l-4 border-red-500 pl-4 py-1">
                      {month}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {monthEvents.map((event) => {
                        const eventCategory = getCategoryFromEvent(event)
                        const colors = CATEGORY_COLORS[eventCategory] || CATEGORY_COLORS['HCDC']
                        const eventDate = event.date ? new Date(event.date) : null
                        const formattedDate = eventDate
                          ? eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : 'TBA'
                        const yearOfCourse = getYearOfCourse(event)

                        return (
                          <Card
                            key={event.id}
                            className="group overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                          >
                            <div className="relative">
                              {(event.coverImage || event.cover_image) ? (
                                <div className="relative overflow-hidden">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={event.coverImage || event.cover_image || ''}
                                    alt={event.title || event.name || 'Event cover'}
                                    className="w-full aspect-video object-cover group-hover:scale-110 transition-transform duration-500"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                                </div>
                              ) : (
                                <div className="w-full aspect-video bg-gradient-to-br from-red-500/20 via-rose-500/10 to-neutral-100 dark:to-neutral-800" />
                              )}
                            </div>
                            <div className="p-5 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${colors.bg} ${colors.text} shadow-md`}>
                                  {eventCategory}
                                </span>
                                <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-md">
                                  {yearOfCourse}
                                </span>
                              </div>

                              <h3 className="font-bold text-lg text-neutral-900 dark:text-white line-clamp-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                                {event.title || event.name || 'Untitled Event'}
                              </h3>

                              <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                                <Calendar className="w-4 h-4 shrink-0 text-red-500" />
                                <span>{formattedDate}</span>
                                {(event.startTime || event.start_time) && (
                                  <>
                                    <span>•</span>
                                    <span>{event.startTime || event.start_time}</span>
                                    {(event.endTime || event.end_time) && (
                                      <span>- {event.endTime || event.end_time}</span>
                                    )}
                                  </>
                                )}
                              </div>

                              {(event.venue || event.location) && (
                                <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                                  <MapPin className="w-4 h-4 shrink-0 text-red-500" />
                                  <span className="line-clamp-1">{event.venue || event.location}</span>
                                </div>
                              )}

                              <div className="flex gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="flex-1 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
                                  onClick={() => router.push(`/admin/events/${event.id}`)}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  View
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="flex-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400"
                                  onClick={() => router.push(`/admin/events/${event.id}/edit`)}
                                >
                                  <Edit className="w-4 h-4 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                                  onClick={() => setShowDeleteConfirm(event.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {/* Past Events */}
          {!loading && pastEvents.length > 0 && (
            <div className="space-y-4 pt-8 border-t-2 border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                    <div className="w-1 h-8 bg-gradient-to-b from-neutral-400 to-neutral-600 rounded-full" />
                    Past Events
                  </h2>
                  <span className="px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-sm font-semibold text-neutral-600 dark:text-neutral-300">
                    {pastEvents.length} event{pastEvents.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPastEvents(!showPastEvents)}
                  className="gap-2 border-neutral-300 dark:border-neutral-700"
                >
                  {showPastEvents ? 'Hide' : 'Show'} Past Events
                  <ChevronDown className={`w-4 h-4 transition-transform ${showPastEvents ? 'rotate-180' : ''}`} />
                </Button>
              </div>

              {showPastEvents && (
                Object.entries(pastEventsByMonth).map(([month, monthEvents]) => (
                  <div key={month} className="space-y-4">
                    <h3 className="text-xl font-bold text-neutral-600 dark:text-neutral-400 border-l-4 border-neutral-400 pl-4 py-1">
                      {month}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {monthEvents.map((event) => {
                        const eventCategory = getCategoryFromEvent(event)
                        const colors = CATEGORY_COLORS[eventCategory] || CATEGORY_COLORS['HCDC']
                        const eventDate = event.date ? new Date(event.date) : null
                        const formattedDate = eventDate
                          ? eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : 'TBA'
                        const yearOfCourse = getYearOfCourse(event)

                        return (
                          <Card
                            key={event.id}
                            className="group overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white/30 dark:bg-neutral-900/30 backdrop-blur-sm opacity-75 hover:opacity-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                          >
                            <div className="relative">
                              {(event.coverImage || event.cover_image) ? (
                                <div className="relative overflow-hidden">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={event.coverImage || event.cover_image || ''}
                                    alt={event.title || event.name || 'Event cover'}
                                    className="w-full aspect-video object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                                  <div className="absolute top-3 right-3 px-2 py-1 bg-neutral-900/80 backdrop-blur-sm rounded-md">
                                    <span className="text-xs font-bold text-white">COMPLETED</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="w-full aspect-video bg-gradient-to-br from-neutral-300/20 via-neutral-400/10 to-neutral-500/20" />
                              )}
                            </div>
                            <div className="p-5 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${colors.bg} ${colors.text} opacity-80`}>
                                  {eventCategory}
                                </span>
                                <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-md">
                                  {yearOfCourse}
                                </span>
                              </div>

                              <h3 className="font-bold text-lg text-neutral-600 dark:text-neutral-400 line-clamp-2 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
                                {event.title || event.name || 'Untitled Event'}
                              </h3>

                              <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-500">
                                <Calendar className="w-4 h-4 shrink-0" />
                                <span>{formattedDate}</span>
                                {(event.startTime || event.start_time) && (
                                  <>
                                    <span>•</span>
                                    <span>{event.startTime || event.start_time}</span>
                                    {(event.endTime || event.end_time) && (
                                      <span>- {event.endTime || event.end_time}</span>
                                    )}
                                  </>
                                )}
                              </div>

                              {(event.venue || event.location) && (
                                <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-500">
                                  <MapPin className="w-4 h-4 shrink-0" />
                                  <span className="line-clamp-1">{event.venue || event.location}</span>
                                </div>
                              )}

                              <div className="flex gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => router.push(`/admin/events/${event.id}`)}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  View
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => router.push(`/admin/events/${event.id}/edit`)}
                                >
                                  <Edit className="w-4 h-4 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  onClick={() => setShowDeleteConfirm(event.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-2 space-y-4 order-3 hidden lg:block sticky top-6 self-start">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide block">School Year</label>
            <select
              value={selectedSchoolYear}
              onChange={(e) => setSelectedSchoolYear(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
            >
              {availableSchoolYears.map((sy) => (
                <option key={sy} value={sy}>
                  {sy === 'ALL' ? 'All School Years' : sy}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => setIsMonthsOpen(!isMonthsOpen)}
              className="w-full flex items-center justify-between text-sm font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide"
            >
              <span>Months</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isMonthsOpen ? 'rotate-180' : 'rotate-0'}`} />
            </button>
            {isMonthsOpen && (
              <div className="space-y-1 max-h-[600px] overflow-y-auto">
                {months.map((month) => (
                  <button
                    key={month}
                    onClick={() => setSelectedMonth(month)}
                    className={`
                      w-full text-left px-4 py-2 rounded-lg transition-all text-sm font-medium
                      ${selectedMonth === month
                        ? 'bg-red-600 text-white shadow-lg shadow-red-500/30'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'}
                    `}
                  >
                    {month}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Delete Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <Card className="p-8 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 max-w-md mx-4 shadow-2xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">Delete Event</h2>
                <p className="text-neutral-600 dark:text-neutral-400">Are you sure you want to delete this event? This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(null)}
                className="border-neutral-300 dark:border-neutral-700"
              >
                Cancel
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => handleDelete(showDeleteConfirm)}
              >
                Delete Event
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
