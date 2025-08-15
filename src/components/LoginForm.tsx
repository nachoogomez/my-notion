import { useState } from 'react'
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { useAuth } from '../context/AuthContext'

export function LoginForm() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { signIn, signUp } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = isLogin 
        ? await signIn(email, password)
        : await signUp(email, password)

      if (error) {
        setError(error.message)
      } else if (!isLogin) {
        setError('Check your email for the confirmation link!')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-[#2563eb] rounded-xl p-3">
              <User className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">My Notion</h1>
          </div>
          <p className="text-[#888888]">
            {isLogin ? 'Welcome back! Sign in to your account' : 'Create your account to get started'}
          </p>
        </div>

        {/* Login/Register Card */}
        <Card className="bg-[#111111] border-[#1f1f1f]">
          <CardHeader>
            <CardTitle className="text-white text-center">
              {isLogin ? 'Sign In' : 'Create Account'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#888888]">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#666666] h-4 w-4" />
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-[#1f1f1f] border-[#333333] text-white placeholder:text-[#666666]"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#888888]">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#666666] h-4 w-4" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-[#1f1f1f] border-[#333333] text-white placeholder:text-[#666666]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#666666] hover:text-[#888888]"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="text-red-400 text-sm text-center bg-red-400/10 border border-red-400/20 rounded-md p-2">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    {isLogin ? 'Signing in...' : 'Creating account...'}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {isLogin ? 'Sign In' : 'Create Account'}
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>
            </form>

            {/* Toggle Login/Register */}
            <div className="mt-6 text-center">
              <p className="text-[#888888] text-sm">
                {isLogin ? "Don't have an account?" : 'Already have an account?'}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin)
                    setError('')
                  }}
                  className="ml-1 text-[#2563eb] hover:text-[#1d4ed8] font-medium"
                >
                  {isLogin ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
