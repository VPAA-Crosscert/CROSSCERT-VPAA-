'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Download, Mail, CheckCircle, Filter, FileText, ArrowLeft, RefreshCw, Send, Printer } from 'lucide-react'
import { useState, useEffect } from 'react'
import { api, apiCall, adminApi } from '@/lib/api-config'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type CertificateRecord = {
  id: number
  registration: number
  certificate_file?: string | null
  issued_at: string
  is_emailed: boolean
  email_sent_at?: string | null
  participant_name?: string
  participant_email?: string
  event_title?: string
  event_id?: number
}

type EventRecord = {
  id: number
  title: string
  status: string
}

export default function AdminCertificates() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEvent, setSelectedEvent] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [certificates, setCertificates] = useState<CertificateRecord[]>([])
  const [events, setEvents] = useState<EventRecord[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, certificatesRes] = await Promise.all([
          apiCall.get(adminApi.events()),
          apiCall.get(adminApi.certificates()),
        ])

        if (!eventsRes.ok || !certificatesRes.ok) {
          throw new Error('Unable to load certificates data.')
        }

        const eventsData = await eventsRes.json()
        const certificatesData = await certificatesRes.json()

        const eventsList: EventRecord[] = Array.isArray(eventsData)
          ? eventsData
          : (eventsData.results || eventsData.data || [])

        const certificatesList: CertificateRecord[] = Array.isArray(certificatesData)
          ? certificatesData
          : (certificatesData.results || certificatesData.data || [])

        const enrichedCertificates = await Promise.all(
          certificatesList.map(async (cert) => {
            try {
              const regRes = await apiCall.get(`${api.registrations()}/${cert.registration}/`)
              if (regRes.ok) {
                const reg = await regRes.json()
                const eventRes = await apiCall.get(api.eventById(reg.event))
                if (eventRes.ok) {
                  const event = await eventRes.json()
                  return {
                    ...cert,
                    event_title: event.title,
                    event_id: event.id,
                    participant_name: `${reg.first_name} ${reg.last_name}`,
                    participant_email: reg.email,
                  }
                }
              }
            } catch (err) {
              console.warn(`Could not fetch details for certificate ${cert.id}:`, err)
            }
            return cert
          })
        )

        setEvents(eventsList)
        setCertificates(enrichedCertificates)
      } catch (err: any) {
        setError(err.message || 'Unable to load certificates.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const filteredCertificates = certificates.filter((cert) => {
    const matchesSearch =
      cert.participant_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.participant_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.event_title?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesEvent = selectedEvent === 'all' || String(cert.event_id) === selectedEvent
    const certStatus = cert.certificate_file
      ? (cert.is_emailed ? 'sent' : 'generated')
      : 'pending'
    const matchesStatus = selectedStatus === 'all' || certStatus === selectedStatus

    return matchesSearch && matchesEvent && matchesStatus
  })

  const handleGenerateCertificate = async (certId: number) => {
    setProcessingIds(prev => new Set(prev).add(certId))
    try {
      const cert = certificates.find(c => c.id === certId)
      if (!cert) {
        throw new Error('Certificate not found')
      }

      const response = await apiCall.post(`${adminApi.certificates()}${cert.registration}/generate_certificate/`, {})
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to generate certificate')
      }

      alert('Certificate generated successfully!')
      window.location.reload()
    } catch (err: any) {
      alert(err.message || 'Failed to generate certificate')
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(certId)
        return newSet
      })
    }
  }

  const handleSendEmail = async (certId: number) => {
    setProcessingIds(prev => new Set(prev).add(certId))
    try {
      const response = await apiCall.post(`${adminApi.certificates()}${certId}/send_email/`, {})
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to send email')
      }
      alert('Certificate email sent successfully!')
      window.location.reload()
    } catch (err: any) {
      alert(err.message || 'Failed to send email')
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(certId)
        return newSet
      })
    }
  }

  const handleDownloadCertificate = async (cert: CertificateRecord) => {
    if (!cert.certificate_file) {
      alert('Certificate file not available. Please generate it first.')
      return
    }

    try {
      const fileUrl = cert.certificate_file.startsWith('http')
        ? cert.certificate_file
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${cert.certificate_file}`

      const response = await fetch(fileUrl)
      if (!response.ok) {
        throw new Error('Failed to download certificate')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `certificate-${cert.id}.pdf`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      alert(err.message || 'Failed to download certificate')
    }
  }

  const getCertificateStatus = (cert: CertificateRecord): 'pending' | 'generated' | 'sent' => {
    if (cert.certificate_file) {
      return cert.is_emailed ? 'sent' : 'generated'
    }
    return 'pending'
  }

  const statusColors = {
    pending: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
    generated: 'text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800',
    sent: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
  }

  // Stats
  const totalCertificates = certificates.length
  const totalGenerated = certificates.filter(c => getCertificateStatus(c) === 'generated' || getCertificateStatus(c) === 'sent').length
  const totalSent = certificates.filter(c => getCertificateStatus(c) === 'sent').length

  return (
    <div className="min-h-screen bg-neutral-50/50 dark:bg-neutral-950 p-6 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors text-neutral-500"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">Certificates</h1>
          </div>
          <p className="text-neutral-500 dark:text-neutral-400 ml-12">Generate, preview, and distribute certificates.</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Total Issuable</p>
            <p className="text-3xl font-bold text-neutral-900 dark:text-white mt-1">{totalCertificates}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 dark:text-neutral-400">
            <FileText className="w-6 h-6" />
          </div>
        </div>
        <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-rose-200 dark:border-rose-900 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wide">Generated</p>
            <p className="text-3xl font-bold text-rose-700 dark:text-rose-500 mt-1">{totalGenerated}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <Printer className="w-6 h-6" />
          </div>
        </div>
        <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-emerald-200 dark:border-emerald-900 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Sent via Email</p>
            <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-500 mt-1">{totalSent}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Send className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-6">

        {/* Filters Bar */}
        <Card className="p-4 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
              <Input
                placeholder="Search by name, email, event..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-md">
                <Filter className="w-4 h-4 text-neutral-500" />
                <select
                  value={selectedEvent}
                  onChange={(e) => setSelectedEvent(e.target.value)}
                  className="bg-transparent border-none text-sm font-medium text-neutral-700 dark:text-neutral-300 focus:ring-0 cursor-pointer"
                >
                  <option value="all">All Events</option>
                  {events.map((event) => (
                    <option key={event.id} value={String(event.id)}>
                      {event.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-md">
                <CheckCircle className="w-4 h-4 text-neutral-500" />
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="bg-transparent border-none text-sm font-medium text-neutral-700 dark:text-neutral-300 focus:ring-0 cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="generated">Generated</option>
                  <option value="sent">Sent</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Certificates Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-64 bg-neutral-200 dark:bg-neutral-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredCertificates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCertificates.map((cert) => {
              const status = getCertificateStatus(cert)
              return (
                <div key={cert.id} className="group relative bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">

                  {/* Status Badge */}
                  <div className="absolute top-4 right-4 z-10">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border shadow-sm ${statusColors[status]}`}>
                      {status}
                    </span>
                  </div>

                  {/* Top Preview Area (Abstract) */}
                  <div className="h-32 bg-neutral-100 dark:bg-neutral-800 relative overflow-hidden flex items-center justify-center p-6 text-center">
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-400 via-neutral-100 to-transparent" />
                    {status === 'pending' ? (
                      <FileText className="w-12 h-12 text-neutral-300 dark:text-neutral-600" />
                    ) : (
                      <img
                        src="/certificate-placeholder.png"
                        onError={(e) => e.currentTarget.style.display = 'none'}
                        className="w-full h-full object-cover opacity-50 blur-[1px] group-hover:blur-0 transition-all"
                      />
                    )}
                    <div className="relative z-10">
                      <h3 className="font-serif text-xl text-neutral-400 dark:text-neutral-500 opacity-20 pointer-events-none select-none">CERTIFICATE</h3>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="mb-4">
                      <h4 className="font-bold text-neutral-900 dark:text-white line-clamp-1" title={cert.participant_name}>
                        {cert.participant_name || 'Unknown'}
                      </h4>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2 truncate" title={cert.participant_email}>
                        {cert.participant_email}
                      </p>
                      <div className="px-2 py-1 rounded bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 text-xs text-neutral-600 dark:text-neutral-300 truncate">
                        {cert.event_title}
                      </div>
                    </div>

                    <div className="mt-auto grid grid-cols-2 gap-2 opacity-100 sm:opacity-0 sm:translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                      {status === 'pending' ? (
                        <Button
                          size="sm"
                          className="col-span-2 w-full gap-2 bg-neutral-800 dark:bg-neutral-700 hover:bg-neutral-900 dark:hover:bg-neutral-600 text-white"
                          onClick={() => handleGenerateCertificate(cert.id)}
                          disabled={processingIds.has(cert.id)}
                        >
                          {processingIds.has(cert.id) ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                          Generate
                        </Button>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={() => handleDownloadCertificate(cert)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            className={`w-full ${status === 'sent' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
                            onClick={() => handleSendEmail(cert.id)}
                            disabled={processingIds.has(cert.id)}
                          >
                            {processingIds.has(cert.id) ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Mail className="w-4 h-4" />
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-neutral-900 rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 text-neutral-400">
            <FileText className="w-12 h-12 mb-4 opacity-20" />
            <p>No certificates found matching your filters.</p>
          </div>
        )}
      </div>

    </div>
  )
}
