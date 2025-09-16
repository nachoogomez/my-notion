import { useState, useEffect } from "react"
import { AlertTriangle, X } from "lucide-react"
import { Button } from "./button"

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: "danger" | "warning" | "info"
}

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger"
}: ConfirmDialogProps) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
    } else {
      setIsVisible(false)
    }
  }, [isOpen])

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => onClose(), 300)
  }

  if (!isOpen) return null

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          icon: "text-red-500",
          confirmButton: "bg-red-600 hover:bg-red-700 text-white",
          border: "border-red-500/20"
        }
      case "warning":
        return {
          icon: "text-yellow-500",
          confirmButton: "bg-yellow-600 hover:bg-yellow-700 text-white",
          border: "border-yellow-500/20"
        }
      case "info":
        return {
          icon: "text-blue-500",
          confirmButton: "bg-blue-600 hover:bg-blue-700 text-white",
          border: "border-blue-500/20"
        }
      default:
        return {
          icon: "text-red-500",
          confirmButton: "bg-red-600 hover:bg-red-700 text-white",
          border: "border-red-500/20"
        }
    }
  }

  const styles = getVariantStyles()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Dialog */}
      <div
        className={`
          relative bg-[#111111] border rounded-lg p-6 shadow-xl max-w-md w-full mx-4
          transform transition-all duration-300 ease-in-out
          ${isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"}
          ${styles.border}
        `}
      >
        {/* Close button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="absolute top-4 right-4 h-6 w-6 p-0 hover:bg-white/10 text-[#888888] hover:text-white"
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Content */}
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 mt-1 ${styles.icon}`}>
            <AlertTriangle className="h-6 w-6" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">
              {title}
            </h3>
            <p className="text-[#888888] text-sm mb-6">
              {description}
            </p>
            
            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={handleClose}
                className="border-[#1f1f1f] text-[#888888] hover:bg-[#1f1f1f] hover:text-white"
              >
                {cancelText}
              </Button>
              <Button
                onClick={handleConfirm}
                className={styles.confirmButton}
              >
                {confirmText}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
