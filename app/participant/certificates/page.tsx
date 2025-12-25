'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Download, Eye, FileText, Loader2, Award, ShieldCheck, Share2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { apiCall, api, getAuthenticatedUserEmail } from '@/lib/api-config'

type CertificateRecord = {
  id: number
  registration: number
  certificate_number: string
  issue_date: string
  status: 'pending' | 'generated' | 'sent'
  pdf_file?: string | null
  pdf_base64?: string | null
  event_title?: string
  participant_email?: string
}

export default function Certificates() {
  const router = useRouter()
  const [certificates, setCertificates] = useState<CertificateRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const userEmail = await getAuthenticatedUserEmail()
        if (!userEmail) {
          setError('Please sign in to view your certificates.')
          setLoading(false)
          return
        }

        const response = await apiCall.get(api.certificates())

        if (!response.ok) {
          if (response.status === 401) {
            setError('Please sign in to view your certificates.')
          } else {
            setError('Unable to load certificates. Please try again later.')
          }
          setLoading(false)
          return
        }

        const data = await response.json()

        const certificatesList: CertificateRecord[] = Array.isArray(data)
          ? data
          : (data.results || data.data || [])

        const enrichedCertificates = await Promise.all(
          certificatesList.map(async (cert) => {
            if (!cert.event_title) {
              try {
                const regResponse = await apiCall.get(`${api.registrations()}/${cert.registration}/`)
                if (regResponse.ok) {
                  const reg = await regResponse.json()
                  const eventResponse = await apiCall.get(api.eventById(reg.event))
                  if (eventResponse.ok) {
                    const event = await eventResponse.json()
                    return {
                      ...cert,
                      event_title: event.title,
                    }
                  }
                }
              } catch (err) {
                console.warn(`Could not fetch event details for certificate ${cert.id}:`, err)
              }
            }
            return cert
          })
        )

        setCertificates(enrichedCertificates)
      } catch (err: any) {
        console.error('[Certificates] Error fetching certificates:', err)
        setError(err.message || 'Failed to load certificates. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchCertificates()
  }, [])

  const base64ToBlob = (base64: string, contentType = 'application/pdf'): Blob => {
    const parts = base64.split(',')
    const rawBase64 = parts.length > 1 ? parts[1] : parts[0]

    const byteChars = atob(rawBase64)
    const byteNumbers = new Array(byteChars.length)
    for (let i = 0; i < byteChars.length; i++) {
      byteNumbers[i] = byteChars.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    return new Blob([byteArray], { type: contentType })
  }

  const handleViewCertificate = async (cert: CertificateRecord) => {
    try {
      if (cert.pdf_file) {
        const fileUrl = cert.pdf_file.startsWith('http')
          ? cert.pdf_file
          : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${cert.pdf_file}`
        window.open(fileUrl, '_blank')
        return
      }

      if (cert.pdf_base64) {
        const blob = base64ToBlob(cert.pdf_base64, 'application/pdf')
        const url = window.URL.createObjectURL(blob)
        window.open(url, '_blank')
        return
      }

      alert('Certificate file is not available yet. Please contact the administrator.')
    } catch (err: any) {
      alert(err.message || 'Failed to open certificate.')
    }
  }

  const handleDownloadCertificate = async (cert: CertificateRecord) => {
    try {
      let blob: Blob | null = null

      if (cert.pdf_file) {
        const fileUrl = cert.pdf_file.startsWith('http')
          ? cert.pdf_file
          : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${cert.pdf_file}`
        const response = await fetch(fileUrl)
        if (!response.ok) {
          throw new Error('Failed to download certificate')
        }
        blob = await response.blob()
      } else if (cert.pdf_base64) {
        blob = base64ToBlob(cert.pdf_base64, 'application/pdf')
      }

      if (!blob) {
        alert('Certificate file is not available yet. Please contact the administrator.')
        return
      }

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `certificate-${cert.certificate_number}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      alert(err.message || 'Failed to download certificate.')
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50/50 dark:bg-neutral-950 p-6 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="space-y-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-neutral-500 hover:text-red-500 dark:text-neutral-400 dark:hover:text-red-400 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back</span>
        </button>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Award className="w-6 h-6 text-red-500 dark:text-red-400 fill-red-500 dark:fill-red-400" />
            <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">Access Granted</h1>
          </div>
          <p className="text-neutral-500 dark:text-neutral-400">View and download your earned certificates and credentials</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-red-600" />
        </div>
      ) : error ? (
        <Card className="p-8 border-red-200 bg-red-50 text-red-900 flex flex-col items-center">
          <p className="mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">Retry</Button>
        </Card>
      ) : certificates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-neutral-900/50 rounded-3xl border border-neutral-200 dark:border-neutral-800 border-dashed text-center">
          <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-6">
            <ShieldCheck className="w-10 h-10 text-neutral-400" />
          </div>
          <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">No Verified Credentials Yet</h3>
          <p className="text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto mb-8">
            Certificates will appear here once you complete event evaluations.
          </p>
          <Button
            className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white px-8"
            onClick={() => router.push('/participant/my-events')}
          >
            Go to My Events
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="group bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-1 hover:border-red-500/30 hover:shadow-xl hover:shadow-red-500/5 transition-all duration-300"
            >
              <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-6 h-full flex flex-col relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-red-500/10 to-transparent rounded-bl-[100px] -mr-8 -mt-8" />

                <div className="flex items-start justify-between mb-6 relative">
                  <div className="w-12 h-12 bg-white dark:bg-neutral-800 rounded-full flex items-center justify-center shadow-sm border border-neutral-100 dark:border-neutral-700">
                    <Award className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500 bg-white dark:bg-neutral-800 px-2 py-1 rounded-md border border-neutral-100 dark:border-neutral-700 shadow-sm">
                    #{cert.certificate_number.slice(0, 8)}...
                  </div>
                </div>

                <div className="flex-1 space-y-4 relative">
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white line-clamp-2 leading-tight mb-2">
                      {cert.event_title || 'Certificate of Completion'}
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                      Issued on {new Date(cert.issue_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700 border-dashed">
                    <p className="text-sm text-neutral-600 dark:text-neutral-300">
                      This certifies that the recipient has successfully completed the requirements for the above event.
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex gap-2">
                  <Button
                    className="flex-1 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 shadow-lg"
                    onClick={() => handleDownloadCertificate(cert)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 hover:text-red-600 dark:hover:text-red-400"
                    onClick={() => handleViewCertificate(cert)}
                    title="View"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
