'use client'

import { useRouter, useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Save, Loader2, Calendar, MapPin, Clock, Users, FileText, LayoutTemplate, Tag, Lock, Ticket, Upload, Image as ImageIcon } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Event, getEventById } from '@/lib/event-context'
import { adminApi, apiCall } from '@/lib/api-config'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

// Define the precise color palette to match other pages
const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string; gradient: string }> = {
  'STE': { bg: 'bg-blue-800/60', text: 'text-blue-100', border: 'border-blue-400', gradient: 'from-blue-800 to-blue-900' },
  'CET': { bg: 'bg-orange-700/60', text: 'text-orange-100', border: 'border-orange-400', gradient: 'from-orange-700 to-orange-800' },
  'SBME': { bg: 'bg-yellow-600/60', text: 'text-yellow-50', border: 'border-yellow-400', gradient: 'from-yellow-600 to-yellow-700' },
  'CHATME': { bg: 'bg-zinc-700/60', text: 'text-zinc-100', border: 'border-zinc-400', gradient: 'from-zinc-700 to-zinc-800' },
  'HUSOCOM': { bg: 'bg-[#6d174b]/70', text: 'text-fuchsia-100', border: 'border-[#a8326e]', gradient: 'from-[#6d174b] to-[#4d1035]' },
  'COME': { bg: 'bg-sky-800/60', text: 'text-sky-100', border: 'border-sky-400', gradient: 'from-sky-800 to-sky-900' },
  'CCJE': { bg: 'bg-red-800/60', text: 'text-red-100', border: 'border-red-400', gradient: 'from-red-800 to-red-900' },
  'HCDC': { bg: 'bg-gradient-to-r from-blue-700 to-red-600', text: 'text-white', border: 'border-blue-600', gradient: 'from-blue-700 to-red-600' },
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

const getCategoryFromEvent = (event: Event): string => {
  if (event.category === 'HCDC') return 'HCDC'
  const deptAbbr = getDepartmentAbbr(event.department || '')
  return deptAbbr || 'HCDC'
}

export default function EditEventPage() {
  const router = useRouter()
  const params = useParams()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    start_time: '',
    end_time: '',
    location: '',
    speakers: '',
    category: '',
    department: '',
    semester: '',
    school_year: '',
    capacity: '100',
    is_public: true,
    is_paid_event: false,
    ticket_price: '0',
    cover_image: '',
  })

  // Theme support
  const [themeColors, setThemeColors] = useState(CATEGORY_COLORS['HCDC'])

  useEffect(() => {
    const fetchEvent = async () => {
      const eventId = params.id as string
      try {
        const eventUrl = adminApi.eventById(eventId)
        const response = await apiCall.get(eventUrl)

        let targetEvent: Event | null = null

        if (response.ok) {
          targetEvent = await response.json()
        } else {
          // Fallback to local
          targetEvent = getEventById(eventId)
        }

        if (targetEvent) {
          setEvent(targetEvent)

          // Determine theme
          const category = getCategoryFromEvent(targetEvent)
          setThemeColors(CATEGORY_COLORS[category] || CATEGORY_COLORS['HCDC'])

          // Map API fields
          setFormData({
            title: targetEvent.title || targetEvent.name || '',
            description: targetEvent.description || '',
            date: targetEvent.date || '',
            start_time: targetEvent.start_time || targetEvent.startTime || '',
            end_time: targetEvent.end_time || targetEvent.endTime || '',
            location: targetEvent.location || targetEvent.venue || '',
            speakers: Array.isArray(targetEvent.speakers)
              ? targetEvent.speakers.join(', ')
              : (targetEvent.speakers || ''),
            category: targetEvent.category || 'HCDC',
            department: targetEvent.department || '',
            semester: targetEvent.semester || '',
            school_year: targetEvent.school_year || '',
            capacity: String(targetEvent.capacity || '100'),
            is_public: targetEvent.isPublic ?? (targetEvent as any).is_public ?? true,
            is_paid_event: targetEvent.isPaidEvent ?? (targetEvent as any).is_paid_event ?? false,
            ticket_price: String(targetEvent.ticketPrice ?? (targetEvent as any).ticket_price ?? '0'),
            cover_image: targetEvent.coverImage || (targetEvent as any).cover_image || '',
          })
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchEvent()
  }, [params.id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Simple temporary fake upload (base64) for client-side demo if needed, 
    // or ideally this would act like the create page compressor.
    // For now we will try to read as DataURL to preview.
    const reader = new FileReader()
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setFormData(prev => ({ ...prev, cover_image: ev.target!.result as string }))
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    setIsLoading(true)
    setError('')

    try {
      const eventId = params.id as string
      const eventUrl = adminApi.eventById(eventId)

      const payload = {
        ...formData,
        speakers: formData.speakers
          ? formData.speakers.split(',').map(s => s.trim()).filter(Boolean)
          : [],
        capacity: Number(formData.capacity),
        ticket_price: Number(formData.ticket_price),
      }

      const response = await apiCall.patch(eventUrl, payload)

      if (!response.ok) {
        throw new Error('Failed to update event')
      }

      router.push(`/admin/events/${params.id}`)
    } catch (err: any) {
      setError(err.message || 'Failed to update event')
      setIsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    )
  }

  if (!event) return <div className="text-center p-10">Event not found</div>

  return (
    <div className="min-h-screen bg-neutral-50/50 dark:bg-neutral-950 pb-20 animate-in fade-in duration-500">

      {/* 1. Header / Hero - USING EVENT BANNER */}
      <div className="relative h-80 w-full overflow-hidden bg-neutral-900 group">
        {formData.cover_image ? (
          <img
            src={formData.cover_image}
            alt="Cover"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-r ${themeColors.gradient}`} />
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />

        <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-12 max-w-[1700px] mx-auto">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="w-fit mb-4 text-white/80 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Cancel & Back
          </Button>
          <h1 className="text-4xl font-bold text-white flex items-center gap-3">
            <LayoutTemplate className="w-8 h-8 text-white/80" />
            Edit Event Details
          </h1>
          <p className="text-white/70 mt-2 max-w-2xl">
            Update core info, logistics, and branding for <span className="font-semibold text-white">"{event.name || event.title}"</span>.
          </p>

          {/* Integrated Cover Upload Trigger */}
          <div className="mt-6 relative">
            <input
              type="file"
              onChange={handleCoverUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              accept="image/*"
            />
            <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-md">
              <ImageIcon className="w-4 h-4 mr-2" /> Change Cover Photo
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Form Grid */}
      <div className="max-w-[1700px] mx-auto px-6 -mt-10 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT COLUMN: Main Form */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="p-8 border-none shadow-xl bg-white dark:bg-neutral-900 rounded-2xl space-y-8">

              {error && (
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 text-sm font-medium">
                  {error}
                </div>
              )}

              {/* Section 1: Core Info */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-neutral-200 dark:border-neutral-800">
                  <FileText className="w-5 h-5 text-neutral-500" />
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Core Information</h2>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-neutral-700 dark:text-neutral-300">Event Title</Label>
                    <Input
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className="bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 h-12 text-lg font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-neutral-700 dark:text-neutral-300">Description</Label>
                    <Textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      className="bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 min-h-[150px] resize-y"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Logistics */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-neutral-200 dark:border-neutral-800">
                  <Calendar className="w-5 h-5 text-neutral-500" />
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Date & Time</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-neutral-700 dark:text-neutral-300">Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
                      <Input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        className="pl-10 bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-neutral-700 dark:text-neutral-300">Start Time</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
                      <Input
                        type="time"
                        name="start_time"
                        value={formData.start_time}
                        onChange={handleChange}
                        className="pl-10 bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-neutral-700 dark:text-neutral-300">End Time</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
                      <Input
                        type="time"
                        name="end_time"
                        value={formData.end_time}
                        onChange={handleChange}
                        className="pl-10 bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Settings (Category, Semester, Capacity) */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-neutral-200 dark:border-neutral-800">
                  <Tag className="w-5 h-5 text-neutral-500" />
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Categorization & Limits</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-neutral-700 dark:text-neutral-300">Semester</Label>
                    <Select value={formData.semester} onValueChange={(v) => handleSelectChange('semester', v)}>
                      <SelectTrigger className="bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700">
                        <SelectValue placeholder="Select Semester" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="First Semester">First Semester</SelectItem>
                        <SelectItem value="Second Semester">Second Semester</SelectItem>
                        <SelectItem value="Summer">Summer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-neutral-700 dark:text-neutral-300">School Year</Label>
                    <Select value={formData.school_year} onValueChange={(v) => handleSelectChange('school_year', v)}>
                      <SelectTrigger className="bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700">
                        <SelectValue placeholder="Select School Year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2024-2025">2024-2025</SelectItem>
                        <SelectItem value="2025-2026">2025-2026</SelectItem>
                        <SelectItem value="2026-2027">2026-2027</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-neutral-700 dark:text-neutral-300">Max Capacity</Label>
                    <Input
                      type="number"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleChange}
                      className="bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-neutral-700 dark:text-neutral-300">Venue</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
                      <Input
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        className="pl-10 bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* RIGHT COLUMN: Sidebar Settings */}
          <div className="lg:col-span-4 space-y-6">

            {/* Save Card */}
            <Card className="p-6 border-none shadow-xl bg-white dark:bg-neutral-900 rounded-2xl sticky top-6">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">Publish Settings</h3>

              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-neutral-500" />
                    <Label className="cursor-pointer" htmlFor="is-public">Public Event</Label>
                  </div>
                  <Switch
                    id="is-public"
                    checked={formData.is_public}
                    onCheckedChange={(c) => handleSwitchChange('is_public', c)}
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800">
                  <div className="flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-neutral-500" />
                    <Label className="cursor-pointer" htmlFor="is-paid">Paid Event</Label>
                  </div>
                  <Switch
                    id="is-paid"
                    checked={formData.is_paid_event}
                    onCheckedChange={(c) => handleSwitchChange('is_paid_event', c)}
                  />
                </div>
                {formData.is_paid_event && (
                  <div className="space-y-2 animate-in slide-in-from-top-2">
                    <Label className="text-neutral-700 dark:text-neutral-300">Ticket Price (₱)</Label>
                    <Input
                      type="number"
                      name="ticket_price"
                      value={formData.ticket_price}
                      onChange={handleChange}
                      className="bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
                    />
                  </div>
                )}
              </div>

              <Button
                className={`w-full h-12 text-base font-bold shadow-lg shadow-blue-500/20 text-white ${themeColors.bg} hover:brightness-110`}
                onClick={handleSave}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" /> Save Changes
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                onClick={() => router.back()}
                disabled={isLoading}
                className="w-full mt-2"
              >
                Discard Changes
              </Button>
            </Card>

            {/* Speakers Quick Edit */}
            <Card className="p-6 border-none shadow-lg bg-white dark:bg-neutral-900 rounded-2xl">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-4 flex items-center gap-2">
                <Users className="w-4 h-4" /> Speakers
              </h3>
              <Textarea
                name="speakers"
                value={formData.speakers}
                onChange={handleChange}
                className="bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 min-h-[100px]"
                placeholder="Dr. Doe, Prof. Smith (comma separated)"
              />
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
