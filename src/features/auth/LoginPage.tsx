import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useLocation, Navigate } from 'react-router-dom'
import { TriangleAlert } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from './useAuth'
import { loginSchema, type LoginFormData } from './auth.schema'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { AnimatedInfinity } from '@/components/brand/AnimatedInfinity'

export default function LoginPage() {
  const { signIn, user, isLoading: isAuthLoading } = useAuth()
  const location = useLocation()
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  // If already logged in, redirect to destination or role default
  if (!isAuthLoading && user?.profile) {
    const from = (location.state as { from?: { pathname?: string } })?.from?.pathname
    if (from && from !== '/login') {
      return <Navigate to={from} replace />
    }
    const defaultRoute = user.profile.role === 'admin' ? '/admin/dashboard' : '/barber/dashboard'
    return <Navigate to={defaultRoute} replace />
  }

  const onSubmit = async (data: LoginFormData) => {
    setFormError(null)
    setIsSubmitting(true)

    const res = await signIn(data)
    setIsSubmitting(false)

    if (res.error) {
      setFormError(res.error)
      toast.error('Authentication failed')
    } else {
      toast.success('Welcome back!')
      // Redirect will be triggered by react router when user state updates
    }
  }

  return (
    <main className="login-shell flex min-h-screen items-center justify-center px-4 py-8">
      <div className="login-shell__glow login-shell__glow--a" aria-hidden="true" />
      <div className="login-shell__glow login-shell__glow--b" aria-hidden="true" />
      <div className="login-shell__grain" aria-hidden="true" />
      <div className="login-shell__main w-full max-w-xs space-y-6">
        <div className="login-shell__brand text-center">
          <div className="login-shell__mark mb-3 flex justify-center">
            <AnimatedInfinity size={72} />
          </div>
          <h1 className="login-shell__name text-2xl font-bold tracking-tight sm:text-3xl">
            Infinity Barbers
          </h1>
          <p className="login-shell__tagline mt-1 text-sm">
            Barbershop booking &amp; queue management
          </p>
        </div>

        <Card className="login-card border-0">
          <CardBody className="p-6 sm:p-8">
            <h2 className="login-card__title mb-6 text-lg font-semibold">
              Sign in to your account
            </h2>

            {formError && (
              <div
                role="alert"
                className="login-error mb-6 flex items-start gap-3 rounded-lg p-3.5 text-sm"
              >
                <TriangleAlert className="h-5 w-5 shrink-0" aria-hidden="true" />
                <p className="flex-1 font-medium">{formError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="login-form space-y-4" noValidate>
              <Input
                label="Email address"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                error={errors.email?.message}
                required
                className="login-input"
                {...register('email')}
              />

              <Input
                label="Password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                error={errors.password?.message}
                required
                className="login-input"
                {...register('password')}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="login-btn mt-2 w-full font-semibold shadow-sm"
                isLoading={isSubmitting}
              >
                Sign in
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </main>
  )
}
