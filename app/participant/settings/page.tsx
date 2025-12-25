'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Save, Lock, User, Settings as SettingsIcon, Shield, Mail, Building, GraduationCap, Calendar, Loader2 } from 'lucide-react'
import { authApi, apiRequest, api } from '@/lib/api-config'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function Settings() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    program: '',
    birthday: '',
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await apiRequest(authApi.me(), {
          method: 'GET',
        })

        if (!response.ok) {
          setError('Failed to load your profile. Please try refreshing the page.')
          setIsLoading(false)
          return
        }

        const data = await response.json()

        if (data.authenticated && data.user) {
          const user = data.user

          let birthdayFormatted = ''
          if (user.birthday) {
            try {
              const date = new Date(user.birthday)
              if (!isNaN(date.getTime())) {
                birthdayFormatted = date.toISOString().split('T')[0]
              }
            } catch (e) {
              console.warn('[Settings] Could not parse birthday:', user.birthday)
            }
          }

          setFormData({
            name: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || '',
            email: user.email || '',
            department: user.department || '',
            program: user.program || '',
            birthday: birthdayFormatted,
          })
        } else {
          setError('Unable to load your profile. Please sign in again.')
        }
      } catch (err) {
        setError('An error occurred while loading your profile. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError('')
    setSuccess('')
    try {
      const updateData: any = {}
      if (formData.name) {
        const nameParts = formData.name.trim().split(' ')
        if (nameParts.length > 0) {
          updateData.first_name = nameParts[0]
          updateData.last_name = nameParts.slice(1).join(' ') || nameParts[0]
        }
      }
      if (formData.birthday) {
        updateData.birthday = formData.birthday
      }

      const userEmail = formData.email
      if (userEmail) {
        const participantsUrl = api.participants()
        const baseUrl = participantsUrl.endsWith('/') ? participantsUrl.slice(0, -1) : participantsUrl
        const searchUrl = `${baseUrl}/?email=${encodeURIComponent(userEmail)}`
        const searchRes = await apiRequest(searchUrl, { method: 'GET' })

        if (searchRes.ok) {
          const searchData = await searchRes.json()
          const users = Array.isArray(searchData) ? searchData : (searchData.results || searchData.data || [])

          if (users.length > 0) {
            const userId = users[0].id
            const updateUrl = `${baseUrl}/${userId}/`
            const updateRes = await apiRequest(updateUrl, {
              method: 'PATCH',
              body: JSON.stringify(updateData),
            })

            if (updateRes.ok) {
              setSuccess('Profile updated successfully!')
              // Refresh user data
            } else {
              const errorData = await updateRes.json().catch(() => ({}))
              setError(errorData.detail || errorData.error || 'Failed to update profile')
            }
          } else {
            setError('User profile not found')
          }
        } else {
          setError('Unable to find user profile')
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save settings. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    setIsSavingPassword(true)
    setPasswordError('')
    setSuccess('')

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match')
      setIsSavingPassword(false)
      return
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long')
      setIsSavingPassword(false)
      return
    }

    try {
      const passwordUrl = authApi.login().replace('/login/', '/change-password/')
      const response = await apiRequest(passwordUrl, {
        method: 'POST',
        body: JSON.stringify({
          current_password: passwordData.currentPassword,
          new_password: passwordData.newPassword,
        }),
      })

      if (response.ok) {
        setSuccess('Password updated successfully!')
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
      } else {
        const errorData = await response.json().catch(() => ({}))
        setPasswordError(errorData.detail || errorData.error || 'Failed to update password')
      }
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password. Please try again.')
    } finally {
      setIsSavingPassword(false)
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
            <SettingsIcon className="w-6 h-6 text-red-500 dark:text-red-400" />
            <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">Account Settings</h1>
          </div>
          <p className="text-neutral-500 dark:text-neutral-400">Manage your profile, security, and preferences</p>
        </div>
      </div>

      <div className="max-w-4xl">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-1 rounded-xl mb-8 w-full md:w-auto overflow-x-auto justify-start">
            <TabsTrigger
              value="profile"
              className="rounded-lg data-[state=active]:bg-red-50 dark:data-[state=active]:bg-red-900/20 data-[state=active]:text-red-600 dark:data-[state=active]:text-red-400 px-6"
            >
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="rounded-lg data-[state=active]:bg-red-50 dark:data-[state=active]:bg-red-900/20 data-[state=active]:text-red-600 dark:data-[state=active]:text-red-400 px-6"
            >
              <Shield className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
          </TabsList>

          {isLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-red-600" />
            </div>
          ) : error ? (
            <Card className="p-8 border-red-200 bg-red-50 text-red-900 flex flex-col items-center">
              <p className="mb-4">{error}</p>
              <Button onClick={() => window.location.reload()} variant="outline">Retry</Button>
            </Card>
          ) : (
            <>
              <TabsContent value="profile" className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                <Card className="p-6 md:p-8 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-500/5 to-transparent rounded-bl-[100px] -mr-10 -mt-10" />

                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-1">Personal Information</h2>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Update your personal details here.</p>
                  </div>

                  {success && !passwordError && (
                    <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-xl flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      {success}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-neutral-700 dark:text-neutral-300 font-medium">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className="pl-9 bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 h-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-neutral-700 dark:text-neutral-300 font-medium">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <Input
                          id="email"
                          value={formData.email}
                          disabled
                          className="pl-9 bg-neutral-100 dark:bg-neutral-900/50 border-neutral-200 dark:border-neutral-800 text-neutral-500 h-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="department" className="text-neutral-700 dark:text-neutral-300 font-medium">Department</Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <Input
                          id="department"
                          value={formData.department}
                          disabled
                          className="pl-9 bg-neutral-100 dark:bg-neutral-900/50 border-neutral-200 dark:border-neutral-800 text-neutral-500 h-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="program" className="text-neutral-700 dark:text-neutral-300 font-medium">Program</Label>
                      <div className="relative">
                        <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <Input
                          id="program"
                          value={formData.program}
                          disabled
                          className="pl-9 bg-neutral-100 dark:bg-neutral-900/50 border-neutral-200 dark:border-neutral-800 text-neutral-500 h-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="birthday" className="text-neutral-700 dark:text-neutral-300 font-medium">Birthday</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <Input
                          id="birthday"
                          name="birthday"
                          type="date"
                          value={formData.birthday}
                          onChange={handleChange}
                          className="pl-9 bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 h-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end">
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 min-w-[150px]"
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="security" className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                <Card className="p-6 md:p-8 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-500/5 to-transparent rounded-bl-[100px] -mr-10 -mt-10" />

                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-1">Passowrd & Security</h2>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Manage your password and security preferences.</p>
                  </div>

                  {passwordError && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      {passwordError}
                    </div>
                  )}

                  <div className="space-y-4 max-w-md">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword" className="text-neutral-700 dark:text-neutral-300 font-medium">Current Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <Input
                          id="currentPassword"
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          className="pl-9 bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 h-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="text-neutral-700 dark:text-neutral-300 font-medium">New Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <Input
                          id="newPassword"
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          className="pl-9 bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 h-10"
                        />
                      </div>
                      <p className="text-xs text-neutral-500 ml-1">Must be at least 8 characters long</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-neutral-700 dark:text-neutral-300 font-medium">Confirm New Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          className="pl-9 bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 h-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end">
                    <Button
                      onClick={handlePasswordChange}
                      disabled={isSavingPassword}
                      className="bg-red-600 hover:bg-red-700 text-white min-w-[150px]"
                    >
                      {isSavingPassword ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
                      {isSavingPassword ? 'Updating...' : 'Update Password'}
                    </Button>
                  </div>
                </Card>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  )
}
