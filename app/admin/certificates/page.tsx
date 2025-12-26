'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Award, Download, Calendar, Folder, ChevronRight, Search } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { apiCall, api } from '@/lib/api-config'
import { Input } from '@/components/ui/input'

interface Certificate {
  id: number
  certificate_number: string
  issue_date: string
  status: string
  event_id: number
  event_title: string
  event_date: string
  participant_name: string
  participant_email: string
  created_at: string
}

export default function AdminCertificates() {
  const router = useRouter()
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null)

  useEffect(() => {
    const fetchCertificates = async () => {
      setIsLoading(true)
      try {
        const baseUrl = api.certificates().endsWith('/') ? api.certificates().slice(0, -1) : api.certificates()
        const url = `${baseUrl}/event_certificates/`
        const res = await apiCall.get(url)

        if (res.ok) {
          const data = await res.json()
          setCertificates(Array.isArray(data) ? data : [])
        }
      } catch (err) {
        console.error('[Admin Certificates] Error fetching certificates:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCertificates()
  }, [])

  const certificatesByEvent = useMemo(() => {
    const grouped: Record<number, { event: { id: number; title: string; date: string }; certificates: Certificate[] }> = {}

    certificates.forEach(cert => {
      if (!grouped[cert.event_id]) {
        grouped[cert.event_id] = {
          event: { id: cert.event_id, title: cert.event_title, date: cert.event_date },
          certificates: [],
        }
      }
      grouped[cert.event_id].certificates.push(cert)
    })

    return grouped
  }, [certificates])

  const filteredGroups = useMemo(() => {
    if (!searchTerm) return certificatesByEvent

    const filtered: typeof certificatesByEvent = {}
    Object.entries(certificatesByEvent).forEach(([eventId, group]) => {
      const matchesEvent = group.event.title.toLowerCase().includes(searchTerm.toLowerCase())
      const matchingCerts = group.certificates.filter(cert =>
        cert.participant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.participant_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.certificate_number.toLowerCase().includes(searchTerm.toLowerCase())
      )

      if (matchesEvent || matchingCerts.length > 0) {
        filtered[Number(eventId)] = {
          ...group,
          certificates: matchesEvent ? group.certificates : matchingCerts,
        }
      }
    })

    return filtered
  }, [certificatesByEvent, searchTerm])

  const handleDownload = async (certId: number, certNumber: string) => {
    try {
      const baseUrl = api.certificates().endsWith('/') ? api.certificates().slice(0, -1) : api.certificates()
      const url = `${baseUrl}/${certId}/download/`
      const res = await apiCall.get(url)

      if (res.ok) {
        const data = await res.json()

        if (data.pdf_base64) {
          const base64Data = data.pdf_base64.includes(',') ? data.pdf_base64.split(',')[1] : data.pdf_base64
          const byteCharacters = atob(base64Data)
          const byteNumbers = new Array(byteCharacters.length)
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i)
          }
          const byteArray = new Uint8Array(byteNumbers)
          const blob = new Blob([byteArray], { type: 'application/pdf' })

          const downloadUrl = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = downloadUrl
          link.download = `${certNumber}.pdf`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(downloadUrl)
        }
      }
    } catch (err) {
      console.error('[Admin Certificates] Error downloading certificate:', err)
      alert('Failed to download certificate. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50/50 dark:bg-neutral-950 p-6 space-y-8 max-w-[1700px] mx-auto animate-in fade-in duration-500">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Award className="w-6 h-6 text-red-500 dark:text-red-400" />
          <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">Certificate Management</h1>
        </div>
        <p className="text-neutral-500 dark:text-neutral-400">View and manage all generated certificates organized by event.</p>
      </div>

      <Card className="p-4 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <Input
              placeholder="Search by event name, participant, or certificate number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
            <Folder className="w-4 h-4" />
            <span className="font-medium">{Object.keys(filteredGroups).length} Events</span>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <div className="w-12 h-12 border-4 border-neutral-200 dark:border-neutral-800 border-t-red-500 rounded-full animate-spin" />
          <p className="text-neutral-500 dark:text-neutral-400 font-medium animate-pulse">Loading certificates...</p>
        </div>
      ) : Object.keys(filteredGroups).length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-neutral-900/50 rounded-3xl border border-neutral-200 dark:border-neutral-800 border-dashed">
          <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8 text-neutral-400" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">No certificates found</h3>
          <p className="text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto mt-2">
            {searchTerm ? 'Try adjusting your search terms.' : 'Certificates will appear here once participants complete evaluations.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Object.entries(filteredGroups).map(([eventId, group]) => {
            const eventDate = new Date(group.event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            const sentCount = group.certificates.filter(c => c.status === 'sent').length

            return (
              <Card
                key={eventId}
                onClick={() => setSelectedEvent(selectedEvent === Number(eventId) ? null : Number(eventId))}
                className="group cursor-pointer border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden hover:border-red-300 dark:hover:border-red-800 hover:shadow-lg transition-all duration-300"
              >
                <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 p-6 border-b border-neutral-200 dark:border-neutral-800">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shrink-0 shadow-lg">
                      <Folder className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-neutral-900 dark:text-white line-clamp-2 leading-tight mb-1">{group.event.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                        <Calendar className="w-3 h-3" />
                        <span>{eventDate}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                      <div className="text-2xl font-bold text-neutral-900 dark:text-white">{group.certificates.length}</div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Total</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950/30">
                      <div className="text-2xl font-bold text-green-700 dark:text-green-400">{sentCount}</div>
                      <div className="text-xs text-green-600 dark:text-green-500 mt-1">Emailed</div>
                    </div>
                  </div>

                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/admin/events/${eventId}`)
                    }}
                    className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white"
                  >
                    View Details
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>

                {selectedEvent === Number(eventId) && (
                  <div className="border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30 p-4 space-y-2 max-h-96 overflow-y-auto">
                    <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-3">
                      Certificates ({group.certificates.length})
                    </div>
                    {group.certificates.map((cert) => (
                      <div
                        key={cert.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-red-300 dark:hover:border-red-800 transition-colors"
                      >
                        <div className="flex-1 min-w-0 mr-3">
                          <div className="font-medium text-sm text-neutral-900 dark:text-white truncate">{cert.participant_name}</div>
                          <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{cert.participant_email}</div>
                        </div>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDownload(cert.id, cert.certificate_number)
                          }}
                          className="shrink-0 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200"
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
