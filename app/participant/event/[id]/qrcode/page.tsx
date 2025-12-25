'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft, X, Download, QrCode, MapPin, Calendar, User, Hash, Ticket } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { api, apiCall, getAuthenticatedUserEmail, authApi, apiRequest } from '@/lib/api-config'
import { QRCodeSVG } from 'qrcode.react'

// --- COLOR PALETTE & HELPERS (Copied for consistency) ---
const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string; gradient: string }> = {
  'STE': { bg: 'bg-blue-600', text: 'text-blue-100', border: 'border-blue-400', gradient: 'from-blue-600 to-blue-900' },
  'CET': { bg: 'bg-orange-600', text: 'text-orange-100', border: 'border-orange-400', gradient: 'from-orange-600 to-orange-900' },
  'SBME': { bg: 'bg-yellow-500', text: 'text-yellow-50', border: 'border-yellow-400', gradient: 'from-yellow-500 to-yellow-800' },
  'CHATME': { bg: 'bg-zinc-600', text: 'text-zinc-100', border: 'border-zinc-400', gradient: 'from-zinc-600 to-zinc-900' },
  'HUSOCOM': { bg: 'bg-[#831843]', text: 'text-pink-100', border: 'border-pink-500', gradient: 'from-[#831843] to-[#500724]' },
  'COME': { bg: 'bg-sky-600', text: 'text-sky-100', border: 'border-sky-400', gradient: 'from-sky-600 to-sky-900' },
  'CCJE': { bg: 'bg-red-600', text: 'text-red-100', border: 'border-red-400', gradient: 'from-red-600 to-red-900' },
  'HCDC': { bg: 'bg-red-700', text: 'text-white', border: 'border-red-600', gradient: 'from-red-900 to-red-900' },
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

const getDepartmentAbbr = (fullName: string): string | null => {
  if (!fullName) return null
  if (Object.values(DEPARTMENT_ABBR).includes(fullName as any)) {
    return fullName
  }
  return DEPARTMENT_ABBR[fullName as keyof typeof DEPARTMENT_ABBR] || null
}

const getCategoryFromEvent = (event: any): string => {
  if (event.category === 'HCDC') return 'HCDC'
  const deptAbbr = getDepartmentAbbr(event.department || '')
  return deptAbbr || 'HCDC'
}
// ---------------------------------------------------------

type RegistrationPayload = {
  id: number
  first_name: string
  last_name: string
  email: string
  qr_code: string | null
  qr_code_value: string | null
}

export default function ParticipantQRCode() {
  const router = useRouter()
  const params = useParams()
  // const [showModal, setShowModal] = useState(true) // No longer using a modal overlay, full page focused
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [registration, setRegistration] = useState<RegistrationPayload | null>(null)
  const [event, setEvent] = useState<any | null>(null)
  const [userProfile, setUserProfile] = useState<{ department?: string; program?: string } | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const eventId = params.id as string
      const email = await getAuthenticatedUserEmail()

      if (!email) {
        setError('You must be signed in to view your QR code.')
        setLoading(false)
        return
      }

      try {
        // 1. Fetch Event Details (for Colors & Info)
        const eventRes = await apiCall.get(api.eventById(eventId))
        if (eventRes.ok) {
          const eventData = await eventRes.json()
          setEvent(eventData)
        }

        // 2. Fetch User Profile
        const profileResponse = await apiRequest(authApi.me(), { method: 'GET' })
        if (profileResponse.ok) {
          const profileData = await profileResponse.json()
          if (profileData.authenticated && profileData.user) {
            setUserProfile({
              department: profileData.user.department || '',
              program: profileData.user.program || '',
            })
          }
        }

        // 3. Fetch Registration
        const baseUrl = api.registrations().endsWith('/')
          ? api.registrations().slice(0, -1)
          : api.registrations()
        const url = `${baseUrl}/?event=${encodeURIComponent(eventId)}&email=${encodeURIComponent(email)}`

        const res = await apiCall.get(url)
        if (!res.ok) throw new Error('Unable to load registration data.')
        const data = await res.json()

        const registrations = Array.isArray(data)
          ? data
          : (data.results || data.data || [])

        if (registrations.length === 0) {
          setError('No registration found for this event.')
        } else {
          setRegistration(registrations[0])
        }
      } catch (err: any) {
        console.error(err)
        setError(err.message ?? 'Unable to load your QR code.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.id])

  const handleDownload = () => {
    if (registration?.qr_code) {
      const link = document.createElement('a')
      link.href = `data:image/png;base64,${registration.qr_code}`
      link.download = `ticket-${event?.name || 'event'}.png`
      link.click()
      return
    }

    // Convert SVG to PNG
    const svgEl = document.getElementById('qr-svg')
    if (svgEl) {
      const serializer = new XMLSerializer()
      const svgStr = serializer.serializeToString(svgEl as any)
      const img = new Image()

      // Create a canvas to draw the image
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        if (ctx) {
          ctx.fillStyle = 'white'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(img, 0, 0)

          const pngUrl = canvas.toDataURL('image/png')
          const link = document.createElement('a')
          link.href = pngUrl
          link.download = `ticket-${event?.name || 'event'}.png`
          link.click()
        }
      }

      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgStr)))
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 py-12 px-4 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Skeleton Background */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-neutral-200 to-transparent dark:from-white/5 opacity-20 blur-3xl animate-pulse" />

      <div className="max-w-md w-full relative z-10">
        <div className="bg-white dark:bg-neutral-900 rounded-3xl overflow-hidden shadow-2xl border border-neutral-100 dark:border-neutral-800">
          {/* Header Skeleton */}
          <div className="h-32 bg-neutral-200 dark:bg-neutral-800 animate-pulse p-6 flex flex-col justify-between relative">
            <div className="flex justify-between items-start">
              <div className="h-4 w-24 bg-neutral-300 dark:bg-neutral-700 rounded-full" />
              <div className="h-8 w-8 bg-neutral-300 dark:bg-neutral-700 rounded-full" />
            </div>
            <div className="space-y-2">
              <div className="h-6 w-3/4 bg-neutral-300 dark:bg-neutral-700 rounded-lg" />
              <div className="h-3 w-1/2 bg-neutral-300 dark:bg-neutral-700 rounded-lg" />
            </div>
          </div>

          {/* Body Skeleton */}
          <div className="p-6 flex flex-col items-center">
            <div className="w-48 h-48 bg-neutral-100 dark:bg-neutral-800 rounded-2xl animate-pulse mb-6" />

            <div className="w-full bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
              <div className="space-y-2 flex-1">
                <div className="h-3 w-16 bg-neutral-200 dark:bg-neutral-700 rounded" />
                <div className="h-4 w-32 bg-neutral-300 dark:bg-neutral-600 rounded" />
              </div>
            </div>
          </div>

          {/* Footer Skeleton */}
          <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
            <div className="h-3 w-24 bg-neutral-200 dark:bg-neutral-700 rounded" />
            <div className="h-8 w-28 bg-neutral-300 dark:bg-neutral-600 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
  if (error) return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white p-4">
      <p className="text-red-400 mb-4">{error}</p>
      <Button onClick={() => router.back()} variant="outline">Go Back</Button>
    </div>
  )

  // Determine Styles
  const eventCategory = event ? getCategoryFromEvent(event) : 'HCDC'
  const colors = CATEGORY_COLORS[eventCategory] || CATEGORY_COLORS['HCDC']

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 py-12 px-4 flex flex-col items-center justify-center relative overflow-hidden">

      {/* Background Decor */}
      <div className={`absolute top-0 left-0 w-full h-96 bg-gradient-to-b ${colors.gradient} opacity-10 blur-3xl`} />

      {/* Header Actions */}
      <div className="absolute top-6 left-6 z-10">
        <Button onClick={() => router.back()} variant="ghost" className="hover:bg-black/5 dark:hover:bg-white/10">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
      </div>

      <div className="max-w-md w-full relative z-10 animate-in fade-in zoom-in duration-500">

        {/* HOLOGRAPHIC CARD CONTAINER */}
        <div className="relative group">
          {/* Border Effect */}
          <div className={`absolute -inset-1 bg-gradient-to-r ${colors.gradient} opacity-50 blur-lg`} />

          <div className="relative bg-white dark:bg-neutral-900 rounded-3xl overflow-hidden shadow-2xl">

            {/* TICKET HEADER */}
            <div className={`h-32 ${colors.bg} relative overflow-hidden p-6 text-white flex flex-col justify-between`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />

              <div className="flex justify-between items-start z-10">
                <div className="flex items-center gap-2 opacity-90">
                  <Ticket className="w-5 h-5" />
                  <span className="text-xs font-bold tracking-widest uppercase">Official Entry Pass</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                  <span className="font-bold text-xs">{eventCategory}</span>
                </div>
              </div>

              <div className="z-10">
                <h2 className="font-black text-xl leading-tight line-clamp-1">{event?.name}</h2>
                <p className="text-white/80 text-xs mt-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {new Date(event?.date).toLocaleDateString()}
                  <span className="opacity-50 mx-1">|</span>
                  <MapPin className="w-3 h-3" /> {event?.venue || event?.location}
                </p>
              </div>
            </div>

            {/* TICKET BODY */}
            <div className="p-6">
              <div className="flex flex-col items-center justify-center mb-6">
                {/* QR Code Container */}
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-800 mb-4">
                  {registration?.qr_code ? (
                    <img
                      src={`data:image/png;base64,${registration.qr_code}`}
                      alt="QR Code"
                      className="w-48 h-48 object-contain"
                    />
                  ) : (
                    <QRCodeSVG
                      id="qr-svg"
                      value={registration?.qr_code_value || `REG-${params.id}-${registration?.email}`}
                      size={192}
                      level="H"
                      includeMargin={true}
                    />
                  )}
                </div>
                <div className="flex items-center gap-2 text-neutral-400">
                  <Hash className="w-3 h-3" />
                  <span className="font-mono text-xs tracking-widest">{registration?.qr_code_value || 'NO-CODE'}</span>
                </div>
              </div>

              {/* Attendee Info */}
              <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${colors.bg} flex items-center justify-center text-white font-bold shadow-md`}>
                    {registration?.first_name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 uppercase font-bold tracking-wider">Attendee</p>
                    <p className="font-bold text-neutral-900 dark:text-white leading-none">
                      {registration?.first_name} {registration?.last_name}
                    </p>
                  </div>
                </div>
                {userProfile?.department && (
                  <div className="pl-[52px]">
                    <p className="text-xs text-neutral-500 uppercase font-bold tracking-wider">Affiliation</p>
                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      {userProfile.department}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* FOOTER */}
            <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <p className="text-[10px] text-neutral-400 font-medium uppercase tracking-widest">
                Scannable at entrance
              </p>
              <Button size="sm" onClick={handleDownload} className={`${colors.bg} text-white border-none shadow-lg hover:opacity-90`}>
                <Download className="w-3 h-3 mr-2" /> Save Ticket
              </Button>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
