import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useLocation, Navigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from './useAuth'
import { loginSchema, type LoginFormData } from './auth.schema'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'

export default function LoginPage() {
  const { signIn, user, isLoading: isAuthLoading } = useAuth()
  const location = useLocation()
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
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

  const fillQuickAccount = (email: string) => {
    setValue('email', email, { shouldValidate: true })
    setValue('password', 'password123', { shouldValidate: true })
    setFormError(null)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8 dark:bg-surface-900">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/10 text-3xl shadow-inner dark:bg-brand-500/20">
            <span role="img" aria-label="Scissors">
              ✂️
            </span>
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-surface-900 dark:text-white sm:text-3xl">
            Clippr
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
                <span className="text-base" aria-hidden="true">
                  ⚠️
                </span>
                <p className="flex-1 font-medium">{formError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <Input
                label="Email address"
                type="email"
                autoComplete="email"
                placeholder="name@clippr.local"
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

            {/* Quick-fill helper for development & testing */}
            <div className="mt-8 border-t border-slate-200 pt-6 dark:border-surface-700">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Quick test accounts (seed data)
              </p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => fillQuickAccount('admin@clippr.local')}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-brand-50 hover:border-brand-300 dark:border-surface-700 dark:bg-surface-800 dark:text-slate-300 dark:hover:bg-surface-700 transition"
                >
                  <div>
                    <span className="font-semibold text-surface-900 dark:text-white">Shop Admin</span>
                    <span className="ml-2 text-slate-500 dark:text-slate-400">admin@clippr.local</span>
                  </div>
                  <span className="rounded bg-brand-500/10 px-1.5 py-0.5 font-mono text-[10px] text-brand-600 dark:text-brand-400">
                    admin
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => fillQuickAccount('tendai@clippr.local')}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-brand-50 hover:border-brand-300 dark:border-surface-700 dark:bg-surface-800 dark:text-slate-300 dark:hover:bg-surface-700 transition"
                >
                  <div>
                    <span className="font-semibold text-surface-900 dark:text-white">Tendai Moyo</span>
                    <span className="ml-2 text-slate-500 dark:text-slate-400">tendai@clippr.local</span>
                  </div>
                  <span className="rounded bg-blue-500/10 px-1.5 py-0.5 font-mono text-[10px] text-blue-600 dark:text-blue-400">
                    barber
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => fillQuickAccount('rudo@clippr.local')}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-brand-50 hover:border-brand-300 dark:border-surface-700 dark:bg-surface-800 dark:text-slate-300 dark:hover:bg-surface-700 transition"
                >
                  <div>
                    <span className="font-semibold text-surface-900 dark:text-white">Rudo Chikwanda</span>
                    <span className="ml-2 text-slate-500 dark:text-slate-400">rudo@clippr.local</span>
                  </div>
                  <span className="rounded bg-blue-500/10 px-1.5 py-0.5 font-mono text-[10px] text-blue-600 dark:text-blue-400">
                    barber
                  </span>
                </button>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </main>
  )
}
