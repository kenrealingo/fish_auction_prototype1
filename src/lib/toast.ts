import toast from 'react-hot-toast'

// Success toast variants
export const showSuccess = (message: string) => {
  return toast.success(message)
}

export const showAuctionSuccess = (action: string, lotNumber?: string) => {
  const message = lotNumber 
    ? `${action} successful for ${lotNumber}`
    : `${action} completed successfully`
  return toast.success(message)
}

export const showFormSuccess = (formType: string) => {
  return toast.success(`${formType} saved successfully`)
}

// Error toast variants
export const showError = (message: string) => {
  return toast.error(message)
}

export const showValidationError = (message: string = 'Please check your input and try again') => {
  return toast.error(message)
}

export const showNetworkError = (action?: string) => {
  const message = action 
    ? `Failed to ${action.toLowerCase()}. Please check your connection and try again.`
    : 'Network error. Please check your connection and try again.'
  return toast.error(message)
}

export const showPermissionError = () => {
  return toast.error('You do not have permission to perform this action')
}

// Loading toast variants
export const showLoading = (message: string) => {
  return toast.loading(message)
}

export const showFormLoading = (action: string) => {
  return toast.loading(`${action}...`)
}

// Info/Warning toasts
export const showInfo = (message: string) => {
  return toast(message, {
    icon: 'ℹ️',
    style: {
      background: '#3b82f6',
      color: '#fff',
    },
  })
}

export const showWarning = (message: string) => {
  return toast(message, {
    icon: '⚠️',
    style: {
      background: '#f59e0b',
      color: '#fff',
    },
    duration: 5000,
  })
}

// Specific business logic toasts
export const showBidSuccess = (amount: string, lotNumber: string) => {
  return toast.success(`Bid of ${amount} placed successfully on ${lotNumber}`)
}

export const showBidError = (reason?: string) => {
  const message = reason 
    ? `Bid failed: ${reason}`
    : 'Failed to place bid. Please try again.'
  return toast.error(message)
}

export const showAuctionClosed = (lotNumber: string, winningAmount?: string) => {
  const message = winningAmount
    ? `Auction for ${lotNumber} closed. Winning bid: ${winningAmount}`
    : `Auction for ${lotNumber} closed with no bids`
  return toast.success(message)
}

export const showSettlementCreated = (settlementNumber: string, amount: string) => {
  return toast.success(`Settlement ${settlementNumber} created for ${amount}`)
}

export const showApprovalSuccess = (action: 'approved' | 'rejected', lotNumber: string) => {
  return toast.success(`Lot ${lotNumber} has been ${action}`)
}

// Batch operations
export const showBatchSuccess = (count: number, operation: string) => {
  return toast.success(`${count} ${operation}(s) completed successfully`)
}

export const showBatchError = (count: number, operation: string) => {
  return toast.error(`Failed to complete ${count} ${operation}(s)`)
}

// Promise-based toasts for async operations
export const showPromiseToast = <T>(
  promise: Promise<T>,
  {
    loading = 'Processing...',
    success = 'Operation completed successfully',
    error = 'Operation failed',
  }: {
    loading?: string
    success?: string | ((data: T) => string)
    error?: string | ((error: any) => string)
  } = {}
) => {
  return toast.promise(promise, {
    loading,
    success,
    error,
  })
}

// Auction-specific promise toasts
export const showAuctionPromise = <T>(
  promise: Promise<T>,
  action: string,
  lotNumber?: string
) => {
  const baseMessage = lotNumber ? `${action} ${lotNumber}` : action
  
  return toast.promise(promise, {
    loading: `${baseMessage}...`,
    success: `${baseMessage} completed successfully`,
    error: (err) => `Failed to ${action.toLowerCase()}: ${err.message || 'Please try again'}`,
  })
}

// Dismiss toasts
export const dismissToast = (toastId?: string) => {
  if (toastId) {
    toast.dismiss(toastId)
  } else {
    toast.dismiss() // Dismiss all toasts
  }
}

export const dismissAllToasts = () => {
  toast.dismiss()
}

// Custom toast with custom styling
export const showCustomToast = (
  message: string,
  options: {
    type?: 'success' | 'error' | 'loading' | 'blank'
    duration?: number
    icon?: string
    style?: React.CSSProperties
    className?: string
  } = {}
) => {
  const { type = 'blank', ...toastOptions } = options
  
  if (type === 'success') return toast.success(message, toastOptions)
  if (type === 'error') return toast.error(message, toastOptions)
  if (type === 'loading') return toast.loading(message, toastOptions)
  
  return toast(message, toastOptions)
}
