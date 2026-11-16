import { useState } from 'react'
import {
  useServices,
  useCreateService,
  useUpdateService,
  useToggleServiceActive,
} from './useServices'
import type { Service } from '@/lib/database.types'
import type { ServiceFormData } from './service.schema'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ServiceFormModal } from './ServiceFormModal'

export function ServicesManager() {
  const { data: services, isLoading, error, refetch } = useServices(true)
  const createService = useCreateService()
  const updateService = useUpdateService()
  const toggleActive = useToggleServiceActive()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [serviceToDeactivate, setServiceToDeactivate] = useState<Service | null>(null)

  const handleCreateOrUpdate = async (formData: ServiceFormData) => {
    if (editingService) {
      await updateService.mutateAsync({
        id: editingService.id,
        data: formData,
      })
    } else {
      await createService.mutateAsync(formData)
    }
  }

  const handleOpenCreate = () => {
    setEditingService(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (svc: Service) => {
    setEditingService(svc)
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-surface-900 dark:text-white">Services</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Define service offerings, standard durations, and pricing.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={handleOpenCreate}>
          + Add Service
        </Button>
      </div>

      {isLoading ? (
        <div className="py-12 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      ) : error ? (
        <ErrorMessage
          message={error instanceof Error ? error.message : 'Failed to load services'}
          onRetry={() => void refetch()}
        />
      ) : !services || services.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon="💈"
              title="No services configured"
              description="Add services such as Haircuts or Shaves so bookings can be created."
              action={
                <Button variant="primary" size="sm" onClick={handleOpenCreate}>
                  Create First Service
                </Button>
              }
            />
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((svc) => (
            <Card
              key={svc.id}
              className={`transition-shadow hover:shadow-md ${
                !svc.is_active ? 'opacity-60 bg-slate-50 dark:bg-surface-800/50' : ''
              }`}
            >
              <CardBody className="p-4 flex flex-col justify-between h-full space-y-3">
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-surface-900 dark:text-white leading-tight">
                      {svc.name}
                    </h3>
                    <Badge variant={svc.is_active ? 'success' : 'default'}>
                      {svc.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <span aria-hidden="true">⏱️</span> {svc.duration_min} min
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200">
                      <span aria-hidden="true">💵</span> ${Number(svc.price).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-surface-700">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(svc)}
                    className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 p-1"
                  >
                    Edit
                  </button>

                  <span className="text-slate-300 dark:text-surface-600" aria-hidden="true">
                    |
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      if (svc.is_active) {
                        setServiceToDeactivate(svc)
                      } else {
                        void toggleActive.mutateAsync({ id: svc.id, is_active: true })
                      }
                    }}
                    className={`text-xs font-medium p-1 ${
                      svc.is_active
                        ? 'text-red-600 hover:text-red-700 dark:text-red-400'
                        : 'text-green-600 hover:text-green-700 dark:text-green-400'
                    }`}
                  >
                    {svc.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <ServiceFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
        serviceToEdit={editingService}
        isLoading={createService.isPending || updateService.isPending}
      />

      {/* Deactivate confirmation dialog */}
      <ConfirmDialog
        isOpen={Boolean(serviceToDeactivate)}
        title="Deactivate Service"
        description={`Are you sure you want to deactivate "${serviceToDeactivate?.name}"? New bookings will not be able to choose this service.`}
        confirmLabel="Deactivate"
        variant="danger"
        isLoading={toggleActive.isPending}
        onConfirm={async () => {
          if (serviceToDeactivate) {
            await toggleActive.mutateAsync({
              id: serviceToDeactivate.id,
              is_active: false,
            })
            setServiceToDeactivate(null)
          }
        }}
        onCancel={() => setServiceToDeactivate(null)}
      />
    </div>
  )
}
