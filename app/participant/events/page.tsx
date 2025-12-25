'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, MapPin, Calendar, Bookmark, X, Search, ChevronDown, Sparkles, Filter } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useState, useEffect, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { getStoredEvents, fetchUserDepartment } from '@/lib/event-context'
import { Event } from '@/lib/event-context'
import { api, apiCall, getAuthenticatedUserEmail, authApi, apiRequest } from '@/lib/api-config'
import { Badge } from '@/components/ui/badge'

const DEPARTMENT_ABBR = {
  'College of Criminal Justice Education': 'CCJE',
  'College of Engineering and Technology': 'CET',
  'College of Hospitality & Tourism Management': 'CHATME',
  'College of Humanities, Social Sciences and Communication': 'HUSOCOM',
  'College of Maritime Education': 'COME',
  'School of Business & Management': 'SBME',
  'School of Teacher Education': 'STE',
}

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string; gradient: string }> = {
  'CCJE': { bg: 'bg-red-500', border: 'border-red-500', text: 'text-white', gradient: 'from-red-500 to-red-600' },
  'CET': { bg: 'bg-orange-500', border: 'border-orange-500', text: 'text-white', gradient: 'from-orange-500 to-orange-600' },
  'CHATME': { bg: 'bg-gray-500', border: 'border-gray-500', text: 'text-white', gradient: 'from-gray-500 to-gray-600' },
  'HUSOCOM': { bg: 'bg-fuchsia-500', border: 'border-fuchsia-500', text: 'text-white', gradient: 'from-fuchsia-500 to-fuchsia-600' },
  'COME': { bg: 'bg-sky-500', border: 'border-sky-500', text: 'text-white', gradient: 'from-sky-500 to-sky-600' },
  'SBME': { bg: 'bg-yellow-500', border: 'border-yellow-500', text: 'text-black', gradient: 'from-yellow-400 to-yellow-500' },
  'STE': { bg: 'bg-blue-600', border: 'border-blue-600', text: 'text-white', gradient: 'from-blue-600 to-blue-700' },
  'HCDC': { bg: 'bg-red-600', border: 'border-red-600', text: 'text-white', gradient: 'from-red-600 to-rose-600' },
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

export default function ParticipantEvents() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [selectedSemester, setSelectedSemester] = useState('ALL')
  const [selectedMonth, setSelectedMonth] = useState('ALL')
  const [selectedSchoolYear, setSelectedSchoolYear] = useState('ALL')
  const [isMonthsOpen, setIsMonthsOpen] = useState(true)
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set())
  const [events, setEvents] = useState<Event[]>([])
  const [userDepartment, setUserDepartment] = useState('')
  const [showJoinSuccess, setShowJoinSuccess] = useState(false)
  const [joiningEventId, setJoiningEventId] = useState<string | number | null>(null)
  const [registeredEvents, setRegisteredEvents] = useState<Set<string>>(new Set())
  const [showUnregisterSuccess, setShowUnregisterSuccess] = useState(false)
  const [unregisterEventId, setUnregisterEventId] = useState<string | number | null>(null)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const dept = await fetchUserDepartment()
        setUserDepartment(dept)

        const eventsUrl = api.events().endsWith('/') ? api.events() : `${api.events()}/`
        const res = await apiCall.get(eventsUrl)

        let eventsList: Event[] = []

        if (!res.ok) {
          eventsList = getStoredEvents()
        } else {
          let data: unknown = []
          try {
            data = await res.json()
          } catch {
            eventsList = getStoredEvents()
          }

          if (Array.isArray(data)) {
            eventsList = data as Event[]
          } else if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
            eventsList = data.results as Event[]
          } else if (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data)) {
            eventsList = data.data as Event[]
          } else {
            eventsList = getStoredEvents()
          }
        }

        const publicEvents = eventsList.filter(event => event.isPublic !== false)
        setEvents(publicEvents)

        const storedBookmarks = localStorage.getItem('bookmarkedEvents')
        if (storedBookmarks) {
          const arr: any[] = JSON.parse(storedBookmarks)
          setBookmarked(new Set(arr.map((v) => String(v))))
        }

        const email = await getAuthenticatedUserEmail()
        if (email) {
          try {
            const baseUrl = api.registrations().endsWith('/') ? api.registrations().slice(0, -1) : api.registrations()
            const regsUrl = `${baseUrl}/?email=${encodeURIComponent(email)}`
            const regsRes = await apiCall.get(regsUrl)
            if (regsRes.ok) {
              const regsData = await regsRes.json()
              const regs = Array.isArray(regsData) ? regsData : (regsData.results || regsData.data || [])
              const regEventIds = new Set<string>(regs.map((r: any) => String(r.event)))
              setRegisteredEvents(regEventIds)
            }
          } catch { }
        }
      } catch (err) {
        console.error('[Participant Events] Error fetching events:', err)
        const storedEvents = getStoredEvents()
        setEvents(storedEvents)

        const storedBookmarks = localStorage.getItem('bookmarkedEvents')
        if (storedBookmarks) {
          const arr: any[] = JSON.parse(storedBookmarks)
          setBookmarked(new Set(arr.map((v) => String(v))))
        }
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

  const getYearOfCourse = (event: Event): string => {
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
    now.setHours(0, 0, 0, 0)

    const upcoming: Event[] = []
    const past: Event[] = []

    filteredEvents.forEach(event => {
      const status = (event.status || '').toLowerCase()
      const isCompleted = status === 'completed' || status === 'concluded'

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

  // Group upcoming events by month
  const upcomingEventsByMonth = useMemo(() => {
    const grouped: Record<string, Event[]> = {}
    upcomingEvents.forEach(event => {
      const month = getMonth(event.date || '')
      if (!grouped[month]) {
        grouped[month] = []
      }
      grouped[month].push(event)
    })

    const monthOrder = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
      'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER']
    const sorted: Record<string, Event[]> = {}
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

  // Group past events by month (reverse chronological)
  const pastEventsByMonth = useMemo(() => {
    const grouped: Record<string, Event[]> = {}
    pastEvents.forEach(event => {
      const month = getMonth(event.date || '')
      if (!grouped[month]) {
        grouped[month] = []
      }
      grouped[month].push(event)
    })

    const monthOrder = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
      'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER']
    const sorted: Record<string, Event[]> = {}
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
        return dateB - dateA // Reverse order
      })
    })

    return sorted
  }, [pastEvents])

  const canAccessEvent = (eventCategory: string, eventDept?: string): boolean => {
    if (eventCategory === 'HCDC') return true
    if (!eventDept) return true

    const userDeptFull = userDepartment
    if (!userDeptFull) return false

    const userDeptAbbr = getDepartmentAbbr(userDeptFull)
    const eventDeptAbbr = getDepartmentAbbr(eventDept)

    return userDeptAbbr !== null && eventDeptAbbr !== null && userDeptAbbr === eventDeptAbbr
  }

  const toggleBookmark = (id: string | number) => {
    const sid = String(id)
    const newBookmarked = new Set(bookmarked)
    if (newBookmarked.has(sid)) {
      newBookmarked.delete(sid)
    } else {
      newBookmarked.add(sid)
    }
    setBookmarked(newBookmarked)
    localStorage.setItem('bookmarkedEvents', JSON.stringify(Array.from(newBookmarked)))
  }

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

  const handleJoinEvent = async (event: Event) => {
    const eventId = String(event.id)
    const access = canAccessEvent(event.category || 'HCDC', event.department)
    if (!access) {
      alert(`This event is restricted to ${event.department || 'a specific department'}.`)
      return
    }
    const userEmail = await getAuthenticatedUserEmail()
    if (!userEmail) {
      alert('Please sign in to join events.')
      router.push('/auth/signin')
      return
    }
    let firstName = 'Participant'
    let lastName = 'User'
    let affiliation = 'HCDC'
    try {
      const profileResponse = await apiRequest(authApi.me(), { method: 'GET' })
      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        if (profileData.authenticated && profileData.user) {
          const user = profileData.user
          if (user.name) {
            const nameParts = String(user.name).trim().split(' ')
            firstName = nameParts[0] || user.first_name || 'Participant'
            lastName = nameParts.slice(1).join(' ') || user.last_name || 'User'
          } else {
            firstName = user.first_name || 'Participant'
            lastName = user.last_name || 'User'
          }
          affiliation = user.program || user.department || 'HCDC'
        }
      }
    } catch { }
    try {
      const payload = {
        event: parseInt(eventId, 10),
        email: userEmail,
        first_name: firstName,
        last_name: lastName,
        affiliation,
      }
      const res = await apiCall.post(api.registrations(), payload)
      if (!res.ok) {
        setJoiningEventId(event.id)
        setShowJoinSuccess(true)
        setRegisteredEvents(prev => {
          const next = new Set<string>(prev)
          next.add(String(event.id))
          return next
        })
        return
      }
      setJoiningEventId(event.id)
      setShowJoinSuccess(true)
      setRegisteredEvents(prev => {
        const next = new Set<string>(prev)
        next.add(String(event.id))
        return next
      })
    } catch (err) {
      alert('Failed to join event. Please try again.')
    }
  }

  const handleUnregisterEvent = async (event: Event) => {
    const eventId = String(event.id)
    const userEmail = await getAuthenticatedUserEmail()
    if (!userEmail) {
      alert('Please sign in to manage registrations.')
      router.push('/auth/signin')
      return
    }
    try {
      const baseUrl = api.registrations().endsWith('/') ? api.registrations().slice(0, -1) : api.registrations()
      const regsUrl = `${baseUrl}/?event=${encodeURIComponent(eventId)}&email=${encodeURIComponent(userEmail)}`
      const regsRes = await apiCall.get(regsUrl)
      if (!regsRes.ok) {
        alert('Unable to load registration record.')
        return
      }
      const regsData = await regsRes.json()
      const regs = Array.isArray(regsData) ? regsData : (regsData.results || regsData.data || [])
      if (!regs || regs.length === 0) {
        alert('No registration found to revoke.')
        return
      }
      const regId = regs[0].id
      await apiCall.delete(api.registrationById(regId))
      setRegisteredEvents(prev => {
        const next = new Set<string>(prev)
        next.delete(String(event.id))
        return next
      })
      setUnregisterEventId(event.id)
      setShowUnregisterSuccess(true)
    } catch {
      alert('Failed to revoke registration. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50/50 dark:bg-neutral-950 p-6 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-6 h-6 text-red-500 dark:text-red-400" />
          <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">Discover Events</h1>
        </div>
        <p className="text-neutral-500 dark:text-neutral-400">Explore and register for upcoming academic and extracurricular activities.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Filters - Sticky */}
        <div className="lg:col-span-3 space-y-6 lg:sticky lg:top-6">
          {/* Search */}
          <Card className="p-4 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
              <Search className="w-4 h-4 text-red-500" />
              Search
            </h3>
            <div className="relative">
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-3 bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 focus:ring-red-500"
              />
            </div>
          </Card>

          {/* Filters */}
          <Card className="p-4 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                <Filter className="w-4 h-4 text-red-500" />
                Filters
              </h3>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 h-6 px-2">
                  Reset
                </Button>
              )}
            </div>

            {/* School Year */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">School Year</label>
              <select
                value={selectedSchoolYear}
                onChange={(e) => setSelectedSchoolYear(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
              >
                {availableSchoolYears.map((sy) => (
                  <option key={sy} value={sy}>{sy === 'ALL' ? 'All Years' : sy}</option>
                ))}
              </select>
            </div>

            {/* Semester */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Semester</label>
              <div className="space-y-1">
                {semesters.map((sem) => (
                  <button
                    key={sem}
                    onClick={() => setSelectedSemester(sem)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-all flex items-center gap-2
                      ${selectedSemester === sem ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 font-medium' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'}
                    `}
                  >
                    <div className={`w-2 h-2 rounded-full ${selectedSemester === sem ? 'bg-red-500' : 'bg-neutral-300 dark:bg-neutral-700'}`} />
                    {sem === 'ALL' ? 'All Semesters' : sem}
                  </button>
                ))}
              </div>
            </div>

            {/* Month */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Month</label>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedMonth('ALL')}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-all flex items-center gap-2
                    ${selectedMonth === 'ALL' ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 font-medium' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'}
                  `}
                >
                  <div className={`w-2 h-2 rounded-full ${selectedMonth === 'ALL' ? 'bg-red-500' : 'bg-neutral-300 dark:bg-neutral-700'}`} />
                  All Months
                </button>
                {isMonthsOpen && months.filter(m => m !== 'ALL').map((month) => (
                  <button
                    key={month}
                    onClick={() => setSelectedMonth(month)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-all ml-1
                      ${selectedMonth === month ? 'text-red-600 dark:text-red-400 font-medium' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'}
                    `}
                  >
                    {month}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-9 space-y-6">
          {/* Categories */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat
              const colors = cat !== 'ALL' && cat !== 'HCDC' ? CATEGORY_COLORS[cat] : null
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`
                    px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 border
                    ${isSelected
                      ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-lg scale-105'
                      : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:border-red-500 dark:hover:border-red-500 hover:text-red-500 dark:hover:text-red-500'}
                  `}
                >
                  {cat === 'HCDC' ? 'HCDC EVENTS' : cat}
                </button>
              )
            })}
          </div>

          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="w-full max-w-[400px] mb-6 bg-neutral-100 dark:bg-neutral-800/50 p-1 rounded-full border border-neutral-200 dark:border-neutral-800">
              <TabsTrigger
                value="upcoming"
                className="rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-900 data-[state=active]:text-red-600 dark:data-[state=active]:text-red-400 data-[state=active]:shadow-sm transition-all"
              >
                Upcoming ({upcomingEvents.length})
              </TabsTrigger>
              <TabsTrigger
                value="past"
                className="rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-900 data-[state=active]:text-red-600 dark:data-[state=active]:text-red-400 data-[state=active]:shadow-sm transition-all"
              >
                Past Events ({pastEvents.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              {Object.keys(upcomingEventsByMonth).length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-neutral-900/50 rounded-3xl border border-neutral-200 dark:border-neutral-800 border-dashed">
                  <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-neutral-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">No upcoming events found</h3>
                  <p className="text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto mt-2">
                    Try adjusting your search terms or filters to find what you're looking for.
                  </p>
                  <Button onClick={clearFilters} variant="outline" className="mt-6">
                    Clear all filters
                  </Button>
                </div>
              ) : (
                Object.entries(upcomingEventsByMonth).map(([month, monthEvents]) => (
                  <div key={month} className="space-y-4">
                    <div className="flex items-center gap-4">
                      <h2 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">{month}</h2>
                      <div className="h-px flex-1 bg-gradient-to-r from-neutral-200 dark:from-neutral-800 to-transparent" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {monthEvents.map((event, idx) => {
                        const eventCategory = getCategoryFromEvent(event)
                        const colors = CATEGORY_COLORS[eventCategory] || CATEGORY_COLORS['HCDC']
                        const hasAccess = canAccessEvent(event.category || 'HCDC', event.department)
                        const isRegistered = registeredEvents.has(String(event.id))

                        return (
                          <div
                            key={event.id}
                            className="group relative bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden hover:shadow-xl hover:shadow-red-500/10 hover:border-red-500/30 transition-all duration-300 flex flex-col h-full"
                          >
                            {/* Image */}
                            <div className="relative h-48 overflow-hidden cursor-pointer" onClick={() => router.push(`/participant/event/${event.id}`)}>
                              {(event.coverImage || event.cover_image) ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={event.coverImage || event.cover_image || ''}
                                  alt={event.name || event.title}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                              ) : (
                                <div className={`w-full h-full bg-gradient-to-br ${colors.gradient} opacity-20`} />
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                              <div className="absolute top-3 left-3 flex gap-2">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-lg backdrop-blur-md bg-black/30 border border-white/20`}>
                                  {eventCategory}
                                </span>
                              </div>

                              <button
                                onClick={(e) => { e.stopPropagation(); toggleBookmark(event.id) }}
                                className="absolute top-3 right-3 p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all"
                              >
                                <Bookmark className={`w-4 h-4 ${bookmarked.has(String(event.id)) ? 'fill-white' : ''}`} />
                              </button>
                            </div>

                            {/* Content */}
                            <div className="p-5 flex-1 flex flex-col">
                              <div className="mb-4 flex-1">
                                <h3
                                  className="text-lg font-bold text-neutral-900 dark:text-white line-clamp-2 mb-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors cursor-pointer"
                                  onClick={() => router.push(`/participant/event/${event.id}`)}
                                >
                                  {event.name || event.title || 'Untitled Event'}
                                </h3>

                                <div className="space-y-2">
                                  {event.date && (
                                    <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                                      <Calendar className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0" />
                                      <span>{new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                    </div>
                                  )}
                                  {(event.venue || event.location) && (
                                    <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                                      <MapPin className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0" />
                                      <span className="line-clamp-1">{event.venue || event.location}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Footer Actions */}
                              <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex gap-3">
                                {isRegistered ? (
                                  <>
                                    <Button className="flex-1 bg-green-500 hover:bg-green-600 text-white border-0" disabled>
                                      Registered
                                    </Button>
                                    <Button variant="outline" size="icon" onClick={() => handleUnregisterEvent(event)} className="border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-900/30 dark:hover:bg-red-900/20">
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    className={`flex-1 ${hasAccess ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-lg shadow-red-500/20' : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'}`}
                                    onClick={() => handleJoinEvent(event)}
                                    disabled={!hasAccess}
                                  >
                                    {hasAccess ? 'Join Event' : 'Restricted'}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              {Object.keys(pastEventsByMonth).length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-neutral-900/50 rounded-3xl border border-neutral-200 dark:border-neutral-800 border-dashed">
                  <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-neutral-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">No past events found</h3>
                </div>
              ) : (
                Object.entries(pastEventsByMonth).map(([month, monthEvents]) => (
                  <div key={month} className="space-y-4">
                    <div className="flex items-center gap-4">
                      <h2 className="text-2xl font-bold text-neutral-500 dark:text-neutral-500 tracking-tight">{month}</h2>
                      <div className="h-px flex-1 bg-gradient-to-r from-neutral-200 dark:from-neutral-800 to-transparent" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {monthEvents.map((event) => {
                        const eventCategory = getCategoryFromEvent(event)
                        const colors = CATEGORY_COLORS[eventCategory] || CATEGORY_COLORS['HCDC']

                        return (
                          <div
                            key={event.id}
                            className="group relative bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden hover:shadow-lg transition-all duration-300 opacity-75 hover:opacity-100 cursor-pointer"
                            onClick={() => router.push(`/participant/event/${event.id}`)}
                          >
                            <div className="relative h-48 overflow-hidden">
                              {(event.coverImage || event.cover_image) ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={event.coverImage || event.cover_image || ''}
                                  alt={event.name || event.title}
                                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                                />
                              ) : (
                                <div className="w-full h-full bg-neutral-200 dark:bg-neutral-800" />
                              )}
                              <div className="absolute top-2 right-2 bg-neutral-900/80 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase backdrop-blur-md">
                                Ended
                              </div>
                            </div>

                            <div className="p-5">
                              <h3 className="text-lg font-bold text-neutral-900 dark:text-white line-clamp-2 mb-2">
                                {event.name || event.title || 'Untitled Event'}
                              </h3>
                              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                {event.date && new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
