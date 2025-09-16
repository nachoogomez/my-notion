import { useState, useCallback } from "react"

interface ConfirmOptions {
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: "danger" | "warning" | "info"
}

interface ConfirmState {
  isOpen: boolean
  options: ConfirmOptions | null
  onConfirm: (() => void) | null
}

export const useConfirm = () => {
  const [state, setState] = useState<ConfirmState>({
    isOpen: false,
    options: null,
    onConfirm: null
  })

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        options,
        onConfirm: () => {
          setState(prev => ({ ...prev, isOpen: false, options: null, onConfirm: null }))
          resolve(true)
        }
      })
    })
  }, [])

  const close = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false, options: null, onConfirm: null }))
  }, [])

  const handleConfirm = useCallback(() => {
    if (state.onConfirm) {
      state.onConfirm()
    }
  }, [state.onConfirm])

  return {
    confirm,
    close,
    handleConfirm,
    isOpen: state.isOpen,
    options: state.options
  }
}
