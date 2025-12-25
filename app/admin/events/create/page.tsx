'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog'
import { ArrowLeft, Upload, MapPin, CalendarIcon, Clock, Users, Ruler, Eye, Palette, Edit, Globe, Lock, Ticket, CheckCircle, UserCheck, Building2, Tag, BookOpen, GraduationCap, FileText, Maximize2 } from 'lucide-react'



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

const PREMADE_CERTIFICATES = [
  { name: 'HCDC-Wide', path: '/certificate templates/MAIN CERTIFICATE.png', department: 'HCDC-Wide Events' },
  { name: 'CCJE', path: '/certificate templates/CCJE.png', department: 'College of Criminal Justice Education' },
  { name: 'CET', path: '/certificate templates/CET.png', department: 'College of Engineering and Technology' },
  { name: 'CHATME', path: '/certificate templates/CHATME.png', department: 'College of Hospitality & Tourism Management' },
  { name: 'HUSOCOM', path: '/certificate templates/HUSOCOM.png', department: 'College of Humanities, Social Sciences and Communication' },
  { name: 'COME', path: '/certificate templates/COME.png', department: 'College of Maritime Education' },
  { name: 'SBME', path: '/certificate templates/SBME.png', department: 'School of Business & Management' },
  { name: 'STE', path: '/certificate templates/STE.png', department: 'School of Teacher Education' },
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
  const [selectedPremadeTemplate, setSelectedPremadeTemplate] = useState('')
  const [certificateError, setCertificateError] = useState('')
  const [certificateCoordinates, setCertificateCoordinates] = useState(INITIAL_COORDINATES)
  const [sampleName, setSampleName] = useState('Juan Dela Cruz')
  const [sampleEventTitle, setSampleEventTitle] = useState('Sample Event Title')
  const [sampleDate, setSampleDate] = useState('January 01, 2025')

  // Font customization
  const [nameFontSize, setNameFontSize] = useState(24)
  const [eventTitleFontSize, setEventTitleFontSize] = useState(18)
  const [dateFontSize, setDateFontSize] = useState(16)
  const [nameFontColor, setNameFontColor] = useState('#000000')
  const [eventTitleFontColor, setEventTitleFontColor] = useState('#000000')
  const [dateFontColor, setDateFontColor] = useState('#000000')

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
    setSelectedPremadeTemplate('') // Clear premade selection when uploading custom
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

  const handlePremadeTemplateSelect = async (templatePath: string) => {
    setSelectedPremadeTemplate(templatePath)
    setCertificateError('')

    // Load the premade template image
    const response = await fetch(templatePath)
    const blob = await response.blob()
    const dataUrl = await readFileAsDataUrl(new File([blob], 'template.png', { type: 'image/png' }))
    setCertificateTemplate(dataUrl)

    // Detect actual image dimensions
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
        certificate_font_styles: {
          name: { size: nameFontSize, color: nameFontColor },
          event_title: { size: eventTitleFontSize, color: eventTitleFontColor },
          date: { size: dateFontSize, color: dateFontColor },
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
          const text = await response.text()
          try {
            const errorData = JSON.parse(text)
            console.error('[Create Event] Error response JSON:', errorData)
            errorMessage = errorData.error || errorData.detail || errorMessage

            // Handle specific validation errors
            if (Object.keys(errorData).length > 0 && !errorData.error && !errorData.detail) {
              const validationErrors = Object.entries(errorData)
                .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                .join('; ')
              if (validationErrors) {
                errorMessage = `Validation errors: ${validationErrors}`
              }
            }
          } catch (e) {
            console.error('[Create Event] Error response Text:', text)
            if (text && text.length < 500) {
              errorMessage = `Server Error: ${text}`
            } else {
              errorMessage = `Server Error: ${response.status} ${response.statusText}`
            }
          }
        } catch {
          // If reading text fails
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
        <div className="space-y-6">
          {/* Enhanced Header */}
          <Card className="p-6 border border-border bg-gradient-to-br from-card to-card/50">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <CalendarIcon className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-foreground mb-2">Step 1 · Event Details</h2>
                <p className="text-sm text-muted-foreground">
                  Fill in the essential information about your event. Fields marked with * are required.
                </p>
              </div>
            </div>
          </Card>

          {/* Form Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Details */}
            <Card className="lg:col-span-2 p-6 border border-border bg-card space-y-6">
              <div className="space-y-5">
                {/* Event Name */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <span className="text-destructive">*</span>
                    Event Name
                  </Label>
                  <Input
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="e.g., CROSS BLAZERS CUP 2025"
                    className="text-base"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <span className="text-destructive">*</span>
                    Description
                  </Label>
                  <Textarea
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    placeholder="Describe your event, its purpose, and what participants can expect..."
                    className="min-h-32 resize-none"
                  />
                  <p className="text-xs text-muted-foreground">{eventDescription.length} characters</p>
                </div>

                {/* Date & Time Section */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Date & Time
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm flex items-center gap-2">
                        <span className="text-destructive">*</span>
                        Event Date
                      </Label>
                      <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Timezone</Label>
                      <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm flex items-center gap-2">
                        <span className="text-destructive">*</span>
                        Start Time
                      </Label>
                      <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm flex items-center gap-2">
                        <span className="text-destructive">*</span>
                        End Time
                      </Label>
                      <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* Location Section */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    Location
                  </h3>
                  <div className="space-y-2">
                    <Label className="text-sm flex items-center gap-2">
                      <span className="text-destructive">*</span>
                      Venue
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={venue}
                        onChange={(e) => setVenue(e.target.value)}
                        placeholder="e.g., HCDC Gymnasium"
                        list="venue-suggestions"
                        className="flex-1"
                      />
                      <datalist id="venue-suggestions">
                        {VENUES.map(v => <option key={v} value={v} />)}
                      </datalist>
                      <Button variant="outline" size="icon" type="button">
                        <MapPin className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Additional Details Section */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    Additional Details
                  </h3>
                  <div className="space-y-2">
                    <Label className="text-sm">Speakers (Optional)</Label>
                    <Input
                      value={speakers}
                      onChange={(e) => setSpeakers(e.target.value)}
                      placeholder="Separate names with commas: John Doe, Jane Smith"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Semester</Label>
                      <select
                        value={semester}
                        onChange={(e) => setSemester(e.target.value)}
                        className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Select Semester</option>
                        {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">School Year</Label>
                      <select
                        value={schoolYear}
                        onChange={(e) => setSchoolYear(e.target.value)}
                        className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Select School Year</option>
                        {SCHOOL_YEARS.map(sy => <option key={sy} value={sy}>{sy}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Event Category Section */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <h3 className="text-sm font-semibold text-foreground">Event Category</h3>
                  <div className="space-y-2">
                    <Label className="text-sm">Category Type</Label>
                    <select
                      value={eventCategory}
                      onChange={(e) => {
                        setEventCategory(e.target.value)
                        if (e.target.value === 'outside') {
                          setDepartmentCategory('Outside Event')
                        }
                      }}
                      className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="HCDC">HCDC-Wide Event</option>
                      <option value="department">Departmental Event</option>
                      <option value="outside">Outside Event</option>
                    </select>
                  </div>
                  {eventCategory === 'department' && (
                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                      <Label className="text-sm">College / School</Label>
                      <select
                        value={departmentCategory}
                        onChange={(e) => setDepartmentCategory(e.target.value)}
                        className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
              </div>
            </Card>

            {/* Right Column - Cover Image */}
            <Card className="p-6 border border-border bg-card space-y-4 h-fit sticky top-6">
              <div>
                <h3 className="text-lg font-bold text-foreground mb-1">Cover Image</h3>
                <p className="text-xs text-muted-foreground">
                  Upload an eye-catching image for your event
                </p>
              </div>

              <div className={`relative border-2 border-dashed rounded-xl overflow-hidden transition-all duration-300 ${coverImage ? 'border-primary' : 'border-border hover:border-primary/50'
                }`}>
                <input
                  type="file"
                  accept="image/*"
                  id="cover-upload"
                  className="hidden"
                  onChange={handleCoverUpload}
                />
                <label htmlFor="cover-upload" className="cursor-pointer block">
                  {coverImage ? (
                    <div className="relative group">
                      <img src={coverImage} alt="Cover" className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="text-center space-y-2">
                          <Upload className="w-8 h-8 text-white mx-auto" />
                          <p className="text-white text-sm font-semibold">Change Image</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 px-6 hover:bg-muted/30 transition-colors">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
                        <Upload className="w-8 h-8 text-primary" />
                      </div>
                      <p className="text-sm font-semibold text-foreground mb-1">Upload Image</p>
                      <p className="text-xs text-muted-foreground text-center">
                        Click to browse or drag and drop
                      </p>
                    </div>
                  )}
                </label>
              </div>

              <div className="space-y-2 pt-2 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recommendations</p>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    16:9 aspect ratio
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Minimum 1200×675 pixels
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    JPG or PNG format
                  </li>
                </ul>
              </div>
            </Card>
          </div>

          {/* Navigation */}
          <Card className="p-6 border border-border bg-card">
            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={() => router.back()} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Cancel
              </Button>
              <Button disabled={!isStep1Valid} onClick={() => setCurrentStep(2)} className="gap-2 min-w-[140px]">
                Continue
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </Button>
            </div>
          </Card>
        </div>
      )}

      {currentStep === 2 && (
        <div className="space-y-6">
          {/* Enhanced Header */}
          <Card className="p-6 border border-border bg-gradient-to-br from-card to-card/50">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-foreground mb-2">Step 2 · Event Options</h2>
                <p className="text-sm text-muted-foreground">
                  Configure registration settings and access control for your event.
                </p>
              </div>
            </div>
          </Card>

          {/* Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Capacity Limit */}
            <Card className="p-6 border border-border bg-card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-foreground">Limit Capacity</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Restrict the number of participants</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setHasCapacityLimit(prev => !prev)}
                  className={`transition-all ${hasCapacityLimit ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}`}
                >
                  {hasCapacityLimit ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
              {hasCapacityLimit && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                  <Label className="text-sm">Maximum Capacity</Label>
                  <Input type="number" value={capacity} min={1} onChange={(e) => setCapacity(e.target.value)} placeholder="100" />
                </div>
              )}
            </Card>

            {/* Require Approval */}
            <Card className="p-6 border border-border bg-card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-foreground">Require Approval</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Manually approve each registration</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRequireApproval(prev => !prev)}
                  className={`transition-all ${requireApproval ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}`}
                >
                  {requireApproval ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
            </Card>

            {/* Paid Event */}
            <Card className="p-6 border border-border bg-card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">💰</span>
                    <h3 className="font-semibold text-foreground">Paid Event</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Charge a ticket price for entry</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPaidEvent(prev => !prev)}
                  className={`transition-all ${isPaidEvent ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}`}
                >
                  {isPaidEvent ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
              {isPaidEvent && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                  <Label className="text-sm">Ticket Price (PHP)</Label>
                  <Input type="number" min={0} max={1000} value={ticketPrice} onChange={(e) => setTicketPrice(e.target.value)} placeholder="100" />
                  <p className="text-xs text-muted-foreground">Maximum price allowed is ₱1,000</p>
                </div>
              )}
            </Card>

            {/* Public Event */}
            <Card className="p-6 border border-border bg-card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Eye className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-foreground">Public Event</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Show on the Discover page</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPublic(prev => !prev)}
                  className={`transition-all ${isPublic ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}`}
                >
                  {isPublic ? 'Public' : 'Private'}
                </Button>
              </div>
            </Card>
          </div>

          {/* Navigation */}
          <Card className="p-6 border border-border bg-card">
            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={() => setCurrentStep(1)} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Details
              </Button>
              <Button disabled={!isStep2Valid} onClick={() => setCurrentStep(3)} className="gap-2 min-w-[140px]">
                Continue
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </Button>
            </div>
          </Card>
        </div>
      )}

      {currentStep === 3 && (
        <div className="space-y-6">
          {/* Enhanced Header */}
          <Card className="p-6 border border-border bg-gradient-to-br from-card to-card/50">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Eye className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-foreground mb-2">Step 3 · Choose Theme</h2>
                <p className="text-sm text-muted-foreground">
                  Select a color theme and style for your event card. Preview updates in real-time.
                </p>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 p-6 border border-border bg-card space-y-6">

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
            </Card>

            {/* Live Preview - Right Side */}
            <div className="lg:col-span-2">
              <div className="sticky top-6 space-y-4">
                <h3 className="text-lg font-semibold text-muted-foreground">Live Preview</h3>

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

            {/* Navigation */}
            {/* Navigation Bar - Fixed at bottom of section */}
            <Card className="p-4 border border-border bg-card flex items-center justify-between mt-6">
              <Button variant="outline" onClick={() => setCurrentStep(2)} disabled={isLoading}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Options
              </Button>
              <Button
                onClick={() => setCurrentStep(4)}
                className="gap-2 min-w-[160px]"
              >
                Continue to Template
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </Button>
            </Card>
          </div>
        </div>
      )}

      {currentStep === 4 && (
        <div className="space-y-6">
          {/* Header Section with Enhanced Typography */}
          <Card className="p-6 border border-border bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-foreground flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Upload className="w-5 h-5 text-primary" />
                  </div>
                  Step 4 · Certificate Template
                </h2>
                <p className="text-sm text-muted-foreground max-w-2xl">
                  Select from our professionally designed department templates or upload your own custom certificate design.
                </p>
              </div>
              {certificateTemplate && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-sm font-medium text-primary">Template Selected</span>
                </div>
              )}
            </div>
          </Card>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left side: Premade Templates - Takes 2 columns */}
            <Card className="xl:col-span-2 p-6 border border-border bg-card space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                    Premade Certificates
                    <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded-full">
                      {PREMADE_CERTIFICATES.length} templates
                    </span>
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click to select • Hover for details
                  </p>
                </div>
              </div>

              {/* Template Grid with Enhanced Design */}
              <div className="grid grid-cols-4 gap-4">
                {PREMADE_CERTIFICATES.map((template, index) => (
                  <button
                    key={template.path}
                    onClick={() => handlePremadeTemplateSelect(template.path)}
                    className={`group relative aspect-[1123/794] rounded-xl overflow-hidden border-2 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl ${selectedPremadeTemplate === template.path
                      ? 'border-primary ring-4 ring-primary/20 shadow-xl scale-105'
                      : 'border-border hover:border-primary/50 shadow-md'
                      }`}
                    style={{
                      animationDelay: `${index * 50}ms`,
                      animation: 'fadeInUp 0.5s ease-out forwards',
                    }}
                  >
                    {/* Template Image */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={template.path}
                      alt={template.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />

                    {/* Gradient Overlay on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />

                    {/* Department Info - Slides up on hover */}
                    <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <div className="text-center space-y-1">
                        <p className="text-white font-bold text-sm drop-shadow-lg">{template.name}</p>
                        <p className="text-white/90 text-[10px] leading-tight drop-shadow-md line-clamp-2">
                          {template.department}
                        </p>
                      </div>
                    </div>

                    {/* Selected Badge - Enhanced */}
                    {selectedPremadeTemplate === template.path && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-primary text-primary-foreground rounded-full px-2 py-1 shadow-lg animate-in zoom-in duration-300">
                        <Eye className="w-3 h-3" />
                        <span className="text-[10px] font-semibold">SELECTED</span>
                      </div>
                    )}

                    {/* Corner Badge with Template Name */}
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {template.name}
                    </div>
                  </button>
                ))}
              </div>

              {/* Helper Text */}
              <div className="flex items-start gap-2 p-4 bg-muted/50 rounded-lg border border-border/50">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary text-xs">💡</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-foreground">Pro Tip:</span> The HCDC-Wide template is perfect for institution-wide events,
                  while department-specific templates are ideal for college or school events.
                </p>
              </div>
            </Card>

            {/* Right side: Preview & Upload */}
            <Card className="p-6 border border-border bg-card space-y-6 h-fit sticky top-6">
              {/* Preview Section - Always Visible and Prominent */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-foreground">Preview</h3>
                  {certificateTemplate && (
                    <div className="flex items-center gap-2">
                      {selectedPremadeTemplate ? (
                        <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">
                          {PREMADE_CERTIFICATES.find(t => t.path === selectedPremadeTemplate)?.name || 'Premade'}
                        </span>
                      ) : (
                        <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">Custom</span>
                      )}
                    </div>
                  )}
                </div>

                {certificateTemplate ? (
                  <div className="relative group rounded-xl overflow-hidden border-2 border-primary shadow-lg shadow-primary/10 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20">
                    <img
                      src={certificateTemplate}
                      alt="Certificate template"
                      className="w-full rounded-lg transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                      <div className="text-center space-y-1">
                        <span className="text-white text-sm font-bold bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full block">
                          Selected Template
                        </span>
                        <span className="text-white/80 text-xs">
                          {certificateSize.width} × {certificateSize.height} px
                        </span>
                      </div>
                    </div>
                    {/* Animated border pulse */}
                    <div className="absolute inset-0 rounded-xl border-2 border-primary/50 animate-pulse pointer-events-none" />
                  </div>
                ) : (
                  <div className="relative rounded-xl overflow-hidden border-2 border-dashed border-border bg-muted/30 aspect-[1123/794] flex items-center justify-center">
                    <div className="text-center space-y-3 p-6">
                      <div className="w-20 h-20 mx-auto rounded-2xl bg-muted flex items-center justify-center">
                        <Eye className="w-10 h-10 text-muted-foreground/50" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-muted-foreground">No Template Selected</p>
                        <p className="text-xs text-muted-foreground/70">
                          Choose a premade template or upload your own
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              {/* Upload Custom Certificate Section */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-1">Upload Custom</h3>
                  <p className="text-xs text-muted-foreground">
                    Use your own certificate design
                  </p>
                </div>

                {/* Enhanced Upload Area */}
                <div className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 ${certificateTemplate && !selectedPremadeTemplate
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-muted/30'
                  }`}>
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    id="certificate-upload"
                    className="hidden"
                    onChange={handleCertificateUpload}
                  />
                  <label htmlFor="certificate-upload" className="flex flex-col items-center gap-3 cursor-pointer group">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Upload className="w-7 h-7 text-primary group-hover:animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">
                        {certificateTemplate && !selectedPremadeTemplate ? 'Change Template' : 'Upload Certificate'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG or JPG • Landscape
                      </p>
                    </div>
                  </label>
                </div>

                {/* Error Display */}
                {certificateError && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg animate-in slide-in-from-top-2 duration-300">
                    <p className="text-sm text-destructive flex items-center gap-2">
                      <span className="text-lg">⚠️</span>
                      {certificateError}
                    </p>
                  </div>
                )}

                {/* Requirements List */}
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Requirements</p>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Landscape orientation
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      PNG or JPEG format
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      High resolution recommended
                    </li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>

          {/* Navigation Bar - Fixed at bottom of section */}
          {/* Navigation Bar - Fixed at bottom of section */}
          {/* Navigation Bar - Fixed at bottom of section */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t z-50 flex justify-center animate-in slide-in-from-bottom-5 duration-300">
            <div className="w-full max-w-5xl flex items-center justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(3)} disabled={isLoading}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Theme
              </Button>
              <Button
                disabled={!certificateTemplate}
                onClick={() => setCurrentStep(5)}
                className="gap-2 min-w-[160px]"
              >
                Continue to Mapping
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </Button>
            </div>
          </div>
        </div>
      )}


      {currentStep === 5 && (
        <div className="space-y-6">
          {/* Enhanced Header */}
          <Card className="p-6 border border-border bg-gradient-to-br from-card to-card/50">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Ruler className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-foreground mb-2">Step 5 · Coordinate Mapping</h2>
                <p className="text-sm text-muted-foreground">
                  Position text fields on your certificate and customize fonts. Drag elements directly on the preview or use the controls below.
                </p>
              </div>
            </div>
          </Card>

          {/* Main Content Card */}
          <Card className="p-6 border border-border bg-card space-y-6">
            {/* Certificate Preview */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground">Certificate Preview</h3>
              <p className="text-xs text-muted-foreground">
                Drag the text elements to position them on your certificate template
              </p>
            </div>

            {/* Visual drag-and-drop preview */}
            <div
              ref={certificatePreviewRef}
              className="relative border-2 border-border rounded-xl overflow-hidden bg-muted shadow-inner"
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
                  <div className="absolute inset-0">
                    <span
                      className="absolute font-bold uppercase tracking-wide cursor-move select-none"
                      style={{
                        left: `${(certificateCoordinates.name.x / certificateSize.width) * 100}%`,
                        bottom: `${(certificateCoordinates.name.y / certificateSize.height) * 100}%`,
                        transform: 'translate(-50%, 50%)',
                        fontSize: `${nameFontSize}px`,
                        color: nameFontColor,
                      }}
                      onMouseDown={(e) => handleDragStart('name', e)}
                    >
                      {sampleName}
                    </span>
                    <span
                      className="absolute font-semibold cursor-move select-none"
                      style={{
                        left: `${(certificateCoordinates.eventTitle.x / certificateSize.width) * 100}%`,
                        bottom: `${(certificateCoordinates.eventTitle.y / certificateSize.height) * 100}%`,
                        transform: 'translate(-50%, 50%)',
                        fontSize: `${eventTitleFontSize}px`,
                        color: eventTitleFontColor,
                      }}
                      onMouseDown={(e) => handleDragStart('eventTitle', e)}
                    >
                      {sampleEventTitle || eventName}
                    </span>
                    <span
                      className="absolute cursor-move select-none"
                      style={{
                        left: `${(certificateCoordinates.date.x / certificateSize.width) * 100}%`,
                        bottom: `${(certificateCoordinates.date.y / certificateSize.height) * 100}%`,
                        transform: 'translate(-50%, 50%)',
                        fontSize: `${dateFontSize}px`,
                        color: dateFontColor,
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

            {/* Font Customization Section */}
            <div className="space-y-4 pt-6 border-t border-border">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                Font Customization
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Name Font Controls */}
                <div className="space-y-3 border border-border rounded-lg p-4 bg-muted/30">
                  <p className="font-semibold text-sm text-foreground">Participant Name</p>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">Font Size</Label>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setNameFontSize(prev => Math.max(8, prev - 2))}
                          className="h-8 w-8"
                        >
                          -
                        </Button>
                        <div className="flex-1 text-center">
                          <span className="text-sm font-semibold">{nameFontSize}px</span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setNameFontSize(prev => Math.min(72, prev + 2))}
                          className="h-8 w-8"
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Event Title Font Controls */}
                <div className="space-y-3 border border-border rounded-lg p-4 bg-muted/30">
                  <p className="font-semibold text-sm text-foreground">Event Title</p>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">Font Size</Label>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setEventTitleFontSize(prev => Math.max(8, prev - 2))}
                          className="h-8 w-8"
                        >
                          -
                        </Button>
                        <div className="flex-1 text-center">
                          <span className="text-sm font-semibold">{eventTitleFontSize}px</span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setEventTitleFontSize(prev => Math.min(72, prev + 2))}
                          className="h-8 w-8"
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Date Font Controls */}
                <div className="space-y-3 border border-border rounded-lg p-4 bg-muted/30">
                  <p className="font-semibold text-sm text-foreground">Event Date</p>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">Font Size</Label>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setDateFontSize(prev => Math.max(8, prev - 2))}
                          className="h-8 w-8"
                        >
                          -
                        </Button>
                        <div className="flex-1 text-center">
                          <span className="text-sm font-semibold">{dateFontSize}px</span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setDateFontSize(prev => Math.min(72, prev + 2))}
                          className="h-8 w-8"
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Font Color Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Name Color */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Name Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={nameFontColor}
                      onChange={(e) => setNameFontColor(e.target.value)}
                      className="h-10 w-full cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={nameFontColor}
                      onChange={(e) => setNameFontColor(e.target.value)}
                      className="h-10 w-24 font-mono text-xs"
                      placeholder="#000000"
                    />
                  </div>
                </div>

                {/* Event Title Color */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Event Title Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={eventTitleFontColor}
                      onChange={(e) => setEventTitleFontColor(e.target.value)}
                      className="h-10 w-full cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={eventTitleFontColor}
                      onChange={(e) => setEventTitleFontColor(e.target.value)}
                      className="h-10 w-24 font-mono text-xs"
                      placeholder="#000000"
                    />
                  </div>
                </div>

                {/* Date Color */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Date Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={dateFontColor}
                      onChange={(e) => setDateFontColor(e.target.value)}
                      className="h-10 w-full cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={dateFontColor}
                      onChange={(e) => setDateFontColor(e.target.value)}
                      className="h-10 w-24 font-mono text-xs"
                      placeholder="#000000"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Coordinate Mapping Section */}
            <div className="space-y-4 pt-6 border-t border-border">
              <div>
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Position Coordinates
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Fine-tune the exact position of each text element
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Participant Name', key: 'name' as const },
                  { label: 'Event Title', key: 'eventTitle' as const },
                  { label: 'Event Date', key: 'date' as const },
                ].map(({ label, key }) => (
                  <div key={key} className="space-y-3 border border-border rounded-lg p-4 bg-muted/30 hover:bg-muted/50 transition-colors">
                    <p className="font-semibold text-sm text-foreground">{label}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs uppercase text-muted-foreground">X Position</Label>
                        <Input
                          type="number"
                          value={certificateCoordinates[key].x}
                          onChange={(e) => handleCoordinateChange(key, 'x', Number(e.target.value))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs uppercase text-muted-foreground">Y Position</Label>
                        <Input
                          type="number"
                          value={certificateCoordinates[key].y}
                          onChange={(e) => handleCoordinateChange(key, 'y', Number(e.target.value))}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sample Text Section */}
            <div className="space-y-4 pt-6 border-t border-border">
              <div>
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Edit className="w-5 h-5 text-primary" />
                  Sample Text
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Edit the sample text to preview how it will appear on the certificate
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Sample Name</Label>
                  <Input value={sampleName} onChange={(e) => setSampleName(e.target.value)} placeholder="Juan Dela Cruz" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Sample Event Title</Label>
                  <Input value={sampleEventTitle} onChange={(e) => setSampleEventTitle(e.target.value)} placeholder="Sample Event Title" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Sample Date</Label>
                  <Input value={sampleDate} onChange={(e) => setSampleDate(e.target.value)} placeholder="January 01, 2025" />
                </div>
              </div>
            </div>
          </Card>

          {/* Navigation */}
          <Card className="p-6 border border-border bg-card">
            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={() => setCurrentStep(4)} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Template
              </Button>
              <Button onClick={() => setCurrentStep(6)} className="gap-2 min-w-[140px]">
                Review & Publish
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </Button>
            </div>
          </Card>
        </div>
      )}

      {currentStep === 6 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Page Header */}
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Review & Publish</h2>
            <p className="text-muted-foreground">
              Double-check all event details and visual assets before going live.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Event Details & Settings */}
            <div className="lg:col-span-2 space-y-6">

              {/* 1. Identity & Description */}
              <Card className="overflow-hidden border-border bg-card shadow-sm">
                <div className="relative h-48 bg-muted">
                  {coverImage ? (
                    <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground flex-col gap-2">
                      <Upload className="w-8 h-8 opacity-50" />
                      <span className="text-xs uppercase tracking-wide">No Cover Image</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-6 text-white">
                    <h3 className="text-2xl font-bold shadow-black drop-shadow-md">{eventName || 'Untitled Event'}</h3>
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    <div className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center gap-1 border border-primary/20">
                      <Tag className="w-3 h-3" />
                      {eventCategory === 'department' ? 'Department' : eventCategory === 'HCDC' ? 'Institution Wide' : 'Public'}
                    </div>
                    {departmentCategory && (
                      <div className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-medium flex items-center gap-1 border border-blue-500/20">
                        <Building2 className="w-3 h-3" />
                        {departmentCategory}
                      </div>
                    )}
                    <div className="px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-medium flex items-center gap-1 border border-orange-500/20">
                      <BookOpen className="w-3 h-3" />
                      {semester}
                    </div>
                    <div className="px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 text-xs font-medium flex items-center gap-1 border border-violet-500/20">
                      <GraduationCap className="w-3 h-3" />
                      {schoolYear}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                      <FileText className="w-4 h-4 text-primary" />
                      Description
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {eventDescription || 'No description provided.'}
                    </p>
                  </div>
                </div>
              </Card>

              {/* 2. Logistics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4 border-border bg-card flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary mt-1">
                    <CalendarIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase">Date & Time</p>
                    <p className="font-semibold text-foreground mt-0.5">{eventDate || 'TBD'}</p>
                    <p className="text-sm text-muted-foreground">{startTime} - {endTime} ({timezone})</p>
                  </div>
                </Card>
                <Card className="p-4 border-border bg-card flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary mt-1">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase">Venue</p>
                    <p className="font-semibold text-foreground mt-0.5">{venue || 'TBD'}</p>
                  </div>
                </Card>
                <Card className="p-4 border-border bg-card flex items-start gap-3 md:col-span-2">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary mt-1">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="w-full">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Speakers / Guests</p>
                    {speakers && speakers.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {speakers.split(',').map((speaker, i) => (
                          <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted text-xs font-medium border border-border">
                            <UserCheck className="w-3 h-3" />
                            {speaker.trim()}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-0.5">No speakers listed.</p>
                    )}
                  </div>
                </Card>
              </div>

              {/* 3. Settings & Permissions */}
              <Card className="p-6 border-border bg-card space-y-4">
                <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground border-b border-border pb-2">
                  <Lock className="w-4 h-4 text-primary" />
                  Access & Registration Settings
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Visibility</p>
                    <div className="flex items-center gap-2 font-medium text-sm">
                      {isPublic ? <Globe className="w-4 h-4 text-green-500" /> : <Lock className="w-4 h-4 text-amber-500" />}
                      {isPublic ? 'Public Event' : 'Private / Invite Only'}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Approval</p>
                    <div className="flex items-center gap-2 font-medium text-sm">
                      {requireApproval ? <CheckCircle className="w-4 h-4 text-blue-500" /> : <CheckCircle className="w-4 h-4 text-muted-foreground" />}
                      {requireApproval ? 'Required' : 'Auto-approve'}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Capacity</p>
                    <div className="flex items-center gap-2 font-medium text-sm">
                      <Users className="w-4 h-4 text-foreground" />
                      {hasCapacityLimit ? `${capacity} Seats` : 'Unlimited'}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Ticketing</p>
                    <div className="flex items-center gap-2 font-medium text-sm">
                      <Ticket className="w-4 h-4 text-foreground" />
                      {isPaidEvent ? `Paid (₱${ticketPrice})` : 'Free Entry'}
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Column: Visual Sidebar */}
            <div className="space-y-6">
              <div className="sticky top-6 space-y-6">

                {/* Visual Preview Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Eye className="w-4 h-4 text-primary" />
                    Visual Assets
                  </h3>

                  {/* 1. Event Card */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase flex justify-between">
                      <span>Event Card</span>
                      <span className="text-primary">{activeTheme.name} Theme</span>
                    </p>

                    {/* Dynamic Event Card Component */}
                    <Card
                      className={`overflow-hidden bg-card shadow-lg mx-auto border-t-8 ${activeTheme.border || 'border-transparent'} ${useFloat ? 'animate-pulse' : ''} ${cardStyle === 'poster' ? 'max-w-[280px] h-[450px] flex flex-col relative' : 'max-w-full'}`}
                      style={{
                        boxShadow: useNeon ? `0 0 25px ${activeTheme.accent}60` : undefined,
                        transform: useFloat ? 'translateY(-5px)' : 'none',
                        fontSize: cardStyle === 'poster' ? '0.9em' : '1em'
                      }}
                    >
                      {/* Banner Image */}
                      <div className={`relative group overflow-hidden ${cardStyle === 'poster' ? 'absolute inset-0 h-full' : 'h-40 bg-muted'}`}>
                        {/* Pattern Overlay */}
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
                            <Upload className={`w-10 h-10 ${activeTheme.textColor || 'text-muted-foreground'} opacity-50 relative z-20`} />
                          </div>
                        )}

                        {/* Poster Mode Overlay */}
                        {cardStyle === 'poster' && (
                          <div className={`absolute inset-0 bg-gradient-to-t ${activeTheme.id === 11 ? 'from-white via-white/50' : 'from-black/95 via-black/50'} to-transparent pointer-events-none`} />
                        )}

                        {/* Date Badge */}
                        <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-md shadow-md text-center min-w-[50px] z-20 ${activeTheme.color} ${activeTheme.id === 11 ? 'text-slate-900 border border-slate-200' : 'text-white'}`}>
                          <span className="block text-[10px] uppercase font-bold opacity-90">
                            {eventDate ? new Date(eventDate).toLocaleString('default', { month: 'short' }).toUpperCase() : 'DEC'}
                          </span>
                          <span className="block text-lg font-bold leading-none">
                            {eventDate ? new Date(eventDate).getDate() : '25'}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className={`p-5 relative transition-all ${cardStyle === 'poster' ? 'mt-auto z-20' : ''} ${useGlass ? 'bg-white/30 backdrop-blur-xl border border-white/20 shadow-lg' : activeTheme.id === 11 && cardStyle !== 'poster' ? 'bg-white' : ''}`}>
                        <h3 className={`text-lg font-bold line-clamp-2 mb-2 ${cardStyle === 'poster' ? (activeTheme.id === 11 ? 'text-slate-900' : 'text-white') : activeTheme.textColor || 'text-foreground'}`}>
                          {eventName || 'Annual Cross Blazers Cup 2024'}
                        </h3>

                        <div className="space-y-2 mb-4">
                          <div className={`flex items-center gap-2 text-xs ${cardStyle === 'poster' ? (activeTheme.id === 11 ? 'text-slate-700' : 'text-white/80') : 'text-muted-foreground'}`}>
                            <Clock className={`w-3.5 h-3.5 ${cardStyle === 'poster' ? (activeTheme.id === 11 ? 'text-slate-900' : 'text-white/80') : activeTheme.textColor || 'text-primary'}`} />
                            <span>
                              {startTime && endTime ? `${startTime} - ${endTime}` : '8:00 AM - 5:00 PM'}
                            </span>
                          </div>
                          <div className={`flex items-center gap-2 text-xs ${cardStyle === 'poster' ? (activeTheme.id === 11 ? 'text-slate-700' : 'text-white/80') : 'text-muted-foreground'}`}>
                            <MapPin className={`w-3.5 h-3.5 ${cardStyle === 'poster' ? (activeTheme.id === 11 ? 'text-slate-900' : 'text-white/80') : activeTheme.textColor || 'text-primary'}`} />
                            <span>{venue || 'HCDC Gymnasium'}</span>
                          </div>
                        </div>

                        {/* Action Area */}
                        <div className={`flex items-center justify-between pt-3 border-t ${cardStyle === 'poster' ? (activeTheme.id === 11 ? 'border-slate-200' : 'border-white/20') : activeTheme.border ? activeTheme.border.replace('border-', 'border-').replace('500', '200').replace('600', '200').replace('700', '200').replace('900', '200') : 'border-border'}`}>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] ${cardStyle === 'poster' ? (activeTheme.id === 11 ? 'text-slate-600' : 'text-white/70') : 'text-muted-foreground'}`}>Tickets from</span>
                            <span className={`font-bold text-sm ${cardStyle === 'poster' ? (activeTheme.id === 11 ? 'text-slate-900' : 'text-white') : activeTheme.textColor || 'text-foreground'}`}>
                              {isPaidEvent ? `₱${Number(ticketPrice).toLocaleString()}` : 'Free'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* 2. Certificate Preview */}
                  <div className="space-y-2 pt-4 border-t border-border">
                    <p className="text-xs font-medium text-muted-foreground uppercase flex justify-between items-center">
                      <span>Certificate</span>
                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">Click to Preview</span>
                    </p>

                    <Dialog>
                      <DialogTrigger asChild>
                        <div className="relative border border-border rounded-lg overflow-hidden bg-muted cursor-pointer group hover:ring-2 hover:ring-primary hover:ring-offset-2 transition-all" style={{ paddingBottom: '70%' }}>
                          {certificateTemplate ? (
                            <>
                              <img src={certificateTemplate} alt="Certificate template" className="absolute inset-0 w-full h-full object-cover" />
                              <div className="absolute inset-0 pointer-events-none transform-gpu origin-bottom-left w-full h-full">
                                <span
                                  className="absolute font-bold uppercase tracking-wide whitespace-nowrap"
                                  style={{
                                    left: `${(certificateCoordinates.name.x / certificateSize.width) * 100}%`,
                                    bottom: `${(certificateCoordinates.name.y / certificateSize.height) * 100}%`,
                                    transform: `translate(-50%, 50%) scale(${0.3})`, // Use scale transform for perfect sizing
                                    fontSize: `${nameFontSize}px`,
                                    color: nameFontColor,
                                    transformOrigin: 'center center',
                                  }}
                                >
                                  {sampleName || 'JUAN DELA CRUZ'}
                                </span>
                                <span
                                  className="absolute font-bold uppercase tracking-wide whitespace-nowrap"
                                  style={{
                                    left: `${(certificateCoordinates.eventTitle.x / certificateSize.width) * 100}%`,
                                    bottom: `${(certificateCoordinates.eventTitle.y / certificateSize.height) * 100}%`,
                                    transform: `translate(-50%, 50%) scale(${0.3})`,
                                    fontSize: `${eventTitleFontSize}px`,
                                    color: eventTitleFontColor,
                                    transformOrigin: 'center center',
                                  }}
                                >
                                  {sampleEventTitle || eventName || 'EVENT TITLE'}
                                </span>
                                <span
                                  className="absolute font-bold uppercase tracking-wide whitespace-nowrap"
                                  style={{
                                    left: `${(certificateCoordinates.date.x / certificateSize.width) * 100}%`,
                                    bottom: `${(certificateCoordinates.date.y / certificateSize.height) * 100}%`,
                                    transform: `translate(-50%, 50%) scale(${0.3})`,
                                    fontSize: `${dateFontSize}px`,
                                    color: dateFontColor,
                                    transformOrigin: 'center center',
                                  }}
                                >
                                  {sampleDate || eventDate || 'DATE'}
                                </span>
                              </div>

                              {/* Hover Overlay */}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                                <div className="bg-background/90 text-foreground px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
                                  <Maximize2 className="w-3.5 h-3.5" />
                                  View Full Size
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-[10px] flex-col gap-1">
                              <FileText className="w-6 h-6 opacity-50" />
                              No Certificate
                            </div>
                          )}
                        </div>
                      </DialogTrigger>

                      {/* Full Size Modal Content */}
                      <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-transparent border-none shadow-none">
                        <DialogTitle className="sr-only">Certificate Full Preview</DialogTitle>
                        <div className="relative w-full rounded-lg overflow-hidden shadow-2xl">
                          <img src={certificateTemplate} alt="Certificate Full Preview" className="w-full h-auto object-contain" />
                          <div className="absolute inset-0 pointer-events-none">
                            <span
                              className="absolute font-bold uppercase tracking-wide whitespace-nowrap"
                              style={{
                                left: `${(certificateCoordinates.name.x / certificateSize.width) * 100}%`,
                                bottom: `${(certificateCoordinates.name.y / certificateSize.height) * 100}%`,
                                transform: 'translate(-50%, 50%)',
                                fontSize: `${nameFontSize}px`, // Full size font
                                color: nameFontColor,
                              }}
                            >
                              {sampleName || 'JUAN DELA CRUZ'}
                            </span>
                            <span
                              className="absolute font-bold uppercase tracking-wide whitespace-nowrap"
                              style={{
                                left: `${(certificateCoordinates.eventTitle.x / certificateSize.width) * 100}%`,
                                bottom: `${(certificateCoordinates.eventTitle.y / certificateSize.height) * 100}%`,
                                transform: 'translate(-50%, 50%)',
                                fontSize: `${eventTitleFontSize}px`,
                                color: eventTitleFontColor,
                              }}
                            >
                              {sampleEventTitle || eventName || 'EVENT TITLE'}
                            </span>
                            <span
                              className="absolute font-bold uppercase tracking-wide whitespace-nowrap"
                              style={{
                                left: `${(certificateCoordinates.date.x / certificateSize.width) * 100}%`,
                                bottom: `${(certificateCoordinates.date.y / certificateSize.height) * 100}%`,
                                transform: 'translate(-50%, 50%)',
                                fontSize: `${dateFontSize}px`,
                                color: dateFontColor,
                              }}
                            >
                              {sampleDate || eventDate || 'DATE'}
                            </span>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                </div>

                {/* Final Actions */}
                <div className="flex flex-col gap-3 pt-6 border-t border-border">
                  <Button onClick={handleCreateEvent} disabled={isLoading || !certificateTemplate} className="w-full h-11 text-base bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
                    {isLoading ? 'Creating Event...' : 'Confirm & Publish Event'}
                  </Button>
                  <Button variant="outline" onClick={() => setCurrentStep(5)} disabled={isLoading} className="w-full">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Edit
                  </Button>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
