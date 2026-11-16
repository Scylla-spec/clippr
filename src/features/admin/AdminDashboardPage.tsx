import { useState } from 'react'
import { CalendarDays, Armchair, Scissors } from 'lucide-react'
import { DayViewSchedule } from '@/features/bookings/DayViewSchedule'
import { ServicesManager } from '@/features/services/ServicesManager'
import { BarbersManager } from '@/features/barbers/BarbersManager'
import { useServices } from '@/features/services/useServices'
import { useBarbers } from '@/features/barbers/useBarbers'

type AdminTab = 'schedule' | 'services' | 'barbers'

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('schedule')
  const { data: services } = useServices(true)
  const { data: barbers } = useBarbers()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-surface-900 dark:text-white sm:text-3xl">
          Admin Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Day schedule, walk-in quick actions, barber assignments, and services catalog.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-surface-700">
        <nav className="flex space-x-6" aria-label="Admin Sections">
          <button
            type="button"
            onClick={() => setActiveTab('schedule')}
            className={`inline-flex min-h-[44px] items-center gap-2 border-b-2 pb-3 text-sm font-medium transition-colors ${
              activeTab === 'schedule'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            <span>Schedule (Day View)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('services')}
            className={`inline-flex min-h-[44px] items-center gap-2 border-b-2 pb-3 text-sm font-medium transition-colors ${
              activeTab === 'services'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Armchair className="h-4 w-4" aria-hidden="true" />
            <span>Services ({services?.length ?? 0})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('barbers')}
            className={`inline-flex min-h-[44px] items-center gap-2 border-b-2 pb-3 text-sm font-medium transition-colors ${
              activeTab === 'barbers'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Scissors className="h-4 w-4" aria-hidden="true" />
            <span>Barbers ({barbers?.length ?? 0})</span>
          </button>
        </nav>
      </div>

      {/* Tab Panels */}
      {activeTab === 'schedule' && <DayViewSchedule />}

      {activeTab === 'services' && <ServicesManager />}

      {activeTab === 'barbers' && <BarbersManager />}
    </div>
  )
}
