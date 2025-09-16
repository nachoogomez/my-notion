import { createContext, useState, useCallback } from "react"
import type { ReactNode } from "react"
import { ToastComponent, type Toast } from "../components/ui/toast"

interface ToastContextType {
  showToast: (toast: Omit<Toast, "id">) => void
  removeToast: (id: string) => void
  showSuccess: (title: string, description?: string) => void
  showError: (title: string, description?: string) => void
  showWarning: (title: string, description?: string) => void
  showInfo: (title: string, description?: string) => void
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined)

interface ToastProviderProps {
  children: ReactNode
}

export const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 5000, // Default 5 seconds
    }
    setToasts((prev) => [...prev, newToast])
  }, [])

  const showSuccess = useCallback((title: string, description?: string) => {
    showToast({ title, description, type: "success" })
  }, [showToast])

  const showError = useCallback((title: string, description?: string) => {
    showToast({ title, description, type: "error" })
  }, [showToast])

  const showWarning = useCallback((title: string, description?: string) => {
    showToast({ title, description, type: "warning" })
  }, [showToast])

  const showInfo = useCallback((title: string, description?: string) => {
    showToast({ title, description, type: "info" })
  }, [showToast])

  const value = {
    showToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <ToastComponent
            key={toast.id}
            toast={toast}
            onRemove={removeToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
