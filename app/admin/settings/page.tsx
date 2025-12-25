'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Bell, Lock, Users, LogOut, Globe, Shield, Save, Upload, CheckCircle2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'

type SettingsData = {
  platformName: string
  newRegistrationEmail: boolean
  dailyDigest: boolean
  twoFactorAuth: boolean
}

export default function AdminSettings() {
  const router = useRouter()
  const [settings, setSettings] = useState<SettingsData>({
    platformName: 'VPAA Event System',
    newRegistrationEmail: true,
    dailyDigest: false,
    twoFactorAuth: false,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('admin_settings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings(parsed)
      } catch (err) {
        console.error('Failed to load settings:', err)
      }
    }
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Save to localStorage
      localStorage.setItem('admin_settings', JSON.stringify(settings))

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500))

      toast({
        title: 'Settings Saved',
        description: 'Your settings have been saved successfully.',
      })

      setHasChanges(false)
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const updateSetting = <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleLogout = async () => {
    const { handleLogout: logout } = await import('@/lib/auth-utils')
    await logout()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-neutral-50/50 dark:bg-neutral-950 p-6 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors text-neutral-500"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">Settings</h1>
          </div>
          <p className="text-neutral-500 dark:text-neutral-400 ml-12">Manage platform configurations and security.</p>
        </div>
        <Button
          variant="default"
          className="gap-2 shadow-lg shadow-red-500/20 bg-red-600 hover:bg-red-700 text-white border-0 disabled:opacity-50"
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {hasChanges ? 'Save Changes' : 'No Changes'}
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <Card className="lg:col-span-1 p-4 h-fit border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
          <nav className="space-y-2">
            <Button variant="ghost" className="w-full justify-start gap-3 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800">
              <Globe className="w-4 h-4" />
              General
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800">
              <Shield className="w-4 h-4" />
              Security
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800">
              <Bell className="w-4 h-4" />
              Notifications
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800">
              <Users className="w-4 h-4" />
              Team
            </Button>
            <div className="h-px bg-neutral-100 dark:bg-neutral-800 my-4" />
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </nav>
        </Card>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-6">

          {/* General Settings */}
          <Card className="p-6 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">General Settings</h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Manage basic platform details.</p>
            </div>

            <div className="space-y-6">
              <div className="grid gap-2">
                <Label>Platform Name</Label>
                <Input
                  value={settings.platformName}
                  onChange={(e) => updateSetting('platformName', e.target.value)}
                  className="max-w-md bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800"
                />
              </div>

              <div className="grid gap-2">
                <Label>Logo</Label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 border-2 border-dashed border-neutral-300 dark:border-neutral-700">
                    <Upload className="w-6 h-6" />
                  </div>
                  <Button variant="outline" size="sm" className="border-neutral-200 dark:border-neutral-800">Upload New Logo</Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Notification Settings */}
          <Card className="p-6 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Email Notifications</h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Configure when you receive emails.</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border border-neutral-100 dark:border-neutral-800">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-medium text-neutral-900 dark:text-white">New Registration</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Receive an email when someone registers for an event.</p>
                </div>
                <Switch
                  checked={settings.newRegistrationEmail}
                  onCheckedChange={(checked) => updateSetting('newRegistrationEmail', checked)}
                  className="data-[state=checked]:bg-red-600"
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg border border-neutral-100 dark:border-neutral-800">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-medium text-neutral-900 dark:text-white">Daily Digest</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Get a daily summary of all platform activity.</p>
                </div>
                <Switch
                  checked={settings.dailyDigest}
                  onCheckedChange={(checked) => updateSetting('dailyDigest', checked)}
                  className="data-[state=checked]:bg-red-600"
                />
              </div>
            </div>
          </Card>

          {/* Security */}
          <Card className="p-6 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Security</h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Protect your admin account.</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 shadow-sm">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-neutral-900 dark:text-white">Password</h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Last changed 30 days ago</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="border-neutral-200 dark:border-neutral-800">Change</Button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg border border-neutral-100 dark:border-neutral-800">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-medium text-neutral-900 dark:text-white">Two-Factor Authentication</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Add an extra layer of security to your account.</p>
                </div>
                <Switch
                  checked={settings.twoFactorAuth}
                  onCheckedChange={(checked) => updateSetting('twoFactorAuth', checked)}
                  className="data-[state=checked]:bg-red-600"
                />
              </div>
            </div>
          </Card>

        </div>
      </div>
    </div>
  )
}
