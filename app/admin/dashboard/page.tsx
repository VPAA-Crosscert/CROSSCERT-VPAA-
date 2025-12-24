'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Users, CheckCircle, Award, Clock, MapPin } from 'lucide-react'
import { getStoredEvents } from '@/lib/event-context'
import { useState, useEffect } from 'react'
import { adminApi, apiCall } from '@/lib/api-config'

type DashboardEvent = {
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
  participants?: number
  attended?: number
  attended_count?: number
  certificates?: number
  registration_count?: number
}

export default function AdminDashboard() {
  const router = useRouter()
  const [events, setEvents] = useState<DashboardEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalParticipants: 0,
    attendedToday: 0,
    certificatesIssued: 0,
  })

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventsUrl = adminApi.events().endsWith('/') ? adminApi.events() : `${adminApi.events()}/`
        console.log('[Dashboard] Fetching events from:', eventsUrl)
        const res = await apiCall.get(eventsUrl)

        console.log('[Dashboard] Response status:', res.status, res.statusText)

        let eventsList: DashboardEvent[] = []

        if (!res.ok) {
          console.warn('[Dashboard] Unable to load events from API. Status:', res.status, res.statusText)
          const storedEvents = getStoredEvents()
          eventsList = storedEvents as DashboardEvent[]
          console.log('[Dashboard] Using localStorage fallback, events count:', eventsList.length)
        } else {
          let data: unknown = []
          try {
            data = await res.json()
            console.log('[Dashboard] Raw API response:', data)
          } catch {
            console.error('[Dashboard] Events API did not return JSON.')
            const storedEvents = getStoredEvents()
            eventsList = storedEvents as DashboardEvent[]
          }

          if (Array.isArray(data)) {
            eventsList = data as DashboardEvent[]
            console.log('[Dashboard] Direct array response, events count:', eventsList.length)
          } else if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
            eventsList = data.results as DashboardEvent[]
            console.log('[Dashboard] Paginated response (results), events count:', eventsList.length)
          } else if (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data)) {
            eventsList = data.data as DashboardEvent[]
            console.log('[Dashboard] Paginated response (data), events count:', eventsList.length)
          } else {
            console.warn('[Dashboard] Unknown response format, falling back to localStorage')
            const storedEvents = getStoredEvents()
            eventsList = storedEvents as DashboardEvent[]
          }
        }

        console.log('[Dashboard] Final events list:', eventsList)
        console.log('[Dashboard] Event IDs:', eventsList.map(e => ({ id: e.id, title: e.title || e.name })))

        // Filter for upcoming events (today onward) and sort ascending by date
        const now = new Date()
        now.setHours(0, 0, 0, 0)

        const upcomingEvents = eventsList.filter(event => {
          if (!event.date) return false // Skip if no date
          const eventDate = new Date(event.date)
          // Handle string dates properly
          const eventDateMidnight = new Date(eventDate)
          eventDateMidnight.setHours(0, 0, 0, 0)

          const status = ((event as any).status || '').toLowerCase()
          const isCompleted = status === 'completed' || status === 'concluded'

          // Include today's events, exclude completed/concluded events
          return eventDateMidnight >= now && !isCompleted
        })

        const sortedUpcoming = upcomingEvents.sort((a, b) => {
          const dateA = a.date ? new Date(a.date).getTime() : 0
          const dateB = b.date ? new Date(b.date).getTime() : 0
          return dateA - dateB // Ascending order (earliest first)
        })

        setEvents(sortedUpcoming.slice(0, 6)) // Show top 6 upcoming

        const totalParticipants = eventsList.reduce((sum, event) => {
          return sum + (event.participants || event.registration_count || 0)
        }, 0)

        // Calculate attendedToday more robustly
        // Use the explicit attended_count from deserializer if available
        const attendedToday = eventsList.reduce((sum, event) => {
          // If we have an explicit attended count from backend (new field), use it
          if (event.attended_count !== undefined) return sum + event.attended_count
          if (event.attended && event.attended > 0) return sum + event.attended

          return sum + (event.attended || 0)
        }, 0)

        const certificatesIssued = eventsList.reduce((sum, event) => sum + (event.certificates || 0), 0)

        setStats({
          totalEvents: eventsList.length,
          totalParticipants,
          attendedToday,
          certificatesIssued,
        })
      } catch (err) {
        console.error('[Dashboard] Error fetching events:', err)
        const storedEvents = getStoredEvents()
        const eventsList = storedEvents as DashboardEvent[]
        setEvents(eventsList.slice(0, 5))

        const totalParticipants = eventsList.reduce((sum, event) => sum + (event.participants || 0), 0)
        const attendedToday = eventsList.reduce((sum, event) => sum + (event.attended || 0), 0)
        const certificatesIssued = eventsList.reduce((sum, event) => sum + (event.certificates || 0), 0)

        setStats({
          totalEvents: eventsList.length,
          totalParticipants,
          attendedToday,
          certificatesIssued,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  const statsArray = [
    {
      label: 'Total Events',
      value: stats.totalEvents.toString(),
      icon: Calendar,
      color: 'text-blue-500',
    },
    {
      label: 'Total Participants',
      value: stats.totalParticipants.toString(),
      icon: Users,
      color: 'text-purple-500',
    },
    {
      label: 'Attended Today',
      value: stats.attendedToday.toString(),
      icon: CheckCircle,
      color: 'text-green-500',
    },
    {
      label: 'Certificates Issued',
      value: stats.certificatesIssued.toString(),
      icon: Award,
      color: 'text-red-500',
    },
  ]

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome to your admin panel</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsArray.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="p-6 border border-border bg-card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold text-foreground mt-2">{stat.value}</p>
                </div>
                <Icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <Card className="p-6 border border-border bg-card">
        <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => router.push('/admin/events/create')}
          >
            Create New Event
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/admin/events')}
          >
            Manage Events
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/admin/participants')}
          >
            View Participants
          </Button>
        </div>
      </Card>

      {/* Upcoming Events */}
      <Card className="p-6 border border-border bg-card">
        <h2 className="text-xl font-semibold text-foreground mb-4">Upcoming Events</h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading events...</p>
        ) : events.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event) => {
              const isEventEnded = (event.date && new Date(event.date) < new Date() && new Date(event.date).getDate() !== new Date().getDate()) || (event as any).status === 'completed'

              return (
                <Card
                  key={event.id}
                  className="overflow-hidden border border-border bg-background hover:shadow-lg transition-all cursor-pointer group relative"
                  onClick={() => router.push(`/admin/events/${event.id}`)}
                >
                  {(event.coverImage || event.cover_image) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={event.coverImage || event.cover_image || ''}
                      alt={event.name || event.title || 'Event cover'}
                      className="w-full h-40 object-cover"
                    />
                  ) : (
                    <div className="w-full h-40 bg-gradient-to-br from-secondary/20 to-primary/20" />
                  )}
                  {isEventEnded && (
                    <div className="absolute top-2 right-2 bg-destructive/90 text-destructive-foreground text-[10px] font-bold px-2 py-1 rounded-full shadow-sm backdrop-blur-sm">
                      EVENT ENDED
                    </div>
                  )}
                  <div className="p-4 space-y-3">
                    <h3 className="text-lg font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                      {event.name || event.title || 'Untitled Event'}
                    </h3>
                    <div className="text-sm text-muted-foreground space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 shrink-0" />
                        <span>{event.date || 'TBA'}</span>
                      </div>
                      {(event.startTime || event.start_time) && (event.endTime || event.end_time) && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 shrink-0" />
                          <span>{event.startTime || event.start_time} - {event.endTime || event.end_time}</span>
                        </div>
                      )}
                      {(event.venue || event.location) && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 shrink-0" />
                          <span className="line-clamp-1">{event.venue || event.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No upcoming events scheduled</p>
            <Button
              variant="link"
              onClick={() => router.push('/admin/events/create')}
              className="mt-2 text-primary"
            >
              Create an event
            </Button>
          </div>
        )}
      </Card >
    </div >
  )
}
