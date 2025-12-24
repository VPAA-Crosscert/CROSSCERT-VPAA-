'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Mail, Lock } from 'lucide-react'
import { authApi, apiRequest } from '@/lib/api-config'

export default function SignIn() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  // Initialize CSRF token on component mount
  useEffect(() => {
    const initializeCsrf = async () => {
      try {
        await apiRequest(authApi.csrfToken(), {
          method: 'GET',
        })
      } catch (err) {
        console.error('Failed to initialize CSRF token:', err)
      }
    }
    
    initializeCsrf()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Send login request to Django backend
      const response = await apiRequest(authApi.login(), {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Custom error messages based on backend response
        const errorText = (data?.error || data?.detail || '').toLowerCase();
        if (
          errorText.includes('not found') ||
          errorText.includes('no active account') ||
          errorText.includes('does not exist') ||
          errorText.includes('user not found') ||
          errorText.includes('account not found')
        ) {
          setError('Account does not exist');
        } else if (
          errorText.includes('password') ||
          errorText.includes('invalid') ||
          errorText.includes('incorrect') ||
          errorText.includes('authentication') ||
          errorText.includes('credentials')
        ) {
          setError('Incorrect password or username');
        } else {
          setError(data.error || data.detail || 'Login failed');
        }
        setIsLoading(false);
        return;
      }

      // Store minimal user info in localStorage (only for session management)
      localStorage.setItem('userEmail', data.user.email)
      localStorage.setItem('userId', data.user.id.toString())
      localStorage.setItem('isStaff', data.user.is_staff.toString())
      
      // Determine role based on is_staff flag
      const userRole = data.user.is_staff ? 'admin' : 'participant'
      localStorage.setItem('userRole', userRole)

      // Note: User profile data (name, department, program) is now fetched from API
      // when needed, not stored in localStorage

      // Redirect based on role
      if (userRole === 'admin') {
        router.push('/admin/dashboard')
      } else {
        router.push('/participant/dashboard')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during login')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="space-y-2 text-center">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Welcome back</h1>
          <p className="text-muted-foreground text-base">Sign in to your CROSSCERT account</p>
        </div>

        {/* Form */}
        <Card className="p-8 border border-border bg-card shadow-xl rounded-2xl">
          <form onSubmit={handleSubmit} className="space-y-7">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive text-destructive rounded-md text-sm text-center">
                {error}
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-semibold">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="firstname.lastname@hcdc.edu.ph"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground py-3 text-base rounded-lg"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-semibold">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground py-3 text-base rounded-lg"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold disabled:opacity-50 disabled:cursor-not-allowed py-3 text-lg rounded-lg shadow-md"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </Card>

        {/* Sign Up Link */}
        <div className="text-center text-base text-muted-foreground mt-4">
          Don't have an account?{' '}
          <button
            onClick={() => router.push('/auth/signup')}
            className="text-primary hover:underline font-semibold"
          >
            Create one
          </button>
        </div>
      </div>
    </div>
  )
}
