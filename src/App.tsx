import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'react-hot-toast'
import { RouterProvider } from 'react-router-dom'
import { router } from '@/router'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { OfflineBanner } from '@/features/pwa/OfflineBanner'
import { PwaInstallBanner } from '@/features/pwa/PwaInstallBanner'
import { PwaUpdatePrompt } from '@/features/pwa/PwaUpdatePrompt'

// Global QueryClient — configured conservatively for slow / mobile connections
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 s before refetch
      gcTime: 1000 * 60 * 15, // 15 min cache persistence for offline fallback
      retry: 2,
      refetchOnWindowFocus: false, // Avoid surprise refetches on mobile
      networkMode: 'offlineFirst', // Serve cached data first when connection is spotty
    },
    mutations: {
      retry: 0,
      networkMode: 'online', // Write operations fail quickly with feedback when offline
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {/* Offline notification banner */}
        <OfflineBanner />

        {/* PWA Update prompt */}
        <PwaUpdatePrompt />

        {/* Main application routing */}
        <RouterProvider router={router} />

        {/* PWA Install prompt */}
        <PwaInstallBanner />

        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '8px',
              fontFamily: 'Poppins, system-ui, sans-serif',
            },
          }}
        />
      </AuthProvider>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}
