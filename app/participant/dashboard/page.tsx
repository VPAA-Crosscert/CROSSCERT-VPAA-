'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, Award, Clock, Zap } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getStoredEvents } from '@/lib/event-context'
import { api, apiCall, getAuthenticatedUserEmail } from '@/lib/api-config'

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
  is_public?: boolean
  isPublic?: boolean
}

export default function ParticipantDashboard() {
  const router = useRouter()
  const [upcomingEvents, setUpcomingEvents] = useState<DashboardEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    eventsJoined: 0,
    pendingEvaluations: 0,
    certificatesEarned: 0,
  })

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Fetch from API first (prioritize backend data)
        const eventsUrl = api.events().endsWith('/') ? api.events() : `${api.events()}/`
        console.log('[Participant Dashboard] Fetching events from:', eventsUrl)
        const res = await apiCall.get(eventsUrl)

        console.log('[Participant Dashboard] Response status:', res.status, res.statusText)

        let eventsList: DashboardEvent[] = []

        if (!res.ok) {
          console.warn('[Participant Dashboard] Unable to load events from API. Status:', res.status, res.statusText)
          // Fallback to localStorage if API fails
          const storedEvents = getStoredEvents()
          eventsList = storedEvents as DashboardEvent[]
          console.log('[Participant Dashboard] Using localStorage fallback, events count:', eventsList.length)
        } else {
          let data: unknown = []
          try {
            data = await res.json()
            console.log('[Participant Dashboard] Raw API response:', data)
          } catch {
            console.error('[Participant Dashboard] Events API did not return JSON.')
            const storedEvents = getStoredEvents()
            eventsList = storedEvents as DashboardEvent[]
          }

          // Handle paginated response from Django REST Framework
          if (Array.isArray(data)) {
            eventsList = data as DashboardEvent[]
            console.log('[Participant Dashboard] Direct array response, events count:', eventsList.length)
          } else if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
            eventsList = data.results as DashboardEvent[]
            console.log('[Participant Dashboard] Paginated response (results), events count:', eventsList.length)
          } else if (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data)) {
            eventsList = data.data as DashboardEvent[]
            console.log('[Participant Dashboard] Paginated response (data), events count:', eventsList.length)
          } else {
            console.warn('[Participant Dashboard] Unknown response format, falling back to localStorage')
            const storedEvents = getStoredEvents()
            eventsList = storedEvents as DashboardEvent[]
          }
        }

        // Filter for public events and upcoming events
        const now = new Date()
        console.log('[Participant Dashboard] Current date/time:', now.toISOString())
        console.log('[Participant Dashboard] Total events before filtering:', eventsList.length)

        const publicUpcomingEvents = eventsList
          .filter(event => event.isPublic !== false) // Match events page logic
          .filter(event => {
            if (!event.date) {
              console.log(`[Participant Dashboard] Event ${event.id} has no date, including it`)
              return true // Include events without dates
            }
            const eventDate = new Date(event.date)
            const isUpcoming = eventDate >= now
            console.log(`[Participant Dashboard] Event ${event.id} date: ${eventDate.toISOString()}, isUpcoming: ${isUpcoming}`)
            return isUpcoming // Only upcoming or today's events
          })
          .sort((a, b) => {
            const dateA = a.date ? new Date(a.date).getTime() : 0
            const dateB = b.date ? new Date(b.date).getTime() : 0
            return dateA - dateB // Earliest first
          })

        console.log('[Participant Dashboard] Upcoming public events after filtering:', publicUpcomingEvents.length)
        console.log('[Participant Dashboard] Event IDs:', publicUpcomingEvents.map(e => ({ id: e.id, title: e.title || e.name, date: e.date })))

        const top3Events = publicUpcomingEvents.slice(0, 3)
        console.log('[Participant Dashboard] Top 3 events to display:', top3Events.length)
        setUpcomingEvents(top3Events)

        // Fetch user stats
        const userEmail = await getAuthenticatedUserEmail()
        if (userEmail) {
          try {
            // Fetch registrations
            const baseUrl = api.registrations().endsWith('/')
              ? api.registrations().slice(0, -1)
              : api.registrations()
            const regsUrl = `${baseUrl}/?email=${encodeURIComponent(userEmail)}`
            const regsRes = await apiCall.get(regsUrl)

            if (regsRes.ok) {
              const regsData = await regsRes.json()
              const registrations = Array.isArray(regsData)
                ? regsData
                : (regsData.results || regsData.data || [])

              const eventsJoined = registrations.length
              const pendingEvaluations = registrations.filter((reg: any) =>
                reg.is_present && !reg.has_evaluated
              ).length

              // Fetch certificates
              const certsUrl = api.certificates().endsWith('/')
                ? api.certificates()
                : `${api.certificates()}/`
              const certsRes = await apiCall.get(`${certsUrl}?email=${encodeURIComponent(userEmail)}`)

              let certificatesEarned = 0
              if (certsRes.ok) {
                const certsData = await certsRes.json()
                const certificates = Array.isArray(certsData)
                  ? certsData
                  : (certsData.results || certsData.data || [])
                certificatesEarned = certificates.length
              }

              setStats({
                eventsJoined,
                pendingEvaluations,
                certificatesEarned,
              })
            }
          } catch (err) {
            console.error('[Participant Dashboard] Error fetching stats:', err)
          }
        }
      } catch (err) {
        console.error('[Participant Dashboard] Error fetching events:', err)
        // Fallback to localStorage on error
        const storedEvents = getStoredEvents()
        setUpcomingEvents(storedEvents.slice(0, 3) as DashboardEvent[])
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  const statsData = [
    {
      label: 'Upcoming Events',
      value: upcomingEvents.length.toString(),
      icon: Clock,
      color: 'text-blue-500',
    },
    {
      label: 'Events Joined',
      value: stats.eventsJoined.toString(),
      icon: Calendar,
      color: 'text-purple-500',
    },
    {
      label: 'Pending Evaluations',
      value: stats.pendingEvaluations.toString(),
      icon: Zap,
      color: 'text-orange-500',
    },
    {
      label: 'Certificates Earned',
      value: stats.certificatesEarned.toString(),
      icon: Award,
      color: 'text-green-500',
    },
  ]

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome Back!</h1>
          <p className="text-muted-foreground mt-1">Here's your activity summary</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((stat) => {
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
            className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
            onClick={() => router.push('/participant/events')}
          >
            Browse Events
          </Button>
          <Button
            variant="outline"
            className="border-border text-foreground"
            onClick={() => router.push('/participant/my-events')}
          >
            My Events
          </Button>
          <Button
            variant="outline"
            className="border-border text-foreground"
            onClick={() => router.push('/participant/certificates')}
          >
            My Certificates
          </Button>
        </div>
      </Card>

      {/* Upcoming Events */}
      <Card className="p-6 border border-border bg-card">
        <h2 className="text-xl font-semibold text-foreground mb-4">Upcoming Events</h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading events...</p>
        ) : upcomingEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingEvents.map((event) => {
              const isEventEnded = (event.date && new Date(event.date) < new Date() && new Date(event.date).getDate() !== new Date().getDate()) || (event as any).status === 'completed'

              return (
                <div key={event.id} className="border border-border rounded-lg overflow-hidden bg-background hover:shadow-sm transition-shadow cursor-pointer relative" onClick={() => router.push(`/participant/event/${event.id}`)}>
                  {(event.coverImage || event.cover_image) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={event.coverImage || event.cover_image || ''} alt={event.name || event.title || 'Event cover'} className="w-full h-36 object-cover" />
                  ) : (
                    <div className="w-full h-36 bg-gradient-to-br from-secondary/20 to-primary/20" />
                  )}
                  {isEventEnded && (
                    <div className="absolute top-2 right-2 bg-destructive/90 text-destructive-foreground text-[10px] font-bold px-2 py-1 rounded-full shadow-sm backdrop-blur-sm">
                      EVENT ENDED
                    </div>
                  )}
                  <div className="p-4 space-y-2">
                    <h3 className="text-lg font-semibold text-foreground line-clamp-1">{event.name || event.title || 'Untitled Event'}</h3>
                    <div className="text-sm text-muted-foreground space-y-1">
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
                          <span>{event.venue || event.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No upcoming events yet</p>
        )}
      </Card>
    </div>
  )
}
