import { useState } from 'react'
import { Scissors } from 'lucide-react'
import { useBarbers, useCreateBarber, useToggleBarberActive } from './useBarbers'
import type { Profile } from '@/lib/database.types'
import type { CreateBarberFormData } from './barber.schema'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { CreateBarberModal } from './CreateBarberModal'

export function BarbersManager() {
  const { data: barbers, isLoading, error, refetch } = useBarbers()
  const createBarber = useCreateBarber()
  const toggleActive = useToggleBarberActive()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [barberToDeactivate, setBarberToDeactivate] = useState<Profile | null>(null)

  const handleCreate = async (formData: CreateBarberFormData) => {
    await createBarber.mutateAsync(formData)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-surface-900 dark:text-white">Barbers</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage your shop roster, barber accounts, and active status.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
          + Add Barber
        </Button>
      </div>

      {isLoading ? (
        <div className="py-12 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      ) : error ? (
        <ErrorMessage
          message={error instanceof Error ? error.message : 'Failed to load barbers'}
          onRetry={() => void refetch()}
        />
      ) : !barbers || barbers.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<Scissors className="h-10 w-10 text-slate-400" aria-hidden="true" />}
              title="No barbers added"
              description="Add barbers to your shop so appointments and walk-in queues can be assigned."
              action={
                <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
                  Add First Barber
                </Button>
              }
            />
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {barbers.map((barber) => (
            <Card
              key={barber.id}
              className={`transition-shadow hover:shadow-md ${
                !barber.is_active ? 'opacity-60 bg-slate-50 dark:bg-surface-800/50' : ''
              }`}
            >
              <CardBody className="p-4 flex flex-col justify-between h-full space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-surface-900 dark:text-white leading-tight">
                      {barber.full_name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      ID: <span className="font-mono text-[11px]">{barber.id.slice(0, 8)}…</span>
                    </p>
                  </div>
                  <Badge variant={barber.is_active ? 'success' : 'default'}>
                    {barber.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-surface-700 text-xs">
                  <span className="text-slate-500 dark:text-slate-400">
                    {barber.is_active ? 'Can accept bookings' : 'Account deactivated'}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      if (barber.is_active) {
                        setBarberToDeactivate(barber)
                      } else {
                        void toggleActive.mutateAsync({ id: barber.id, is_active: true })
                      }
                    }}
                    className={`font-medium p-1 ${
                      barber.is_active
                        ? 'text-red-600 hover:text-red-700 dark:text-red-400'
                        : 'text-green-600 hover:text-green-700 dark:text-green-400'
                    }`}
                  >
                    {barber.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <CreateBarberModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreate}
        isLoading={createBarber.isPending}
      />

      {/* Deactivate confirmation dialog */}
      <ConfirmDialog
        isOpen={Boolean(barberToDeactivate)}
        title="Deactivate Barber"
        description={`Are you sure you want to deactivate ${barberToDeactivate?.full_name}? They will immediately be logged out and cannot be assigned new bookings.`}
        confirmLabel="Deactivate Barber"
        variant="danger"
        isLoading={toggleActive.isPending}
        onConfirm={async () => {
          if (barberToDeactivate) {
            await toggleActive.mutateAsync({
              id: barberToDeactivate.id,
              is_active: false,
            })
            setBarberToDeactivate(null)
          }
        }}
        onCancel={() => setBarberToDeactivate(null)}
      />
    </div>
  )
}
