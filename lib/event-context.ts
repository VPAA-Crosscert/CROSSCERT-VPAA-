export interface Event {
  id: number | string
  name?: string  // Frontend property
  title?: string // Backend property (maps to name)
  description: string
  date: string
  startTime?: string
  start_time?: string // Backend property
  endTime?: string
  end_time?: string // Backend property
  timezone: string
  speakers: string
  venue?: string
  location?: string // Backend property (maps to venue)
  coverImage?: string
  cover_image?: string // Backend property
  capacity?: number | string
  requireApproval?: boolean
  isPaidEvent?: boolean
  ticketPrice?: number
  is_paid_event?: boolean // Backend property
  ticket_price?: number // Backend property
  isPublic?: boolean
  is_public?: boolean // Backend property
  theme?: string | number
  participants?: number
  attended?: number
  evaluated?: number
  certificates?: number
  createdAt?: string
  category?: string
  department?: string
  status?: 'Upcoming' | 'Ongoing' | 'Completed' | 'draft' | 'scheduled' | 'live' | 'completed'
  code_prefix?: string // Backend property for event code prefix
  registration_count?: number
  attended_count?: number
  semester?: string
  school_year?: string
}

export interface RegistrationStatus {
  eventId: string | number
  status: 'registered' | 'checked-in' | 'checked-out' | 'evaluated' | 'none'
}

export const getStoredEvents = (): Event[] => {
  if (typeof window === 'undefined') return []
  // Prefer the new key used by the admin local-create flow, fall back to legacy 'events'
  const storedNew = localStorage.getItem('crosscert_local_events')
  if (storedNew) return JSON.parse(storedNew)
  const stored = localStorage.getItem('events')
  return stored ? JSON.parse(stored) : []
}

export const getEventById = (id: string | number): Event | null => {
  const events = getStoredEvents()
  return events.find(e => e.id === id || e.id === parseInt(id as string)) || null
}

// Cache for user department to avoid repeated API calls
let userDepartmentCache: string | null = null
let userDepartmentCacheTime: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export const getDepartmentFromUser = (): string => {
  if (typeof window === 'undefined') return ''

  // Return cached value if still valid
  if (userDepartmentCache && Date.now() - userDepartmentCacheTime < CACHE_DURATION) {
    return userDepartmentCache
  }

  // Try to fetch from API (async, but return empty for now)
  // Components should use fetchUserDepartment() instead
  return ''
}

export const fetchUserDepartment = async (): Promise<string> => {
  if (typeof window === 'undefined') return ''

  // Return cached value if still valid
  if (userDepartmentCache && Date.now() - userDepartmentCacheTime < CACHE_DURATION) {
    return userDepartmentCache
  }

  try {
    const { authApi, apiRequest } = await import('@/lib/api-config')
    const response = await apiRequest(authApi.me(), {
      method: 'GET',
    })

    if (response.ok) {
      const data = await response.json()
      if (data.authenticated && data.user && data.user.department) {
        userDepartmentCache = data.user.department
        userDepartmentCacheTime = Date.now()
        return data.user.department
      }
    }
  } catch (err) {
    console.error('[event-context] Error fetching user department:', err)
  }

  return ''
}

export const clearUserDepartmentCache = (): void => {
  userDepartmentCache = null
  userDepartmentCacheTime = 0
}

export const getRegistrationStatus = (eventId: string | number): RegistrationStatus['status'] => {
  if (typeof window === 'undefined') return 'none'
  const registrations = localStorage.getItem('registrations')
  if (registrations) {
    const reg = JSON.parse(registrations)
    return reg[eventId] || 'none'
  }
  return 'none'
}

export const updateRegistrationStatus = (eventId: string | number, status: RegistrationStatus['status']) => {
  if (typeof window === 'undefined') return
  const registrations = JSON.parse(localStorage.getItem('registrations') || '{}')
  registrations[eventId] = status
  localStorage.setItem('registrations', JSON.stringify(registrations))
}

/**
 * Helper to determine if an event is physically ongoing based on the current time.
 */
export const isEventLive = (event: Event): boolean => {
  if (!event) return false

  // Explicit status override
  if (event.status?.toLowerCase() === 'live') return true
  if (event.status?.toLowerCase() === 'completed' || event.status?.toLowerCase() === 'concluded' || event.status?.toLowerCase() === 'paused') return false

  try {
    // Parse YYYY-MM-DD safely to avoid timezone shifts
    const [y, m, d] = String(event.date).split('-').map(Number)
    if (isNaN(y) || isNaN(m) || isNaN(d)) return false

    const startTimeStr = event.start_time || event.startTime || '00:00'
    const endTimeStr = event.end_time || event.endTime || '23:59'

    const now = new Date()

    const startDate = new Date()
    startDate.setFullYear(y, m - 1, d)
    const [startH, startM] = startTimeStr.split(':').map(Number)
    startDate.setHours(startH || 0, startM || 0, 0, 0)

    const endDate = new Date()
    endDate.setFullYear(y, m - 1, d)
    const [endH, endM] = endTimeStr.split(':').map(Number)
    endDate.setHours(endH || 23, endM || 59, 59, 999)

    return now >= startDate && now <= endDate
  } catch (e) {
    return false
  }
}

/**
 * Helper to determine if an event has physically ended.
 */
export const isEventEnded = (event: Event): boolean => {
  if (!event) return false

  if (event.status?.toLowerCase() === 'completed' || event.status?.toLowerCase() === 'concluded') return true

  try {
    const [y, m, d] = String(event.date).split('-').map(Number)
    if (isNaN(y) || isNaN(m) || isNaN(d)) return false

    const endTimeStr = event.end_time || event.endTime || '23:59'
    const now = new Date()

    const endDate = new Date()
    endDate.setFullYear(y, m - 1, d)
    const [endH, endM] = endTimeStr.split(':').map(Number)
    endDate.setHours(endH || 23, endM || 59, 59, 999)

    return now > endDate
  } catch (e) {
    return false
  }
}
