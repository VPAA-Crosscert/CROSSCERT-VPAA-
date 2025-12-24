'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, MapPin, CalendarIcon, Clock, Users, Ruler, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { adminApi, apiRequest, authApi, apiCall } from '@/lib/api-config'

const COLLEGES = {
  'College of Criminal Justice Education': [
    'Bachelor of Science in Criminology',
  ],
  'College of Engineering and Technology': [
    'Bachelor of Science in Civil Engineering',
    'Bachelor of Science in Electrical Engineering',
    'Bachelor of Science in Mechanical Engineering',
    'Bachelor of Science in Electronics and Communication Engineering',
  ],
  'College of Hospitality & Tourism Management': [
    'Bachelor of Science in Hotel and Restaurant Management',
    'Bachelor of Science in Tourism Management',
  ],
  'College of Humanities, Social Sciences and Communication': [
    'Bachelor of Science in Psychology',
    'Bachelor of Science in Nursing',
    'Bachelor of Arts in English',
    'Bachelor of Science in Biology',
    'Bachelor of Science in Chemistry',
  ],
  'College of Maritime Education': ['Bachelor of Science in Marine Transportation (BSMT)'],
  'School of Teacher Education': [
    'Bachelor of Elementary Education',
    'Bachelor of Secondary Education',
    'Bachelor of Physical Education',
  ],
  'School of Business & Management': [
    'Bachelor of Science in Accountancy',
    'Bachelor of Science in Business Administration',
    'Bachelor of Science in Management Accounting',
  ],
}

const VENUES = [
  'HCDC Gymnasium',
  'Student Lounge',
  'Sedes Sapientiae',
  'Function Hall',
  'Cross Theatre',
]

const SEMESTERS = [
  'First Semester',
  'Second Semester',
  'Summer',
]

const SCHOOL_YEARS = [
  '2024-2025',
  '2025-2026',
  '2026-2027',
  '2027-2028',
]



interface Theme {
  id: number
  name: string
  color: string
  accent: string
  textColor?: string
  border?: string
  gradientFrom: string
}

const THEMES: Theme[] = [
  { id: 1, name: 'HCDC', color: 'bg-blue-900', accent: '#1e3a8a', textColor: 'text-blue-900', border: 'border-blue-900', gradientFrom: 'from-blue-900' },
  { id: 2, name: 'CCJE', color: 'bg-red-700', accent: '#b91c1c', textColor: 'text-red-700', border: 'border-red-700', gradientFrom: 'from-red-700' },
  { id: 3, name: 'CET', color: 'bg-orange-500', accent: '#f97316', textColor: 'text-orange-500', border: 'border-orange-500', gradientFrom: 'from-orange-500' },
  { id: 4, name: 'CHATME', color: 'bg-gray-500', accent: '#6b7280', textColor: 'text-gray-500', border: 'border-gray-500', gradientFrom: 'from-gray-500' },
  { id: 5, name: 'HUSOCOM', color: 'bg-fuchsia-700', accent: '#a21caf', textColor: 'text-fuchsia-700', border: 'border-fuchsia-700', gradientFrom: 'from-fuchsia-700' },
  { id: 6, name: 'COME', color: 'bg-sky-500', accent: '#0ea5e9', textColor: 'text-sky-500', border: 'border-sky-500', gradientFrom: 'from-sky-500' },
  { id: 7, name: 'SBME', color: 'bg-yellow-500', accent: '#eab308', textColor: 'text-yellow-600', border: 'border-yellow-500', gradientFrom: 'from-yellow-500' },
  { id: 8, name: 'STE', color: 'bg-blue-600', accent: '#2563eb', textColor: 'text-blue-600', border: 'border-blue-600', gradientFrom: 'from-blue-600' },
  { id: 9, name: 'Black', color: 'bg-black', accent: '#000000', textColor: 'text-black', border: 'border-black', gradientFrom: 'from-black' },
  { id: 11, name: 'White', color: 'bg-white', accent: '#ffffff', textColor: 'text-slate-900', border: 'border-slate-200', gradientFrom: 'from-slate-100' },
]

const COORDINATE_DEFAULTS = {
  name: { x: 561, y: 420 },
  eventTitle: { x: 561, y: 360 },
  date: { x: 561, y: 300 },
}

const CERTIFICATE_DIMENSION = { width: 1123, height: 794 }

const INITIAL_COORDINATES = {
  name: { ...COORDINATE_DEFAULTS.name },
  eventTitle: { ...COORDINATE_DEFAULTS.eventTitle },
  date: { ...COORDINATE_DEFAULTS.date },
}

export default function CreateEventPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Initialize CSRF token on component mount
  useEffect(() => {
    const initializeCsrf = async () => {
      try {
        await apiRequest(authApi.csrfToken(), {
          method: 'GET',
        })
      } catch (err) {
        console.error('Failed to initialize CSRF token:', err)
      }
    }

    initializeCsrf()
  }, [])

  // Event details
  const [eventName, setEventName] = useState('')
  const [eventDescription, setEventDescription] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [timezone, setTimezone] = useState('Asia/Manila')
  const [speakers, setSpeakers] = useState('')
  const [venue, setVenue] = useState('')
  const [eventCategory, setEventCategory] = useState('HCDC')
  const [departmentCategory, setDepartmentCategory] = useState('')
  const [semester, setSemester] = useState('')
  const [schoolYear, setSchoolYear] = useState('')

  // Event options
  const [hasCapacityLimit, setHasCapacityLimit] = useState(false)
  const [capacity, setCapacity] = useState('100')
  const [requireApproval, setRequireApproval] = useState(false)
  const [isPaidEvent, setIsPaidEvent] = useState(false)
  const [ticketPrice, setTicketPrice] = useState('0')
  const [isPublic, setIsPublic] = useState(true)
  const [selectedTheme, setSelectedTheme] = useState(1)
  const [cardStyle, setCardStyle] = useState<'standard' | 'poster'>('standard') // Helpful Feature: Card Layout
  const [usePattern, setUsePattern] = useState(false) // Surprise: Dot Pattern
  const [useFloat, setUseFloat] = useState(false) // Surprise: Float Animation
  const [useGlass, setUseGlass] = useState(false) // Surprise: Glassmorphism
  const [useNeon, setUseNeon] = useState(false) // Surprise: Neon Glow

  // Certificate data
  const [certificateTemplate, setCertificateTemplate] = useState('')
  const [certificateError, setCertificateError] = useState('')
  const [certificateCoordinates, setCertificateCoordinates] = useState(INITIAL_COORDINATES)
  const [sampleName, setSampleName] = useState('Juan Dela Cruz')
  const [sampleEventTitle, setSampleEventTitle] = useState('Sample Event Title')
  const [sampleDate, setSampleDate] = useState('January 01, 2025')

  // Drag & drop state for coordinate mapping
  const [draggingField, setDraggingField] = useState<keyof typeof INITIAL_COORDINATES | null>(null)
  const certificatePreviewRef = useRef<HTMLDivElement | null>(null)

  // Actual certificate image size (from uploaded template); used so
  // coordinates match the real PDF dimensions from the backend.
  const [certificateSize, setCertificateSize] = useState(CERTIFICATE_DIMENSION)

  const totalSteps = 6

  const isStep1Valid = eventName && eventDescription && eventDate && startTime && endTime && venue
  const isStep2Valid = !hasCapacityLimit || (hasCapacityLimit && Number(capacity) > 0)
  const isCertificateReady = Boolean(certificateTemplate)

  const activeTheme = useMemo(() => THEMES.find(t => t.id === selectedTheme) ?? THEMES[0], [selectedTheme])

  async function compressImageToBase64(
    file: File,
    opts?: { maxWidth?: number; maxHeight?: number; quality?: number },
  ): Promise<string> {
    const { maxWidth = 1200, maxHeight = 1200, quality = 0.7 } = opts || {}
    const bitmap = await createImageBitmap(file)
    const ratio = Math.min(maxWidth / bitmap.width, maxHeight / bitmap.height, 1)
    const targetW = Math.round(bitmap.width * ratio)
    const targetH = Math.round(bitmap.height * ratio)
    const canvas = document.createElement('canvas')
    canvas.width = targetW
    canvas.height = targetH
    const ctx = canvas.getContext('2d')
    if (!ctx) return ''
    ctx.drawImage(bitmap, 0, 0, targetW, targetH)
    const isPNG = file.type === 'image/png'
    const mime = isPNG ? 'image/png' : 'image/jpeg'
    return canvas.toDataURL(mime, mime === 'image/jpeg' ? quality : undefined)
  }

  async function readFileAsDataUrl(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  async function validateCertificateTemplate(dataUrl: string) {
    return new Promise<boolean>((resolve) => {
      const img = new Image()
      img.onload = () => {
        // Accept any landscape orientation (width > height)
        resolve(img.width > img.height)
      }
      img.onerror = () => resolve(false)
      img.src = dataUrl
    })
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const base64 = await compressImageToBase64(file)
    setCoverImage(base64)
  }

  const handleCertificateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const dataUrl = await readFileAsDataUrl(file)
    const isValid = await validateCertificateTemplate(dataUrl)
    if (!isValid) {
      setCertificateError('Template must be in landscape orientation (wider than tall)')
      return
    }
    setCertificateError('')
    setCertificateTemplate(dataUrl)

    // Detect actual image dimensions so coordinate system matches backend
    const img = new Image()
    img.onload = () => {
      setCertificateSize({
        width: img.width || CERTIFICATE_DIMENSION.width,
        height: img.height || CERTIFICATE_DIMENSION.height,
      })
    }
    img.src = dataUrl
  }

  const handleCoordinateChange = (field: keyof typeof INITIAL_COORDINATES, axis: 'x' | 'y', value: number) => {
    setCertificateCoordinates(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [axis]: value,
      },
    }))
  }

  // Handle drag start for overlay text
  const handleDragStart = (field: keyof typeof INITIAL_COORDINATES, e: React.MouseEvent<HTMLSpanElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDraggingField(field)
  }

  // Global mouse move / up listeners for dragging
  useEffect(() => {
    if (!draggingField) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!certificatePreviewRef.current) return
      const rect = certificatePreviewRef.current.getBoundingClientRect()

      // Clamp pointer inside the preview bounds
      const clampedX = Math.min(Math.max(e.clientX, rect.left), rect.right)
      const clampedY = Math.min(Math.max(e.clientY, rect.top), rect.bottom)

      const relX = clampedX - rect.left
      const relYFromTop = clampedY - rect.top

      // Convert from DOM coordinates (origin top-left) to certificate coordinates (origin bottom-left)
      const x = (relX / rect.width) * certificateSize.width
      const yFromBottom =
        certificateSize.height - (relYFromTop / rect.height) * certificateSize.height

      setCertificateCoordinates(prev => ({
        ...prev,
        [draggingField]: {
          ...prev[draggingField],
          x: Math.round(x),
          y: Math.round(yFromBottom),
        },
      }))
    }

    const handleMouseUp = () => {
      setDraggingField(null)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [draggingField, certificateSize.height, certificateSize.width])

  const handleCreateEvent = async () => {
    // Post event to backend API
    setIsLoading(true)
    setError('')
    try {
      const payload = {
        title: eventName,
        description: eventDescription,
        date: eventDate,
        start_time: startTime,
        end_time: endTime,
        location: venue,
        capacity: hasCapacityLimit ? Number(capacity) : 1000,
        status: 'scheduled',
        speakers: speakers ? speakers.split(',').map(s => s.trim()).filter(Boolean) : [],
        timezone,
        category: eventCategory === 'outside' ? 'outside' : eventCategory,
        department: departmentCategory,
        semester,
        school_year: schoolYear,
        theme: activeTheme.name,
        cover_image: coverImage,
        is_public: isPublic,
        require_approval: requireApproval,
        is_paid_event: isPaidEvent,
        ticket_price: isPaidEvent ? Number(ticketPrice || 0) : 0,
        certificate_template_image: certificateTemplate,
        certificate_coordinates: {
          name: certificateCoordinates.name,
          event_title: certificateCoordinates.eventTitle,
          date: certificateCoordinates.date,
        },
        certificate_sample_text: {
          name: sampleName,
          event_title: sampleEventTitle || eventName,
          date: sampleDate || eventDate,
        },
      }

      // Post to backend API (ensure trailing slash for Django REST Framework)
      const eventsUrl = adminApi.events().endsWith('/') ? adminApi.events() : `${adminApi.events()}/`
      console.log('[Create Event] Posting to:', eventsUrl, payload)

      const response = await apiCall.post(eventsUrl, payload)

      console.log('[Create Event] Response status:', response.status, response.statusText)

      if (!response.ok) {
        let errorMessage = `Failed to create event: ${response.status} ${response.statusText}`
        try {
          const errorData = await response.json()
          console.error('[Create Event] Error response:', errorData)
          errorMessage = errorData.error || errorData.detail || errorMessage
          // Handle validation errors
          if (errorData.title || errorData.date || errorData.start_time) {
            const validationErrors = Object.entries(errorData)
              .filter(([key]) => key !== 'error' && key !== 'detail')
              .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
              .join('; ')
            if (validationErrors) {
              errorMessage = `Validation errors: ${validationErrors}`
            }
          }
        } catch {
          // If JSON parsing fails, use status text
        }
        throw new Error(errorMessage)
      }

      const createdEvent = await response.json()
      console.log('[Create Event] Success! Created event:', createdEvent)
      console.log('[Create Event] Event ID:', createdEvent.id)
      console.log('[Create Event] Event title:', createdEvent.title)
      console.log('[Create Event] Full response:', JSON.stringify(createdEvent, null, 2))

      setIsLoading(false)

      // Redirect to the event detail page using the ID from the API response
      if (createdEvent.id) {
        console.log('[Create Event] Redirecting to event detail page:', `/admin/events/${createdEvent.id}`)
        router.push(`/admin/events/${createdEvent.id}`)
      } else {
        console.warn('[Create Event] No ID in response, redirecting to events list')
        router.push('/admin/events')
      }
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Unable to create event right now.')
      setIsLoading(false)
    }
  }

  const renderStepIndicator = () => (
    <div className="flex gap-4 flex-wrap">
      {Array.from({ length: totalSteps }).map((_, index) => {
        const step = index + 1
        const isActive = step === currentStep
        const isCompleted = step < currentStep
        return (
          <div key={step} className="flex items-center gap-2">
            <button
              onClick={() => setCurrentStep(step)}
              disabled={step > currentStep + 1}
              className={`w-10 h-10 rounded-full font-semibold flex items-center justify-center transition-colors ${isActive || isCompleted
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
            >
              {step}
            </button>
            {step < totalSteps && <div className={`h-1 w-10 ${isCompleted ? 'bg-primary' : 'bg-muted'}`} />}
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <h1 className="text-3xl font-bold text-foreground">Create New Event</h1>
        <p className="text-muted-foreground">Complete every step to publish your event with a custom certificate.</p>
      </div>

      {renderStepIndicator()}

      {error && (
        <div className="p-4 rounded-md border border-destructive bg-destructive/10 text-sm text-destructive">
          {error}
        </div>
      )}

      {currentStep === 1 && (
        <Card className="p-8 border border-border bg-card space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Step 1 · Event Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label>Event Name *</Label>
                <Input value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="CROSS BLAZERS CUP" />
              </div>
              <div>
                <Label>Description *</Label>
                <Textarea
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  placeholder="Describe your event..."
                  className="min-h-32"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date *</Label>
                  <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
                </div>
                <div>
                  <Label>Timezone</Label>
                  <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Time *</Label>
                  <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </div>
                <div>
                  <Label>End Time *</Label>
                  <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Speakers</Label>
                <Input value={speakers} onChange={(e) => setSpeakers(e.target.value)} placeholder="John Doe, Jane Smith" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Semester</Label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-md border border-border bg-background text-foreground"
                  >
                    <option value="">Select Semester</option>
                    {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <Label>School Year</Label>
                  <select
                    value={schoolYear}
                    onChange={(e) => setSchoolYear(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-md border border-border bg-background text-foreground"
                  >
                    <option value="">Select School Year</option>
                    {SCHOOL_YEARS.map(sy => <option key={sy} value={sy}>{sy}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <Label>Event Category</Label>
                <select
                  value={eventCategory}
                  onChange={(e) => {
                    setEventCategory(e.target.value)
                    if (e.target.value === 'outside') {
                      setDepartmentCategory('Outside Event')
                    }
                  }}
                  className="w-full mt-1 px-3 py-2 rounded-md border border-border bg-background text-foreground"
                >
                  <option value="HCDC">HCDC-Wide Event</option>
                  <option value="department">Departmental Event</option>
                  <option value="outside">Outside Event</option>
                </select>
              </div>
              {eventCategory === 'department' && (
                <div>
                  <Label>College / School</Label>
                  <select
                    value={departmentCategory}
                    onChange={(e) => setDepartmentCategory(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-md border border-border bg-background text-foreground"
                  >
                    <option value="">Select a college or school</option>
                    {Object.keys(COLLEGES).map((college) => (
                      <option key={college} value={college}>
                        {college}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <Label>Venue *</Label>
                <div className="flex gap-2">
                  <Input
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="HCDC Gymnasium"
                    list="venue-suggestions"
                  />
                  <datalist id="venue-suggestions">
                    {VENUES.map(v => <option key={v} value={v} />)}
                  </datalist>
                  <Button variant="outline" size="icon">
                    <MapPin className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label>Cover Image</Label>
                <div className="mt-1 border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <input type="file" accept="image/*" id="cover-upload" className="hidden" onChange={handleCoverUpload} />
                  <label htmlFor="cover-upload" className="cursor-pointer flex flex-col items-center gap-2 text-sm">
                    {coverImage ? (
                      <img src={coverImage} alt="Cover" className="w-full rounded-lg object-cover h-40" />
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-muted-foreground" />
                        Upload header image
                      </>
                    )}
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button disabled={!isStep1Valid} onClick={() => setCurrentStep(2)}>
              Continue
            </Button>
          </div>
        </Card>
      )}

      {currentStep === 2 && (
        <Card className="p-8 border border-border bg-card space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Step 2 · Event Options</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-semibold">Limit Capacity</p>
                <p className="text-sm text-muted-foreground">Restrict number of participants</p>
              </div>
              <Button
                variant="outline"
                onClick={() => setHasCapacityLimit(prev => !prev)}
                className={hasCapacityLimit ? 'bg-primary text-primary-foreground' : ''}
              >
                {hasCapacityLimit ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
            {hasCapacityLimit && (
              <div>
                <Label>Maximum Capacity</Label>
                <Input type="number" value={capacity} min={1} onChange={(e) => setCapacity(e.target.value)} />
              </div>
            )}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-semibold">Require Approval</p>
                <p className="text-sm text-muted-foreground">Approve registrations manually</p>
              </div>
              <Button
                variant="outline"
                onClick={() => setRequireApproval(prev => !prev)}
                className={requireApproval ? 'bg-primary text-primary-foreground' : ''}
              >
                {requireApproval ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-semibold">Paid Event</p>
                <p className="text-sm text-muted-foreground">Charge a ticket price</p>
              </div>
              <Button
                variant="outline"
                onClick={() => setIsPaidEvent(prev => !prev)}
                className={isPaidEvent ? 'bg-primary text-primary-foreground' : ''}
              >
                {isPaidEvent ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
            {isPaidEvent && (
              <div>
                <Label>Ticket Price (PHP)</Label>
                <Input type="number" min={0} max={1000} value={ticketPrice} onChange={(e) => setTicketPrice(e.target.value)} />
                <p className="text-xs text-muted-foreground mt-1">Maximum price allowed is ₱1,000</p>
              </div>
            )}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-semibold">Public Event</p>
                <p className="text-sm text-muted-foreground">Visible on Discover page</p>
              </div>
              <Button
                variant="outline"
                onClick={() => setIsPublic(prev => !prev)}
                className={isPublic ? 'bg-primary text-primary-foreground' : ''}
              >
                {isPublic ? 'Public' : 'Private'}
              </Button>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setCurrentStep(1)}>
              Back
            </Button>
            <Button disabled={!isStep2Valid} onClick={() => setCurrentStep(3)}>
              Continue
            </Button>
          </div>
        </Card>
      )}

      {currentStep === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-6 border border-border bg-card">
              <h2 className="text-2xl font-bold text-foreground mb-2">Step 3 · Choose Theme</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Select a color theme and style for your event card.
              </p>

              <div className="grid grid-cols-5 gap-3 mb-6">
                {THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme.id)}
                    className={`relative w-full aspect-square rounded-full transition-all flex items-center justify-center group outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary ${selectedTheme === theme.id
                      ? 'ring-2 ring-offset-2 ring-primary scale-110'
                      : 'hover:scale-105 opacity-80 hover:opacity-100'
                      }`}
                    title={theme.name}
                  >
                    <div className={`w-full h-full rounded-full shadow-sm ${theme.color} ${theme.id === 11 ? 'border border-slate-300 dark:border-slate-600' : ''}`} />
                    {selectedTheme === theme.id && (
                      <div className={`absolute inset-0 flex items-center justify-center drop-shadow-md ${theme.id === 11 ? 'text-slate-900' : 'text-white'}`}>
                        <Eye className="w-4 h-4" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Helpful Feature: Card Style Switcher */}
              <div className="space-y-4">
                <div className="bg-muted p-1 rounded-lg grid grid-cols-2 gap-1">
                  <button
                    onClick={() => setCardStyle('standard')}
                    className={`py-1.5 text-sm font-medium rounded-md transition-all ${cardStyle === 'standard' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Standard Card
                  </button>
                  <button
                    onClick={() => setCardStyle('poster')}
                    className={`py-1.5 text-sm font-medium rounded-md transition-all ${cardStyle === 'poster' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Poster Mode
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setUsePattern(!usePattern)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${usePattern ? 'bg-primary/5 border-primary text-primary' : 'bg-card border-border hover:bg-muted/50'}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <div className="w-4 h-4 bg-current rounded-full opacity-20" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '4px 4px' }} />
                    </div>
                    <span className="text-xs font-medium">Texture</span>
                  </button>

                  <button
                    onClick={() => setUseFloat(!useFloat)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${useFloat ? 'bg-primary/5 border-primary text-primary' : 'bg-card border-border hover:bg-muted/50'}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-current rounded-md animate-pulse" />
                    </div>
                    <span className="text-xs font-medium">Float</span>
                  </button>

                  <button
                    onClick={() => setUseGlass(!useGlass)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${useGlass ? 'bg-primary/5 border-primary text-primary' : 'bg-card border-border hover:bg-muted/50'}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-current opacity-10 backdrop-blur-sm" />
                      <div className="w-full h-full border border-current opacity-20 rounded-full" />
                    </div>
                    <span className="text-xs font-medium">Glass</span>
                  </button>

                  <button
                    onClick={() => setUseNeon(!useNeon)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${useNeon ? 'bg-primary/5 border-primary text-primary' : 'bg-card border-border hover:bg-muted/50'}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shadow-lg shadow-current">
                      <div className="w-3 h-3 bg-current rounded-full" />
                    </div>
                    <span className="text-xs font-medium">Neon</span>
                  </button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mt-4 text-center">
                Selected: <span className="font-semibold text-foreground">{activeTheme.name}</span>
              </p>

              <div className="flex justify-between gap-3 mt-8">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  Back
                </Button>
                <Button onClick={() => setCurrentStep(4)}>
                  Continue
                </Button>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <div className="sticky top-6">
              <h3 className="text-lg font-semibold mb-4 text-muted-foreground">Live Preview</h3>

              {/* Event Card Preview */}
              <Card
                className={`overflow-hidden bg-card shadow-lg mx-auto transition-all duration-1000 border-t-8 ${activeTheme.border || 'border-transparent'} ${useFloat ? 'animate-pulse' : ''} ${cardStyle === 'poster' ? 'max-w-[320px] h-[500px] flex flex-col relative' : 'max-w-md'}`}
                style={{
                  boxShadow: useNeon ? `0 0 25px ${activeTheme.accent}60` : undefined,
                  transform: useFloat ? 'translateY(-5px)' : 'none'
                }}
              >
                {/* Banner Image */}
                <div className={`relative group overflow-hidden ${cardStyle === 'poster' ? 'absolute inset-0 h-full' : 'h-48 bg-muted'}`}>
                  {/* Pattern Overlay Surprise */}
                  {usePattern && (
                    <div className="absolute inset-0 z-10 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '16px 16px', color: activeTheme.id === 11 ? '#000' : '#fff' }} />
                  )}

                  {coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={coverImage}
                      alt="Event Cover"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center bg-muted relative`}>
                      <Upload className={`w-12 h-12 ${activeTheme.textColor || 'text-muted-foreground'} opacity-50 relative z-20`} />
                    </div>
                  )}

                  {/* Poster Mode Overlay */}
                  {cardStyle === 'poster' && (
                    <div className={`absolute inset-0 bg-gradient-to-t ${activeTheme.id === 11 ? 'from-white via-white/50' : 'from-black/95 via-black/50'} to-transparent pointer-events-none`} />
                  )}

                  {/* Date Badge - Themed */}
                  <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-md shadow-md text-center min-w-[60px] z-20 ${activeTheme.color} ${activeTheme.id === 11 ? 'text-slate-900 border border-slate-200' : 'text-white'}`}>
                    <span className="block text-xs uppercase font-bold opacity-90">
                      {eventDate ? new Date(eventDate).toLocaleString('default', { month: 'short' }).toUpperCase() : 'DEC'}
                    </span>
                    <span className="block text-xl font-bold leading-none">
                      {eventDate ? new Date(eventDate).getDate() : '25'}
                    </span>
                  </div>

                  {/* Category Badge - Themed */}
                  <div className="absolute top-4 right-4 z-20">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium shadow-sm bg-background/90 backdrop-blur-md ${activeTheme.textColor || 'text-foreground'}`}>
                      {eventCategory === 'HCDC' ? 'HCDC Wide' : eventCategory === 'department' ? 'Department' : 'Public'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className={`p-6 relative transition-all ${cardStyle === 'poster' ? 'mt-auto z-20' : ''} ${useGlass ? 'bg-white/30 backdrop-blur-xl border border-white/20 shadow-lg' : activeTheme.id === 11 && cardStyle !== 'poster' ? 'bg-white' : ''}`}>
                  <h3 className={`text-xl font-bold line-clamp-2 mb-3 ${cardStyle === 'poster' ? (activeTheme.id === 11 ? 'text-slate-900' : 'text-white') : activeTheme.textColor || 'text-foreground'}`}>
                    {eventName || 'Annual Cross Blazers Cup 2024'}
                  </h3>

                  <div className="space-y-3 mb-6">
                    <div className={`flex items-center gap-3 text-sm ${cardStyle === 'poster' ? (activeTheme.id === 11 ? 'text-slate-700' : 'text-white/80') : 'text-muted-foreground'}`}>
                      <Clock className={`w-4 h-4 ${cardStyle === 'poster' ? (activeTheme.id === 11 ? 'text-slate-900' : 'text-white/80') : activeTheme.textColor || 'text-primary'}`} />
                      <span>
                        {startTime && endTime ? `${startTime} - ${endTime}` : '8:00 AM - 5:00 PM'}
                      </span>
                    </div>
                    <div className={`flex items-center gap-3 text-sm ${cardStyle === 'poster' ? (activeTheme.id === 11 ? 'text-slate-700' : 'text-white/80') : 'text-muted-foreground'}`}>
                      <MapPin className={`w-4 h-4 ${cardStyle === 'poster' ? (activeTheme.id === 11 ? 'text-slate-900' : 'text-white/80') : activeTheme.textColor || 'text-primary'}`} />
                      <span>{venue || 'HCDC Gymnasium'}</span>
                    </div>
                  </div>

                  {/* Action Area */}
                  <div className={`flex items-center justify-between pt-4 border-t ${cardStyle === 'poster' ? (activeTheme.id === 11 ? 'border-slate-200' : 'border-white/20') : activeTheme.border ? activeTheme.border.replace('border-', 'border-').replace('500', '200').replace('600', '200').replace('700', '200').replace('900', '200') : 'border-border'}`}>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${cardStyle === 'poster' ? (activeTheme.id === 11 ? 'text-slate-600' : 'text-white/70') : 'text-muted-foreground'}`}>Tickets starting at</span>
                      <span className={`font-bold ${cardStyle === 'poster' ? (activeTheme.id === 11 ? 'text-slate-900' : 'text-white') : activeTheme.textColor || 'text-foreground'}`}>
                        {isPaidEvent ? `₱${Number(ticketPrice).toLocaleString()}` : 'Free'}
                      </span>
                    </div>
                    <Button
                      className={`${activeTheme.color} ${activeTheme.id === 11 ? 'text-slate-900 border border-slate-200 hover:bg-slate-50' : 'text-white hover:opacity-90'} transition-opacity shadow-sm pointer-events-none`}
                    >
                      Register
                    </Button>
                  </div>
                </div>
              </Card>

              <div className="mt-8 flex justify-center gap-8">
                {/* Mobile Preview Mockup */}
                <div className="w-16 h-2 rounded-full bg-border mx-auto mb-2" />
              </div>
            </div>
          </div>
        </div>
      )}

      {currentStep === 4 && (
        <Card className="p-8 border border-border bg-card space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Step 4 · Upload Certificate Template</h2>
          <p className="text-sm text-muted-foreground">
            Upload a landscape-oriented certificate template (PNG or JPG). Any size is supported as long as it's wider than it is tall.
          </p>
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
            <input type="file" accept="image/png,image/jpeg" id="certificate-upload" className="hidden" onChange={handleCertificateUpload} />
            <label htmlFor="certificate-upload" className="flex flex-col items-center gap-3 cursor-pointer">
              <Upload className="w-6 h-6 text-muted-foreground" />
              <span className="text-sm">{certificateTemplate ? 'Replace template' : 'Upload certificate template'}</span>
              <span className="text-xs text-muted-foreground">
                {certificateTemplate
                  ? `Detected size: ${certificateSize.width} x ${certificateSize.height} px`
                  : 'Any landscape size is supported; coordinates will match the image size.'}
              </span>
            </label>
          </div>
          {certificateError && <p className="text-sm text-destructive">{certificateError}</p>}
          {certificateTemplate && (
            <img src={certificateTemplate} alt="Certificate template" className="w-full rounded-lg border border-border" />
          )}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setCurrentStep(3)}>
              Back
            </Button>
            <Button disabled={!isCertificateReady} onClick={() => setCurrentStep(5)}>
              Continue
            </Button>
          </div>
        </Card>
      )}

      {currentStep === 5 && (
        <Card className="p-8 border border-border bg-card space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Step 4 · Coordinate Mapping</h2>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Ruler className="w-4 h-4" />
            Drag the text directly on the certificate preview, or fine-tune with the X/Y inputs.
          </p>
          {/* Visual drag-and-drop preview */}
          <div
            ref={certificatePreviewRef}
            className="relative border border-border rounded-lg overflow-hidden bg-muted"
            style={{ paddingBottom: '70%' }}
          >
            {certificateTemplate ? (
              <>
                {/* Template image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={certificateTemplate}
                  alt="Certificate template"
                  className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
                />
                {/* Draggable text overlays */}
                <div className="absolute inset-0">
                  <span
                    className="absolute text-2xl font-bold text-primary uppercase tracking-wide cursor-move select-none"
                    style={{
                      left: `${(certificateCoordinates.name.x / certificateSize.width) * 100}%`,
                      bottom: `${(certificateCoordinates.name.y / certificateSize.height) * 100}%`,
                      transform: 'translate(-50%, 50%)',
                    }}
                    onMouseDown={(e) => handleDragStart('name', e)}
                  >
                    {sampleName}
                  </span>
                  <span
                    className="absolute text-lg font-semibold text-foreground cursor-move select-none"
                    style={{
                      left: `${(certificateCoordinates.eventTitle.x / certificateSize.width) * 100}%`,
                      bottom: `${(certificateCoordinates.eventTitle.y / certificateSize.height) * 100}%`,
                      transform: 'translate(-50%, 50%)',
                    }}
                    onMouseDown={(e) => handleDragStart('eventTitle', e)}
                  >
                    {sampleEventTitle || eventName}
                  </span>
                  <span
                    className="absolute text-base text-foreground cursor-move select-none"
                    style={{
                      left: `${(certificateCoordinates.date.x / certificateSize.width) * 100}%`,
                      bottom: `${(certificateCoordinates.date.y / certificateSize.height) * 100}%`,
                      transform: 'translate(-50%, 50%)',
                    }}
                    onMouseDown={(e) => handleDragStart('date', e)}
                  >
                    {sampleDate || eventDate}
                  </span>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                Upload a certificate template in Step 3 to position the text overlays.
              </div>
            )}
          </div>

          {/* Optional fine-tuning inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'Participant Name', key: 'name' as const },
              { label: 'Event Title', key: 'eventTitle' as const },
              { label: 'Event Date', key: 'date' as const },
            ].map(({ label, key }) => (
              <div key={key} className="space-y-3 border border-border rounded-lg p-4">
                <p className="font-semibold text-sm">{label}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs uppercase text-muted-foreground">X</Label>
                    <Input
                      type="number"
                      value={certificateCoordinates[key].x}
                      onChange={(e) => handleCoordinateChange(key, 'x', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs uppercase text-muted-foreground">Y</Label>
                    <Input
                      type="number"
                      value={certificateCoordinates[key].y}
                      onChange={(e) => handleCoordinateChange(key, 'y', Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Sample Name</Label>
              <Input value={sampleName} onChange={(e) => setSampleName(e.target.value)} />
            </div>
            <div>
              <Label>Sample Event Title</Label>
              <Input value={sampleEventTitle} onChange={(e) => setSampleEventTitle(e.target.value)} />
            </div>
            <div>
              <Label>Sample Date</Label>
              <Input value={sampleDate} onChange={(e) => setSampleDate(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setCurrentStep(4)}>
              Back
            </Button>
            <Button onClick={() => setCurrentStep(6)}>
              Review & Publish
            </Button>
          </div>
        </Card>
      )}

      {currentStep === 6 && (
        <Card className="p-8 border border-border bg-card space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Step 6 · Review & Publish</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Event Name</p>
                <p className="font-semibold text-foreground">{eventName || 'Event Name'}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Venue</p>
                <p className="font-semibold text-foreground">{venue || 'Venue'}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Date & Time</p>
                <p className="font-semibold text-foreground">
                  {eventDate || 'Date'} • {startTime || '00:00'} - {endTime || '00:00'}
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Capacity</p>
                <p className="font-semibold text-foreground">
                  {hasCapacityLimit ? `${capacity} seats` : 'Unlimited'}
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Event Card Theme</p>
                <p className="font-semibold text-foreground">{activeTheme.name}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Event Card Preview</p>
              {/* Event Card Preview */}
              <Card
                className={`overflow-hidden bg-card shadow-lg mx-auto border-t-8 ${activeTheme.border || 'border-transparent'} ${useFloat ? 'animate-pulse' : ''} ${cardStyle === 'poster' ? 'max-w-[320px] h-[500px] flex flex-col relative' : 'max-w-md'}`}
                style={{
                  boxShadow: useNeon ? `0 0 25px ${activeTheme.accent}60` : undefined,
                  transform: useFloat ? 'translateY(-5px)' : 'none'
                }}
              >
                {/* Banner Image */}
                <div className={`relative group overflow-hidden ${cardStyle === 'poster' ? 'absolute inset-0 h-full' : 'h-48 bg-muted'}`}>
                  {/* Pattern Overlay Surprise */}
                  {usePattern && (
                    <div className="absolute inset-0 z-10 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '16px 16px', color: activeTheme.id === 11 ? '#000' : '#fff' }} />
                  )}

                  {coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={coverImage}
                      alt="Event Cover"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center bg-muted relative`}>
                      <Upload className={`w-12 h-12 ${activeTheme.textColor || 'text-muted-foreground'} opacity-50 relative z-20`} />
                    </div>
                  )}

                  {/* Poster Mode Overlay */}
                  {cardStyle === 'poster' && (
                    <div className={`absolute inset-0 bg-gradient-to-t ${activeTheme.id === 11 ? 'from-white via-white/50' : 'from-black/95 via-black/50'} to-transparent pointer-events-none`} />
                  )}

                  {/* Date Badge - Themed */}
                  <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-md shadow-md text-center min-w-[60px] z-20 ${activeTheme.color} ${activeTheme.id === 11 ? 'text-slate-900 border border-slate-200' : 'text-white'}`}>
                    <span className="block text-xs uppercase font-bold opacity-90">
                      {eventDate ? new Date(eventDate).toLocaleString('default', { month: 'short' }).toUpperCase() : 'DEC'}
                    </span>
                    <span className="block text-xl font-bold leading-none">
                      {eventDate ? new Date(eventDate).getDate() : '25'}
                    </span>
                  </div>

                  {/* Category Badge - Themed */}
                  <div className="absolute top-4 right-4 z-20">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium shadow-sm bg-background/90 backdrop-blur-md ${activeTheme.textColor || 'text-foreground'}`}>
                      {eventCategory === 'HCDC' ? 'HCDC Wide' : eventCategory === 'department' ? 'Department' : 'Public'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className={`p-6 relative transition-all ${cardStyle === 'poster' ? 'mt-auto z-20' : ''} ${useGlass ? 'bg-white/30 backdrop-blur-xl border border-white/20 shadow-lg' : activeTheme.id === 11 && cardStyle !== 'poster' ? 'bg-white' : ''}`}>
                  <h3 className={`text-xl font-bold line-clamp-2 mb-3 ${cardStyle === 'poster' ? (activeTheme.id === 11 ? 'text-slate-900' : 'text-white') : activeTheme.textColor || 'text-foreground'}`}>
                    {eventName || 'Annual Cross Blazers Cup 2024'}
                  </h3>

                  <div className="space-y-3 mb-6">
                    <div className={`flex items-center gap-3 text-sm ${cardStyle === 'poster' ? (activeTheme.id === 11 ? 'text-slate-700' : 'text-white/80') : 'text-muted-foreground'}`}>
                      <Clock className={`w-4 h-4 ${cardStyle === 'poster' ? (activeTheme.id === 11 ? 'text-slate-900' : 'text-white/80') : activeTheme.textColor || 'text-primary'}`} />
                      <span>
                        {startTime && endTime ? `${startTime} - ${endTime}` : '8:00 AM - 5:00 PM'}
                      </span>
                    </div>
                    <div className={`flex items-center gap-3 text-sm ${cardStyle === 'poster' ? (activeTheme.id === 11 ? 'text-slate-700' : 'text-white/80') : 'text-muted-foreground'}`}>
                      <MapPin className={`w-4 h-4 ${cardStyle === 'poster' ? (activeTheme.id === 11 ? 'text-slate-900' : 'text-white/80') : activeTheme.textColor || 'text-primary'}`} />
                      <span>{venue || 'HCDC Gymnasium'}</span>
                    </div>
                  </div>

                  {/* Action Area */}
                  <div className={`flex items-center justify-between pt-4 border-t ${cardStyle === 'poster' ? (activeTheme.id === 11 ? 'border-slate-200' : 'border-white/20') : activeTheme.border ? activeTheme.border.replace('border-', 'border-').replace('500', '200').replace('600', '200').replace('700', '200').replace('900', '200') : 'border-border'}`}>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${cardStyle === 'poster' ? (activeTheme.id === 11 ? 'text-slate-600' : 'text-white/70') : 'text-muted-foreground'}`}>Tickets starting at</span>
                      <span className={`font-bold ${cardStyle === 'poster' ? (activeTheme.id === 11 ? 'text-slate-900' : 'text-white') : activeTheme.textColor || 'text-foreground'}`}>
                        {isPaidEvent ? `₱${Number(ticketPrice).toLocaleString()}` : 'Free'}
                      </span>
                    </div>
                    <Button
                      className={`${activeTheme.color} ${activeTheme.id === 11 ? 'text-slate-900 border border-slate-200 hover:bg-slate-50' : 'text-white hover:opacity-90'} transition-opacity shadow-sm pointer-events-none`}
                    >
                      Register
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Certificate Preview</p>
          <div className="relative border border-border rounded-lg overflow-hidden" style={{ paddingBottom: '70%' }}>
            {certificateTemplate ? (
              <>
                <img src={certificateTemplate} alt="Certificate template" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 pointer-events-none">
                  <span
                    className="absolute text-2xl font-bold text-primary uppercase tracking-wide"
                    style={{
                      left: `${(certificateCoordinates.name.x / certificateSize.width) * 100}%`,
                      bottom: `${(certificateCoordinates.name.y / certificateSize.height) * 100}%`,
                      transform: 'translate(-50%, 50%)',
                    }}
                  >
                    {sampleName}
                  </span>
                  <span
                    className="absolute text-lg font-semibold text-foreground"
                    style={{
                      left: `${(certificateCoordinates.eventTitle.x / certificateSize.width) * 100}%`,
                      bottom: `${(certificateCoordinates.eventTitle.y / certificateSize.height) * 100}%`,
                      transform: 'translate(-50%, 50%)',
                    }}
                  >
                    {sampleEventTitle || eventName}
                  </span>
                  <span
                    className="absolute text-base text-foreground"
                    style={{
                      left: `${(certificateCoordinates.date.x / certificateSize.width) * 100}%`,
                      bottom: `${(certificateCoordinates.date.y / certificateSize.height) * 100}%`,
                      transform: 'translate(-50%, 50%)',
                    }}
                  >
                    {sampleDate || eventDate}
                  </span>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                Upload a certificate template to preview.
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>• Certificates are stored as base64 in Django</span>
            <span>• pinay.py watermark is applied automatically</span>
            <span>• Coordinates are required for name, title, and date</span>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setCurrentStep(5)} disabled={isLoading}>
              Back
            </Button>
            <Button onClick={handleCreateEvent} disabled={isLoading || !certificateTemplate} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {isLoading ? 'Creating Event...' : 'Create Event'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}

