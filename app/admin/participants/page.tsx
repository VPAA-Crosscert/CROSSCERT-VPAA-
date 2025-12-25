'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Search, CheckCircle, AlertCircle, X, Users, UserCheck, ClipboardCheck, QrCode, Filter, Download } from 'lucide-react'
import { useState, useEffect } from 'react'
import { api, apiCall } from '@/lib/api-config'
import { QRCodeSVG } from 'qrcode.react'

type EventRecord = {
  id: number
  title: string
}

type RegistrationRecord = {
  id: number
  event: number
  email: string
  first_name: string
  last_name: string
  qr_code?: string | null
  qr_code_value?: string | null
  registered_at?: string
  is_present?: boolean
  has_evaluated?: boolean
  is_checked_out?: boolean
}

export default function AdminParticipants() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [participants, setParticipants] = useState<
    {
      id: number
      name: string
      email: string
      eventName: string
      qr_code?: string | null
      qr_code_value?: string | null
      registered_at?: string
      is_present?: boolean
      has_evaluated?: boolean
      is_checked_out?: boolean
    }[]
  >([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedParticipant, setSelectedParticipant] = useState<typeof participants[0] | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, regsRes] = await Promise.all([
          apiCall.get(api.events()),
          apiCall.get(api.registrations()),
        ])

        if (!eventsRes.ok || !regsRes.ok) {
          if (eventsRes.status === 403 || regsRes.status === 403) {
            throw new Error('Access denied. Please ensure you are logged in as an admin.')
          }
          throw new Error('Unable to load participants data.')
        }

        const eventsData = await eventsRes.json()
        const registrationsData = await regsRes.json()

        const events: EventRecord[] = Array.isArray(eventsData)
          ? eventsData
          : (eventsData.results || eventsData.data || [])

        const registrations: RegistrationRecord[] = Array.isArray(registrationsData)
          ? registrationsData
          : (registrationsData.results || registrationsData.data || [])

        const eventMap = new Map<number, string>()
        if (Array.isArray(events)) {
          events.forEach((evt) => {
            if (evt && evt.id && evt.title) {
              eventMap.set(evt.id, evt.title)
            }
          })
        }

        const flat = Array.isArray(registrations)
          ? registrations.map((reg) => ({
            id: reg.id,
            name: `${reg.first_name || ''} ${reg.last_name || ''}`.trim() || 'Unknown',
            email: reg.email || 'No email',
            eventName: eventMap.get(reg.event) || `Event #${reg.event}`,
            qr_code: reg.qr_code || null,
            qr_code_value: reg.qr_code_value || null,
            registered_at: reg.registered_at,
            is_present: reg.is_present,
            has_evaluated: reg.has_evaluated,
            is_checked_out: reg.is_checked_out,
          }))
          : []

        setParticipants(flat)
      } catch (err: any) {
        setError(err.message || 'Unable to load participants.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const filteredParticipants = participants.filter(p =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Derived Stats
  const totalParticipants = participants.length
  const totalCheckedIn = participants.filter(p => p.is_present || p.is_checked_out).length
  const totalEvaluated = participants.filter(p => p.has_evaluated).length

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
            <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">Participants</h1>
          </div>
          <p className="text-neutral-500 dark:text-neutral-400 ml-12">Manage registrations, check-ins, and participant details.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="relative overflow-hidden p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-red-100 dark:border-red-900 shadow-sm hover:shadow-md transition-all group">
          <div className="absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 rounded-full bg-red-50 dark:bg-red-900/20 group-hover:scale-110 transition-transform duration-500" />
          <div className="relative">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Total Registered</h3>
            </div>
            <p className="text-3xl font-bold text-neutral-900 dark:text-white">{totalParticipants}</p>
          </div>
        </div>
        <div className="relative overflow-hidden p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-emerald-100 dark:border-emerald-900 shadow-sm hover:shadow-md transition-all group">
          <div className="absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 rounded-full bg-emerald-50 dark:bg-emerald-900/20 group-hover:scale-110 transition-transform duration-500" />
          <div className="relative">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <UserCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Checked In</h3>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-neutral-900 dark:text-white">{totalCheckedIn}</p>
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-500">
                {totalParticipants > 0 ? Math.round((totalCheckedIn / totalParticipants) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-purple-100 dark:border-purple-900 shadow-sm hover:shadow-md transition-all group">
          <div className="absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 rounded-full bg-purple-50 dark:bg-purple-900/20 group-hover:scale-110 transition-transform duration-500" />
          <div className="relative">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <ClipboardCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Evaluations</h3>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-neutral-900 dark:text-white">{totalEvaluated}</p>
              {totalCheckedIn > 0 && (
                <span className="text-sm font-medium text-purple-600 dark:text-purple-500">
                  {Math.round((totalEvaluated / totalCheckedIn) * 100)}% of attendees
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <Card className="p-4 border border-destructive bg-destructive/10 text-sm text-destructive flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </Card>
      )}

      {/* Main Content Card */}
      <Card className="border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-xl shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative group w-full sm:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-neutral-400 group-focus-within:text-red-500 transition-colors" />
            </div>
            <Input
              placeholder="Search by name, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus:ring-red-500/20 transition-all font-medium"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" className="gap-2 text-neutral-600 dark:text-neutral-400">
              <Filter className="w-4 h-4" />
              Filter
            </Button>
          </div>
        </div>

        {/* Modern Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/20">
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Participant</th>
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Event</th>
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Status</th>
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-neutral-400 animate-pulse">
                    Loading participants...
                  </td>
                </tr>
              ) : filteredParticipants.length > 0 ? (
                filteredParticipants.map((participant, idx) => (
                  <tr key={idx} className="group hover:bg-neutral-50/80 dark:hover:bg-neutral-900/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-sm font-bold text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                          {participant.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-neutral-900 dark:text-neutral-100">{participant.name}</p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">{participant.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 max-w-[200px] truncate">
                        {participant.eventName}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1.5 items-start">
                        {/* Base Status: Registered */}
                        <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                          <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                          Registered
                        </div>

                        {/* Dynamic Pills */}
                        <div className="flex flex-wrap gap-2">
                          {participant.is_present && !participant.is_checked_out && !participant.has_evaluated && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
                              Checked In
                            </span>
                          )}
                          {participant.is_checked_out && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">
                              Checked Out
                            </span>
                          )}
                          {participant.has_evaluated && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/50">
                              Evaluated
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {(participant.qr_code || participant.qr_code_value) ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedParticipant(participant)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 gap-2"
                        >
                          <QrCode className="w-4 h-4" />
                          View ID
                        </Button>
                      ) : (
                        <span className="text-xs text-neutral-400 italic">No QR</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-neutral-500">
                    <div className="flex flex-col items-center justify-center">
                      <Users className="w-10 h-10 text-neutral-300 mb-3" />
                      <p>No participants found matching your criteria</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modern QR ID Modal */}
      {selectedParticipant && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-sm bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden relative">
            <button
              onClick={() => setSelectedParticipant(null)}
              className="absolute top-3 right-3 p-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* ID Badge Header */}
            <div className="bg-gradient-to-br from-red-600/10 via-red-600/5 to-transparent p-6 text-center border-b border-neutral-100 dark:border-neutral-800">
              <div className="w-20 h-20 mx-auto rounded-full bg-white dark:bg-neutral-800 flex items-center justify-center text-2xl font-bold text-neutral-800 dark:text-neutral-200 shadow-sm border border-neutral-100 dark:border-neutral-700 mb-3">
                {selectedParticipant.name.charAt(0)}
              </div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white leading-tight">
                {selectedParticipant.name}
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 truncate">{selectedParticipant.email}</p>
            </div>

            {/* QR Section */}
            <div className="p-8 flex flex-col items-center">
              <div className="bg-white p-3 rounded-xl border border-neutral-200 shadow-sm mb-6">
                {selectedParticipant.qr_code ? (
                  <img
                    src={`data:image/png;base64,${selectedParticipant.qr_code}`}
                    alt="QR Code"
                    className="w-48 h-48 object-contain"
                  />
                ) : selectedParticipant.qr_code_value ? (
                  <QRCodeSVG
                    value={selectedParticipant.qr_code_value}
                    size={192}
                    level="H"
                    includeMargin={true}
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center bg-neutral-50 text-neutral-400 text-xs">
                    No QR Generated
                  </div>
                )}
              </div>

              <div className="text-center w-full bg-neutral-50 dark:bg-neutral-800/50 p-3 rounded-lg border border-neutral-100 dark:border-neutral-800 font-mono text-sm text-neutral-600 dark:text-neutral-300 break-all select-all">
                {selectedParticipant.qr_code_value || 'ID-UNKNOWN'}
              </div>
            </div>

            {/* Event Info Footer */}
            <div className="bg-neutral-50 dark:bg-neutral-950/50 p-4 border-t border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-600/10 flex items-center justify-center text-red-600 shrink-0">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Registered Event</p>
                  <p className="text-sm font-bold text-neutral-900 dark:text-neutral-200 truncate">{selectedParticipant.eventName}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button className="flex-1 w-full bg-red-600 hover:bg-red-700 text-white" onClick={() => window.print()}>
                  Print Badge
                </Button>
              </div>
            </div>

          </Card>
        </div>
      )}
    </div>
  )
}
