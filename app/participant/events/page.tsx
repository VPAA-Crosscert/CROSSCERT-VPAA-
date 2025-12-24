'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, MapPin, Calendar, Bookmark, X, Search } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { getStoredEvents, fetchUserDepartment } from '@/lib/event-context'
import { Event } from '@/lib/event-context'
import { api, apiCall } from '@/lib/api-config'

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
  const [selectedYear, setSelectedYear] = useState('ALL')
  const [bookmarked, setBookmarked] = useState<Set<number | string>>(new Set())
  const [events, setEvents] = useState<Event[]>([])
  const [userDepartment, setUserDepartment] = useState('')

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
          setBookmarked(new Set(JSON.parse(storedBookmarks)))
        }
      } catch (err) {
        console.error('[Participant Events] Error fetching events:', err)
        const storedEvents = getStoredEvents()
        setEvents(storedEvents)
        
        const storedBookmarks = localStorage.getItem('bookmarkedEvents')
        if (storedBookmarks) {
          setBookmarked(new Set(JSON.parse(storedBookmarks)))
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

  const availableYears = useMemo(() => {
    const years = new Set<string>()
    events.forEach((evt) => {
      const y = getYearOfCourse(evt)
      if (y && y.toUpperCase() !== 'ALL YEARS') years.add(y)
    })
    return ['ALL', ...Array.from(years)]
  }, [events])

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

      // Year filter
      if (selectedYear !== 'ALL') {
        const eventYear = getYearOfCourse(event)
        if (!eventYear || eventYear !== selectedYear) return false
      }
      
      return true
    })
  }, [events, searchTerm, selectedCategory, selectedSemester, selectedMonth, selectedYear])

  // Group events by month
  const eventsByMonth = useMemo(() => {
    const grouped: Record<string, Event[]> = {}
    filteredEvents.forEach(event => {
      const month = getMonth(event.date || '')
      if (!grouped[month]) {
        grouped[month] = []
      }
      grouped[month].push(event)
    })
    
    // Sort months chronologically
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
  }, [filteredEvents])

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
    const newBookmarked = new Set(bookmarked)
    if (newBookmarked.has(id)) {
      newBookmarked.delete(id)
    } else {
      newBookmarked.add(id)
    }
    setBookmarked(newBookmarked)
    localStorage.setItem('bookmarkedEvents', JSON.stringify(Array.from(newBookmarked)))
  }

  const clearFilters = () => {
    setSelectedCategory('ALL')
    setSelectedSemester('ALL')
    setSelectedMonth('ALL')
    setSelectedYear('ALL')
    setSearchTerm('')
  }

  const categories = ['ALL', 'HCDC', 'CCJE', 'CET', 'CHATME', 'HUSOCOM', 'COME', 'SBME', 'STE']
  const semesters = ['ALL', '1ST', '2ND', 'SUMMER']
  const months = ['ALL', 'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 
                  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER']

  const hasActiveFilters = selectedCategory !== 'ALL' || selectedSemester !== 'ALL' || 
                          selectedMonth !== 'ALL' || selectedYear !== 'ALL' || searchTerm !== ''

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <h1 className="text-3xl font-bold text-foreground">Discover Events</h1>
        <p className="text-muted-foreground mt-1">Find and register for upcoming events</p>
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

      {/* Year Filter */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground">Year of Course</label>
        <div className="flex gap-2 flex-wrap">
          {availableYears.map((year) => (
            <Button
              key={year}
              variant={selectedYear === year ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedYear(year)}
              className={selectedYear === year ? 'bg-secondary text-secondary-foreground' : 'border-border text-foreground'}
            >
              {year === 'ALL' ? 'All Years' : year}
            </Button>
          ))}
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
          {Object.keys(eventsByMonth).length === 0 ? (
            <Card className="p-12 border border-border bg-card text-center">
              <p className="text-muted-foreground">No events found matching your filters</p>
            </Card>
          ) : (
            Object.entries(eventsByMonth).map(([month, monthEvents]) => (
              <div key={month} className="space-y-4">
                <h2 className="text-xl font-bold text-foreground border-b border-border pb-2">
                  {month}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {monthEvents.map((event) => {
                    const eventCategory = getCategoryFromEvent(event)
                    const colors = CATEGORY_COLORS[eventCategory] || CATEGORY_COLORS['HCDC']
                    const hasAccess = canAccessEvent(event.category || 'HCDC', event.department)
                    const eventDate = event.date ? new Date(event.date) : null
                    const formattedDate = eventDate 
                      ? eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : 'TBA'
                    
                    const yearOfCourse = getYearOfCourse(event)
                    
                    return (
                      <Card
                        key={event.id}
                        className="overflow-hidden border border-border bg-card hover:shadow-lg transition-all cursor-pointer group"
                        onClick={() => router.push(`/participant/event/${event.id}`)}
                      >
                        <div className="p-4 space-y-3">
                          {/* Category Tag and Year */}
                          <div className="flex items-center justify-between">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}>
                              {eventCategory}
                            </span>
                            <span className="text-xs text-muted-foreground font-medium">
                              {yearOfCourse}
                            </span>
                          </div>

                          {/* Event Title */}
                          <h3 className="font-bold text-lg text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                            {event.name || event.title || 'Untitled Event'}
                          </h3>

                          {/* Date & Time */}
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

                          {/* Venue */}
                          {(event.venue || event.location) && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="w-4 h-4 shrink-0" />
                              <span className="line-clamp-1">{event.venue || event.location}</span>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                              className={`flex-1 ${hasAccess ? 'bg-secondary hover:bg-secondary/90 text-secondary-foreground' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                              onClick={() => router.push(`/participant/event/${event.id}`)}
                              disabled={!hasAccess}
                              size="sm"
                            >
                              {hasAccess ? 'Join Event' : 'Restricted'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleBookmark(event.id)}
                              title={bookmarked.has(event.id) ? 'Remove bookmark' : 'Bookmark event'}
                              className="shrink-0"
                            >
                              <Bookmark
                                className={`w-5 h-5 ${bookmarked.has(event.id) ? 'fill-primary text-primary' : ''}`}
                              />
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

        {/* Months Filter - Right Column (Desktop) */}
        <div className="lg:col-span-2 space-y-2 order-3 hidden lg:block">
          <label className="text-sm font-semibold text-foreground block">Months</label>
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
        </div>
      </div>

      {/* Months Filter - Mobile (Below Events) */}
      <div className="lg:hidden space-y-2">
        <label className="text-sm font-semibold text-foreground block">Filter by Month</label>
        <div className="flex gap-2 flex-wrap">
          {months.map((month) => (
            <button
              key={month}
              onClick={() => setSelectedMonth(month)}
              className={`
                px-4 py-2 rounded-full transition-all text-sm
                ${selectedMonth === month
                  ? 'bg-secondary text-secondary-foreground font-semibold'
                  : 'bg-muted text-foreground hover:bg-muted/80'}
              `}
            >
              {month}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
