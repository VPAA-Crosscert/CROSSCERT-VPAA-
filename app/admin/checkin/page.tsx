'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useCallback } from 'react'
import { ArrowLeft, QrCode, BarChart3, Camera, X, CheckCircle2, AlertCircle, Scan, TrendingUp, Users, Zap, Calendar } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api, apiCall } from '@/lib/api-config'
import { toast } from '@/hooks/use-toast'
import jsQR from 'jsqr'

type EventRecord = {
  id: number
  title?: string
  name?: string
  status?: string
}

export default function AdminCheckIn() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [events, setEvents] = useState<EventRecord[]>([])
  const [selectedEvent, setSelectedEvent] = useState<string>('')
  const [cameraActive, setCameraActive] = useState(false)
  const [scannedCode, setScannedCode] = useState('')
  const [participantName, setParticipantName] = useState('')
  const [checkedInCount, setCheckedInCount] = useState(0)
  const [totalExpected, setTotalExpected] = useState(0)
  const [showSuccess, setShowSuccess] = useState(false)
  const [lastAction, setLastAction] = useState<'check-in' | 'check-out' | null>(null)
  const [eventsLoading, setEventsLoading] = useState(true)
  const [eventsError, setEventsError] = useState('')
  const [isProcessingScan, setIsProcessingScan] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorModalMessage, setErrorModalMessage] = useState('')
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)



  // Auto-fill prefix for easier manual entry
  useEffect(() => {
    if (selectedEvent) {
      setScannedCode(`REG-${selectedEvent}-`)
    } else {
      setScannedCode('')
    }
  }, [selectedEvent])

  useEffect(() => {
    const fetchEvents = async () => {
      setEventsLoading(true)
      setEventsError('')
      try {
        const existing = localStorage.getItem('crosscert_local_events')
        if (existing) {
          try {
            const list = JSON.parse(existing) as EventRecord[]
            const validEvents = (Array.isArray(list) ? list : [])
              .filter((evt) => evt && evt.id)
              .map((evt) => ({
                id: evt.id,
                title: evt.title || evt.name || `Event #${evt.id}`,
              }))
            setEvents(validEvents)
            setEventsLoading(false)
            return
          } catch (parseErr) {
            // Continue to API fetch
          }
        }

        const res = await apiCall.get(api.events())
        if (!res.ok) {
          if (res.status === 403) {
            setEventsError('Access denied. Please ensure you are logged in as an admin.')
          } else {
            setEventsError('Unable to load events. Please try again.')
          }
          setEvents([])
          return
        }
        const data = await res.json()

        const events: EventRecord[] = Array.isArray(data)
          ? data
          : (data.results || data.data || [])

        const validEvents = events
          .filter((evt) => evt && evt.id)
          .map((evt) => ({
            id: evt.id,
            title: evt.title || evt.name || `Event #${evt.id}`,
            status: evt.status,
          }))

        setEvents(validEvents)
        if (validEvents.length === 0 && events.length > 0) {
          setEventsError('Events loaded but none are valid.')
        }
      } catch (err: any) {
        setEventsError(err.message || 'Unable to load events. Please check your connection.')
        setEvents([])
      } finally {
        setEventsLoading(false)
      }
    }
    fetchEvents()
  }, [])

  const fetchEventStats = useCallback(async () => {
    if (!selectedEvent) {
      setCheckedInCount(0)
      setTotalExpected(0)
      return
    }

    try {
      const regsUrl = `${api.registrations()}?event=${selectedEvent}`
      const regsRes = await apiCall.get(regsUrl)

      if (regsRes.ok) {
        let regsData
        try {
          regsData = await regsRes.json()
        } catch (e) {
          console.error('Failed to parse registrations JSON', e)
          return
        }

        const registrations = Array.isArray(regsData) ? regsData : (regsData.results || regsData.data || [])
        setTotalExpected(registrations.length)

        const checkedIn = registrations.filter((reg: any) => reg.is_present === true).length
        setCheckedInCount(checkedIn)
      } else {
        console.warn('Failed to fetch stats:', regsRes.status)
      }
    } catch (err) {
      console.error('Failed to fetch event stats:', err)
    }
  }, [selectedEvent])

  useEffect(() => {
    fetchEventStats()
  }, [selectedEvent, fetchEventStats])

  const showError = (message: string) => {
    setErrorModalMessage(message)
    setShowErrorModal(true)
  }

  const handleAutoScan = useCallback(async (code: string) => {
    if (!selectedEvent) {
      showError('Please select an event first')
      setTimeout(() => setIsProcessingScan(false), 1000)
      return
    }

    if (!scannedCode || !code.trim()) {
      setTimeout(() => setIsProcessingScan(false), 500)
      return
    }

    // 1. Verify Event ID from QR (Format: REG-{eventId}-{email})
    const qrParts = code.trim().split('-')
    if (qrParts.length >= 3 && qrParts[0] === 'REG') {
      const qrEventId = qrParts[1]
      if (qrEventId !== selectedEvent) {
        // Find event name
        const correctEvent = events.find(e => e.id.toString() === qrEventId)
        const eventName = correctEvent ? correctEvent.title : `Event #${qrEventId}` || 'another event'
        showError(`It's the wrong QR, it's for the ${eventName} QR.`)
        setTimeout(() => setIsProcessingScan(false), 2500)
        return
      }
    }

    const event = events.find(e => e.id.toString() === selectedEvent)
    const isCompleted = event?.status?.toLowerCase() === 'completed'

    const action = isCompleted ? 'check-out' : 'check-in'
    const endpoint = isCompleted
      ? `${api.checkIns()}check-out-by-code/`
      : `${api.checkIns()}check-in-by-code/`

    try {
      const res = await apiCall.post(endpoint, {
        code: code.trim(),
      })
      const data = await res.json()

      if (!res.ok) {
        // Special Handling for "Already checked in"
        if (data.message?.toLowerCase().includes('already checked in') || data.error?.toLowerCase().includes('already checked in') ||
          data.message?.toLowerCase().includes('already present') || data.error?.toLowerCase().includes('already present')) {
          // Treat as success
          setParticipantName(`${data.participant_name ?? 'Participant'}`)
          setShowSuccess(true)
          setLastAction(action)

          toast({
            title: 'Already Checked In',
            description: `${data.participant_name ?? 'Participant'} is already checked in.`,
            className: 'bg-green-50 border-green-200 text-green-800'
          })

          setTimeout(() => {
            setScannedCode('')
            setShowSuccess(false)
            setIsProcessingScan(false)
          }, 2000)
          return
        }

        // Special Handling for "Participant doesn't exist"
        if (res.status === 404 || data.message?.toLowerCase().includes('not found') || data.error?.toLowerCase().includes('not found') || data.error?.toLowerCase().includes('does not exist')) {
          showError("Participant doesn't exist.")
          setTimeout(() => setIsProcessingScan(false), 2000)
          return
        }

        showError(data.error || data.message || `Unable to ${action} participant.`)
        setTimeout(() => setIsProcessingScan(false), 2000)
        return
      }

      setParticipantName(`${data.participant_name ?? 'Participant'}`)
      await fetchEventStats()
      setShowSuccess(true)
      setLastAction(action)

      toast({
        title: `${action === 'check-in' ? 'Check-in' : 'Check-out'} Successful`,
        description: `${data.participant_name ?? 'Participant'} has been ${action === 'check-in' ? 'checked in' : 'checked out'}.`,
      })

      setTimeout(() => {
        setScannedCode('')
        setShowSuccess(false)
        setIsProcessingScan(false)
      }, 2000)
    } catch (err) {
      showError(`Network error while processing ${action}.`)
      setTimeout(() => setIsProcessingScan(false), 2000)
    }
  }, [selectedEvent, events, scannedCode, fetchEventStats])

  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      const video = videoRef.current
      const stream = streamRef.current

      video.srcObject = stream

      video.onloadedmetadata = () => {
        if (video) {
          video.play().catch(() => {
            // Silently handle play errors
          })
        }
      }

      if (canvasRef.current && video) {
        const canvas = canvasRef.current
        const context = canvas.getContext('2d', { willReadFrequently: true })

        if (context) {
          const updateCanvasSize = () => {
            if (video.videoWidth && video.videoHeight) {
              canvas.width = video.videoWidth
              canvas.height = video.videoHeight
            }
          }

          video.addEventListener('loadedmetadata', updateCanvasSize)
          video.addEventListener('resize', updateCanvasSize)
          updateCanvasSize()

          const startScanning = setTimeout(() => {
            scanIntervalRef.current = setInterval(() => {
              const isReady = video.readyState === video.HAVE_ENOUGH_DATA
              const hasValidSize = canvas.width > 0 && canvas.height > 0
              const notProcessing = !isProcessingScan

              if (isReady && notProcessing && hasValidSize) {
                try {
                  context.drawImage(video, 0, 0, canvas.width, canvas.height)
                  const imageData = context.getImageData(0, 0, canvas.width, canvas.height)

                  try {
                    const code = jsQR(imageData.data, imageData.width, imageData.height, {
                      inversionAttempts: 'dontInvert'
                    })

                    if (code && code.data) {
                      setIsProcessingScan(true)
                      setScannedCode(code.data)
                      handleAutoScan(code.data)
                    }
                  } catch (qrErr) {
                    // QR decoding failed
                  }
                } catch (err) {
                  // Silently handle scanning errors
                }
              }
            }, 200)
          }, 500)

          return () => {
            clearTimeout(startScanning)
          }
        }
      }
    }

    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current)
        scanIntervalRef.current = null
      }
    }
  }, [cameraActive, isProcessingScan, handleAutoScan])

  const startCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showError('Your browser does not support camera access. Please use a modern browser like Chrome, Firefox, or Edge.')
      return
    }

    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    if (!isSecure) {
      showError('Camera access requires HTTPS. Please access this page over HTTPS or use localhost.')
      return
    }

    try {
      let stream: MediaStream | null = null
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        })
      } catch (backCameraError) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        })
      }

      if (stream) {
        streamRef.current = stream
        setCameraActive(true)
      }
    } catch (err: any) {
      let errorMessage = 'Unable to access camera. '

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage += 'Please allow camera access in your browser settings and try again.'
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage += 'No camera found on your device.'
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage += 'Camera is already in use by another application.'
      } else if (err.name === 'OverconstrainedError') {
        errorMessage += 'Camera does not support the required settings.'
      } else {
        errorMessage += 'Please check your camera permissions and try again.'
      }

      showError(errorMessage + '\n\nYou can still use manual code entry below.')
    }
  }

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks()
      tracks.forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
    setIsProcessingScan(false)
  }

  const handleScan = async () => {
    if (!selectedEvent) {
      showError('Please select an event first')
      return
    }

    if (!scannedCode.trim()) {
      showError('Please enter a code or scan a QR code')
      return
    }

    const event = events.find(e => e.id.toString() === selectedEvent)
    const isCompleted = event?.status?.toLowerCase() === 'completed'

    const action = isCompleted ? 'check-out' : 'check-in'
    const endpoint = isCompleted
      ? `${api.checkIns()}check-out-by-code/`
      : `${api.checkIns()}check-in-by-code/`

    try {
      const res = await apiCall.post(endpoint, {
        code: scannedCode.trim(),
      })
      const data = await res.json()
      if (!res.ok) {
        showError(data.error || data.message || `Unable to ${action} participant.`)
        return
      }

      setParticipantName(`${data.participant_name ?? 'Participant'}`)
      await fetchEventStats()
      setShowSuccess(true)
      setLastAction(action)

      toast({
        title: `${action === 'check-in' ? 'Check-in' : 'Check-out'} Successful`,
        description: `${data.participant_name ?? 'Participant'} has been ${action === 'check-in' ? 'checked in' : 'checked out'}.`,
      })

      setTimeout(() => {
        setScannedCode('')
        setShowSuccess(false)
      }, 2000)
    } catch (err) {
      showError(`Network error while processing ${action}.`)
    }
  }

  const handleCheckOut = async () => {
    if (!selectedEvent) {
      showError('Please select an event first')
      return
    }

    const event = events.find(e => e.id.toString() === selectedEvent)
    const normalizedStatus = (event?.status || '').toLowerCase()
    if (normalizedStatus !== 'completed') {
      showError('You can only check out participants after the event has been concluded.')
      return
    }

    if (!scannedCode.trim()) {
      showError('Please enter a code or scan a QR code')
      return
    }

    try {
      const res = await apiCall.post(`${api.checkIns()}check-out-by-code/`, {
        code: scannedCode.trim(),
      })
      const data = await res.json()
      if (!res.ok) {
        showError(data.error || data.message || 'Unable to check out participant.')
        return
      }

      setParticipantName(`${data.participant_name ?? 'Participant'}`)
      setShowSuccess(true)
      setLastAction('check-out')

      toast({
        title: 'Check-out Successful',
        description: `${data.participant_name ?? 'Participant'} has been checked out.`,
      })

      setTimeout(() => {
        setScannedCode('')
        setShowSuccess(false)
      }, 2000)
    } catch (err) {
      showError('Network error while checking out participant.')
    }
  }

  const attendanceRate = totalExpected > 0 ? Math.min(100, Math.round((checkedInCount / totalExpected) * 100)) : 0

  return (
    <div className="min-h-screen bg-neutral-50/50 dark:bg-neutral-950 p-6 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-8 shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-red-500/10 via-rose-500/5 to-transparent rounded-full blur-3xl -mr-48 -mt-48" />
        <div className="relative">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors mb-4 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back</span>
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/30">
              <Scan className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight">Event Check-In</h1>
              <p className="text-neutral-500 dark:text-neutral-400 text-lg mt-1">Scan QR codes to check in participants</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">System Ready</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Scanner Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Selector */}
          <Card className="p-6 border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm shadow-sm">
            <Label className="text-neutral-900 dark:text-white font-semibold text-lg mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-red-500" />
              Select Event
            </Label>
            {eventsError && (
              <p className="text-sm text-red-600 dark:text-red-400 mb-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">{eventsError}</p>
            )}
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
              disabled={eventsLoading}
            >
              <option value="">
                {eventsLoading
                  ? 'Loading events...'
                  : events.length === 0
                    ? 'No events available'
                    : '-- Choose an event --'}
              </option>
              {Array.isArray(events) && events.map((event) => (
                <option key={event.id} value={event.id.toString()}>
                  {event.title}
                </option>
              ))}
            </select>
          </Card>

          {/* QR Scanner */}
          <Card className="p-6 border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm shadow-sm space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Camera className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">QR Code Scanner</h2>
            </div>

            {cameraActive ? (
              <div className="space-y-4">
                <div className="relative w-full bg-black rounded-xl overflow-hidden border-2 border-neutral-200 dark:border-neutral-700 shadow-lg" style={{ minHeight: '300px', maxHeight: '500px' }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-contain"
                    style={{
                      display: 'block',
                      width: '100%',
                      height: 'auto',
                      maxHeight: '500px'
                    }}
                  />
                  {/* Enhanced Scanning Frame */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="relative border-4 border-red-500 rounded-2xl animate-pulse" style={{
                      width: '280px',
                      height: '280px',
                      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
                    }}>
                      <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-red-500 rounded-tl-lg" />
                      <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-red-500 rounded-tr-lg" />
                      <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-red-500 rounded-bl-lg" />
                      <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-red-500 rounded-br-lg" />
                      {/* Scanning Line */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-scan" />
                    </div>
                  </div>
                </div>
                <canvas ref={canvasRef} className="hidden" />
                <Button
                  variant="outline"
                  className="w-full border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  onClick={stopCamera}
                >
                  <X className="w-4 h-4 mr-2" />
                  Stop Camera
                </Button>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center flex items-center justify-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  Position the QR code within the frame. Scanning automatically...
                </p>
                {isProcessingScan && (
                  <div className="flex items-center justify-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Processing QR code...</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 flex items-center justify-center" style={{ minHeight: '300px' }}>
                  <div className="text-center space-y-3">
                    <div className="w-16 h-16 mx-auto rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                      <Camera className="w-8 h-8 text-neutral-400 dark:text-neutral-500" />
                    </div>
                    <p className="text-neutral-500 dark:text-neutral-400 font-medium">Camera not active</p>
                    <p className="text-sm text-neutral-400 dark:text-neutral-500">Click below to start scanning</p>
                  </div>
                </div>
                <Button
                  className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white gap-2 shadow-lg shadow-red-500/30 h-12"
                  onClick={startCamera}
                >
                  <Camera className="w-5 h-5" />
                  Start Camera
                </Button>
              </div>
            )}

            {/* Manual Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none pl-4">
                <QrCode className="w-5 h-5 text-neutral-400" />
              </div>
              <Input
                placeholder="Or paste scanned code here..."
                value={scannedCode}
                onChange={(e) => setScannedCode(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleScan()}
                className="pl-12 h-12 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-base focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                autoFocus
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-2">
              <Button
                className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-semibold h-12 shadow-lg shadow-red-500/30"
                onClick={handleScan}
                disabled={events.find(e => e.id.toString() === selectedEvent)?.status?.toLowerCase() === 'completed'}
              >
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Check In Participant
              </Button>
              <Button
                variant="outline"
                className="w-full font-semibold h-12 border-neutral-300 dark:border-neutral-700"
                onClick={handleCheckOut}
                disabled={events.find(e => e.id.toString() === selectedEvent)?.status?.toLowerCase() !== 'completed' && events.find(e => e.id.toString() === selectedEvent)?.status?.toLowerCase() !== 'concluded'}
              >
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Check Out Participant
              </Button>
            </div>
          </Card>

          {/* Success Feedback */}
          {showSuccess && (
            <Card className="p-6 border-2 border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 shadow-lg shadow-green-500/20 animate-in slide-in-from-bottom duration-300">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg animate-bounce">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <p className="font-bold text-lg text-green-900 dark:text-green-100">{participantName}</p>
                  <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                    {lastAction === 'check-out' ? '✓ Successfully checked out' : '✓ Successfully checked in'}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Enhanced Stats Sidebar */}
        <div className="space-y-4">
          <Card className="p-6 border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm sticky top-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="font-bold text-lg text-neutral-900 dark:text-white">Live Stats</h3>
            </div>

            <div className="space-y-4">
              {/* Checked In */}
              <div className="relative overflow-hidden p-5 rounded-xl bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border border-red-200 dark:border-red-800">
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-2xl -mr-12 -mt-12" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">Checked In</p>
                  </div>
                  <p className="text-4xl font-bold text-red-700 dark:text-red-500">{checkedInCount}</p>
                </div>
              </div>

              {/* Total Expected */}
              <div className="p-5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-neutral-500" />
                  <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Total Expected</p>
                </div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">{totalExpected}</p>
              </div>

              {/* Attendance Rate */}
              <div className="p-5 rounded-xl bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide">Attendance Rate</p>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-purple-700 dark:text-purple-500">{attendanceRate}%</p>
                  {attendanceRate > 0 && (
                    <div className="flex-1">
                      <div className="h-2 bg-purple-200 dark:bg-purple-900/30 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-600 to-violet-600 rounded-full transition-all duration-500"
                          style={{ width: `${attendanceRate}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Enhanced Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <Card className="p-8 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 w-full max-w-md mx-4 shadow-2xl">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0 animate-shake">
                  <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-neutral-900 dark:text-white mb-2">Error</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 whitespace-pre-line">{errorModalMessage}</p>
                </div>
                <button
                  onClick={() => setShowErrorModal(false)}
                  className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <Button
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                onClick={() => setShowErrorModal(false)}
              >
                OK
              </Button>
            </div>
          </Card>
        </div>
      )}

      <style jsx>{`
        @keyframes scan {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(280px); }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  )
}
