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
import { Logo } from '@/components/brand/Logo'

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
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8 dark:bg-surface-900">
      <div className="w-full max-w-xs space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <Logo size={48} showWordmark={false} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-surface-900 dark:text-white sm:text-3xl">
            Infinity Barbers
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Barbershop booking &amp; queue management
          </p>
        </div>

        <Card className="shadow-lg border-0 ring-1 ring-slate-200 dark:ring-surface-700">
          <CardBody className="p-6 sm:p-8">
            <h2 className="mb-6 text-lg font-semibold text-surface-900 dark:text-white">
              Sign in to your account
            </h2>

            {formError && (
              <div
                role="alert"
                className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
              >
                <TriangleAlert className="h-5 w-5 shrink-0 text-red-500 dark:text-red-400" aria-hidden="true" />
                <p className="flex-1 font-medium">{formError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <Input
                label="Email address"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                error={errors.email?.message}
                required
                {...register('email')}
              />

              <Input
                label="Password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                error={errors.password?.message}
                required
                {...register('password')}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-2 font-semibold shadow-sm"
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
