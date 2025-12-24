'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Save, Lock } from 'lucide-react'
import { authApi, apiRequest, api } from '@/lib/api-config'

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
        console.log('[Settings] Fetching user data from API...')
        const response = await apiRequest(authApi.me(), {
          method: 'GET',
        })

        if (!response.ok) {
          console.error('[Settings] Failed to fetch user data:', response.status)
          setError('Failed to load your profile. Please try refreshing the page.')
          setIsLoading(false)
          return
        }

        const data = await response.json()
        console.log('[Settings] Loaded data from API:', data)

        if (data.authenticated && data.user) {
          const user = data.user
          
          // Format birthday for date input (YYYY-MM-DD)
          let birthdayFormatted = ''
          if (user.birthday) {
            try {
              // Handle ISO date string from API
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
          
          console.log('[Settings] Form data set:', {
            name: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username,
            email: user.email,
            department: user.department,
            program: user.program,
            birthday: birthdayFormatted,
          })
        } else {
          console.warn('[Settings] User not authenticated or user data missing')
          setError('Unable to load your profile. Please sign in again.')
        }
      } catch (err) {
        console.error('[Settings] Error fetching user data:', err)
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
      // Update profile (name and birthday)
      const updateData: any = {}
      if (formData.name) {
        // Split name into first_name and last_name if needed
        const nameParts = formData.name.trim().split(' ')
        if (nameParts.length > 0) {
          updateData.first_name = nameParts[0]
          updateData.last_name = nameParts.slice(1).join(' ') || nameParts[0]
        }
      }
      if (formData.birthday) {
        updateData.birthday = formData.birthday
      }
      
      // Try to update via participants API
      const userEmail = formData.email
      if (userEmail) {
        const participantsUrl = api.participants()
        const baseUrl = participantsUrl.endsWith('/') ? participantsUrl.slice(0, -1) : participantsUrl
        
        // First, try to find user by email
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
              const refreshRes = await apiRequest(authApi.me(), { method: 'GET' })
              if (refreshRes.ok) {
                const refreshData = await refreshRes.json()
                if (refreshData.authenticated && refreshData.user) {
                  const user = refreshData.user
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
                }
              }
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
      console.error('[Settings] Error saving:', err)
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
      // Update password via auth API
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
      console.error('[Settings] Error changing password:', err)
      setPasswordError(err.message || 'Failed to update password. Please try again.')
    } finally {
      setIsSavingPassword(false)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <h1 className="text-3xl font-bold text-foreground">Profile Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your profile information</p>
      </div>

      {/* Profile Form */}
      {isLoading ? (
        <Card className="p-6 border border-border bg-card">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading your profile...</p>
          </div>
        </Card>
      ) : error ? (
        <Card className="p-6 border border-border bg-card">
          <div className="text-center py-8 space-y-4">
            <p className="text-destructive">{error}</p>
            <Button
              onClick={() => {
                setError('')
                setIsLoading(true)
                // Re-fetch data
                const fetchUserData = async () => {
                  try {
                    console.log('[Settings] Re-fetching user data from API...')
                    const response = await apiRequest(authApi.me(), {
                      method: 'GET',
                    })

                    if (!response.ok) {
                      setError('Failed to load your profile. Please try refreshing the page.')
                      setIsLoading(false)
                      return
                    }

                    const data = await response.json()
                    console.log('[Settings] Loaded data from API:', data)

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
                      setError('')
                    } else {
                      setError('Unable to load your profile. Please sign in again.')
                    }
                  } catch (err) {
                    console.error('[Settings] Error fetching user data:', err)
                    setError('An error occurred while loading your profile. Please try again.')
                  } finally {
                    setIsLoading(false)
                  }
                }
                fetchUserData()
              }}
              className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
            >
              Retry
            </Button>
          </div>
        </Card>
      ) : (
      <>
        <Card className="p-6 border border-border bg-card space-y-6">
          <h2 className="text-xl font-semibold text-foreground">Profile Information</h2>
          
          {success && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 rounded-md text-sm">
              {success}
            </div>
          )}
          
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive text-destructive rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground">Full Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your full name"
              className="bg-background border-border text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              disabled
              className="bg-muted border-border text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="department" className="text-foreground">Department</Label>
            <Input
              id="department"
              name="department"
              value={formData.department || 'Not set'}
              disabled
              className="bg-muted border-border text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground">Department cannot be changed</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="program" className="text-foreground">Program</Label>
            <Input
              id="program"
              name="program"
              value={formData.program || 'Not set'}
              disabled
              className="bg-muted border-border text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground">Program cannot be changed</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthday" className="text-foreground">Birthday</Label>
            <Input
              id="birthday"
              name="birthday"
              type="date"
              value={formData.birthday}
              onChange={handleChange}
              className="bg-background border-border text-foreground"
            />
          </div>

          <Button
            disabled={isSaving}
            className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2"
            onClick={handleSave}
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Profile Changes'}
          </Button>
        </Card>
        
        <Card className="p-6 border border-border bg-card space-y-6">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-foreground" />
            <h2 className="text-xl font-semibold text-foreground">Change Password</h2>
          </div>
          
          {passwordError && (
            <div className="p-3 bg-destructive/10 border border-destructive text-destructive rounded-md text-sm">
              {passwordError}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="currentPassword" className="text-foreground">Current Password</Label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              placeholder="Enter current password"
              className="bg-background border-border text-foreground"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-foreground">New Password</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              placeholder="Enter new password"
              className="bg-background border-border text-foreground"
            />
            <p className="text-xs text-muted-foreground">Password must be at least 8 characters long</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-foreground">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              placeholder="Confirm new password"
              className="bg-background border-border text-foreground"
            />
          </div>
          
          <Button
            disabled={isSavingPassword}
            className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2"
            onClick={handlePasswordChange}
          >
            <Lock className="w-4 h-4" />
            {isSavingPassword ? 'Updating...' : 'Update Password'}
          </Button>
        </Card>
      </>
      )}
    </div>
  )
}
