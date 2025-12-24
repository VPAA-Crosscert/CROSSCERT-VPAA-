'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Edit, Trash2, Eye, Calendar, MapPin, Search, ChevronDown } from 'lucide-react'
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

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'CCJE': { bg: 'bg-red-500', border: 'border-red-500', text: 'text-white' },
  'CET': { bg: 'bg-orange-500', border: 'border-orange-500', text: 'text-white' },
  'CHATME': { bg: 'bg-gray-500', border: 'border-gray-500', text: 'text-white' },
  'HUSOCOM': { bg: 'bg-fuchsia-500', border: 'border-fuchsia-500', text: 'text-white' },
  'COME': { bg: 'bg-sky-500', border: 'border-sky-500', text: 'text-white' },
  'SBME': { bg: 'bg-yellow-500', border: 'border-yellow-500', text: 'text-black' },
  'STE': { bg: 'bg-blue-600', border: 'border-blue-600', text: 'text-white' },
  'HCDC': { bg: 'bg-primary', border: 'border-primary', text: 'text-primary-foreground' },
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
        console.log('[Events List] Fetching events from:', eventsUrl)
        const res = await apiCall.get(eventsUrl)

        console.log('[Events List] Response status:', res.status, res.statusText)

        if (!res.ok) {
          console.error('[Events List] Unable to load events. Status:', res.status, res.statusText)
          const existing = localStorage.getItem('crosscert_local_events')
          if (existing) {
            const list = JSON.parse(existing) as AdminEvent[]
            console.log('[Events List] Using localStorage fallback, events count:', list.length)
            setEvents(Array.isArray(list) ? list : [])
          } else {
            console.log('[Events List] No localStorage fallback available')
            setEvents([])
          }
          return
        }

        let data: unknown = []
        try {
          data = await res.json()
          console.log('[Events List] Raw API response:', data)
        } catch {
          console.error('[Events List] Events API did not return JSON.')
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

  // Fixed school years from 2021-2022 to 2025-2026
  const availableSchoolYears = ['ALL', '2025-2026', '2024-2025', '2023-2024', '2022-2023', '2021-2022']

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const eventName = (event.name || event.title || '').toString()
      const matchesSearch = eventName.toLowerCase().includes(searchTerm.toLowerCase())

      if (!matchesSearch) return false

      // Category filter
      if (selectedCategory !== 'ALL') {
        const eventCategory = getCategoryFromEvent(event)
        if (selectedCategory === 'HCDC') {
          if (eventCategory !== 'HCDC') return false
        } else {
          if (eventCategory !== selectedCategory) return false
        }
      }

      // Semester filter
      if (selectedSemester !== 'ALL') {
        const eventSemester = getSemester(event.date || '')
        if (eventSemester !== selectedSemester) return false
      }

      // Month filter
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

  // Split events into upcoming and past
  const { upcomingEvents, pastEvents } = useMemo(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0) // Start of today

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
        // Events without dates go to upcoming
        upcoming.push(event)
      }
    })

    return { upcomingEvents: upcoming, pastEvents: past }
  }, [filteredEvents])

  // Group upcoming events by month
  const upcomingEventsByMonth = useMemo(() => {
    const grouped: Record<string, AdminEvent[]> = {}
    upcomingEvents.forEach(event => {
      const month = getMonth(event.date || '')
      if (!grouped[month]) {
        grouped[month] = []
      }
      grouped[month].push(event)
    })

    // Sort months chronologically
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

  // Group past events by month
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
      return bIdx - aIdx // Reverse order for past events
    }).forEach(month => {
      sorted[month] = grouped[month].sort((a, b) => {
        const dateA = new Date(a.date || '').getTime()
        const dateB = new Date(b.date || '').getTime()
        return dateB - dateA // Reverse order for past events
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
    console.log('[Delete Event] Deleting event with ID:', id)
    setShowDeleteConfirm(null)

    try {
      const eventUrl = adminApi.eventById(id)
      console.log('[Delete Event] Deleting from API:', eventUrl)

      const response = await apiCall.delete(eventUrl)
      console.log('[Delete Event] Delete response status:', response.status, response.statusText)

      if (!response.ok) {
        console.error('[Delete Event] Failed to delete from API:', response.status, response.statusText)
        const errorText = await response.text().catch(() => 'Unknown error')
        console.error('[Delete Event] Error details:', errorText)
        alert(`Failed to delete event: ${response.status} ${response.statusText}`)
        return
      }

      console.log('[Delete Event] ✅ Successfully deleted from API')

      const remaining = events.filter(e => String(e.id) !== String(id))
      setEvents(remaining)
      console.log('[Delete Event] Updated local state, remaining events:', remaining.length)

      try {
        const existing = localStorage.getItem('crosscert_local_events')
        if (existing) {
          const list = JSON.parse(existing) as AdminEvent[]
          const filtered = list.filter(e => String(e.id) !== String(id))
          localStorage.setItem('crosscert_local_events', JSON.stringify(filtered))
          console.log('[Delete Event] Cleaned up localStorage')
        }
      } catch (lsErr) {
        console.warn('[Delete Event] Could not update localStorage:', lsErr)
      }
    } catch (err: any) {
      console.error('[Delete Event] Error during delete:', err)
      alert(`Failed to delete event: ${err.message || 'Unknown error'}`)
    }
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Manage Events</h1>
          <p className="text-muted-foreground mt-1">View and manage all events</p>
        </div>
        <Button
          className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          onClick={() => router.push('/admin/events/create')}
        >
          <Plus className="w-4 h-4" />
          Create Event
        </Button>
      </div>

      {/* Search Bar - Full Width */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Search events..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-background border-border text-foreground h-12 text-base"
        />
      </div>

      {/* Categories Filter - Top Horizontal */}
      <div className="space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <label className="text-sm font-semibold text-foreground">Categories</label>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear Filters
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
                    ? `${colors.bg} ${colors.text} border-0 hover:opacity-90`
                    : isSelected
                      ? 'bg-secondary text-secondary-foreground'
                      : colors
                        ? `${colors.border} border-2 bg-white dark:bg-card text-foreground hover:bg-muted`
                        : 'border-border text-foreground'}
                  font-medium transition-all
                `}
              >
                {cat === 'HCDC' ? 'HCDC EVENTS' : cat}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Main Layout: Semesters (Left) | Events (Center) | Months (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        {/* Semesters Filter - Left Column */}
        <div className="lg:col-span-2 space-y-2 order-2 lg:order-1">
          <label className="text-sm font-semibold text-foreground block">Semesters</label>
          <div className="space-y-1">
            {semesters.map((sem) => (
              <button
                key={sem}
                onClick={() => setSelectedSemester(sem)}
                className={`
                  w-full text-left px-4 py-2 rounded-md transition-all
                  ${selectedSemester === sem
                    ? 'bg-secondary text-secondary-foreground font-semibold'
                    : 'text-foreground hover:bg-muted'}
                  flex items-center gap-2
                `}
              >
                <span className={`w-2 h-2 rounded-full ${selectedSemester === sem ? 'bg-secondary-foreground' : 'bg-muted-foreground'}`} />
                {sem}
              </button>
            ))}
          </div>
        </div>

        {/* Events List - Center Column */}
        <div className="lg:col-span-8 space-y-6 order-1 lg:order-2">
          {loading && (
            <Card className="p-12 border border-border bg-card text-center">
              <p className="text-muted-foreground">Loading events...</p>
            </Card>
          )}

          {/* Upcoming Events */}
          {!loading && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground">Upcoming Events</h2>
                <span className="text-sm text-muted-foreground">{upcomingEvents.length} event{upcomingEvents.length !== 1 ? 's' : ''}</span>
              </div>

              {Object.keys(upcomingEventsByMonth).length === 0 ? (
                <Card className="p-12 border border-border bg-card text-center">
                  <p className="text-muted-foreground">No upcoming events found matching your filters</p>
                </Card>
              ) : (
                Object.entries(upcomingEventsByMonth).map(([month, monthEvents]) => (
                  <div key={month} className="space-y-4">
                    <h3 className="text-xl font-bold text-foreground border-b border-border pb-2">
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
                            className="overflow-hidden border border-border bg-card hover:shadow-lg transition-all group"
                          >
                            {(event.coverImage || event.cover_image) ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={event.coverImage || event.cover_image || ''}
                                alt={event.title || event.name || 'Event cover'}
                                className="w-full aspect-video object-cover"
                              />
                            ) : (
                              <div className="w-full aspect-video bg-gradient-to-br from-secondary/20 to-primary/20" />
                            )}
                            <div className="p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}>
                                  {eventCategory}
                                </span>
                                <span className="text-xs text-muted-foreground font-medium">
                                  {yearOfCourse}
                                </span>
                              </div>

                              <h3 className="font-bold text-lg text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                                {event.title || event.name || 'Untitled Event'}
                              </h3>

                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <MapPin className="w-4 h-4 shrink-0" />
                                  <span className="line-clamp-1">{event.venue || event.location}</span>
                                </div>
                              )}

                              <div className="flex gap-2 pt-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="flex-1"
                                  title="View"
                                  onClick={() => router.push(`/admin/events/${event.id}`)}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  View
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="flex-1"
                                  title="Edit"
                                  onClick={() => router.push(`/admin/events/${event.id}/edit`)}
                                >
                                  <Edit className="w-4 h-4 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:bg-destructive/10"
                                  title="Delete"
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

          {/* Past Events Section */}
          {!loading && pastEvents.length > 0 && (
            <div className="space-y-4 pt-8 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-foreground">Past Events</h2>
                  <span className="text-sm text-muted-foreground">{pastEvents.length} event{pastEvents.length !== 1 ? 's' : ''}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPastEvents(!showPastEvents)}
                  className="gap-2"
                >
                  {showPastEvents ? 'Hide' : 'Show'} Past Events
                  <ChevronDown className={`w-4 h-4 transition-transform ${showPastEvents ? 'rotate-180' : ''}`} />
                </Button>
              </div>

              {showPastEvents && (
                Object.entries(pastEventsByMonth).map(([month, monthEvents]) => (
                  <div key={month} className="space-y-4">
                    <h3 className="text-xl font-bold text-muted-foreground border-b border-border pb-2">
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
                            className="overflow-hidden border border-border bg-card opacity-75 hover:opacity-100 hover:shadow-lg transition-all group"
                          >
                            {(event.coverImage || event.cover_image) ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={event.coverImage || event.cover_image || ''}
                                alt={event.title || event.name || 'Event cover'}
                                className="w-full aspect-video object-cover grayscale group-hover:grayscale-0 transition-all"
                              />
                            ) : (
                              <div className="w-full aspect-video bg-gradient-to-br from-muted/20 to-muted/40" />
                            )}
                            <div className="p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text} opacity-80`}>
                                  {eventCategory}
                                </span>
                                <span className="text-xs text-muted-foreground font-medium">
                                  {yearOfCourse}
                                </span>
                              </div>

                              <h3 className="font-bold text-lg text-muted-foreground line-clamp-2 group-hover:text-foreground transition-colors">
                                {event.title || event.name || 'Untitled Event'}
                              </h3>

                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <MapPin className="w-4 h-4 shrink-0" />
                                  <span className="line-clamp-1">{event.venue || event.location}</span>
                                </div>
                              )}

                              <div className="flex gap-2 pt-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="flex-1"
                                  title="View"
                                  onClick={() => router.push(`/admin/events/${event.id}`)}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  View
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="flex-1"
                                  title="Edit"
                                  onClick={() => router.push(`/admin/events/${event.id}/edit`)}
                                >
                                  <Edit className="w-4 h-4 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:bg-destructive/10"
                                  title="Delete"
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

        {/* Right Sidebar - School Year and Months */}
        <div className="lg:col-span-2 space-y-4 order-3 hidden lg:block">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground block">School Year</label>
            <select
              value={selectedSchoolYear}
              onChange={(e) => setSelectedSchoolYear(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground"
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
              className="w-full flex items-center justify-between text-sm font-semibold text-foreground"
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
                      w-full text-left px-4 py-2 rounded-full transition-all text-sm
                      ${selectedMonth === month
                        ? 'bg-secondary text-secondary-foreground font-semibold'
                        : 'text-foreground hover:bg-muted'}
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 border border-border bg-card max-w-sm mx-4">
            <h2 className="text-lg font-bold text-foreground mb-2">Delete Event</h2>
            <p className="text-muted-foreground mb-6">Are you sure you want to delete this event? This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDelete(showDeleteConfirm)}
              >
                Delete
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
