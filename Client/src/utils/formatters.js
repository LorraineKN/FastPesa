export const formatCurrency = (amount, currency = 'KES') => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const formatTransactionType = (type) => {
  const types = {
    'recharge': 'Recharge',
    'payment': 'Payment',
    'refund': 'Refund'
  }
  return types[type] || type
}

export const formatStatus = (status) => {
  const statuses = {
    'pending': 'Pending',
    'completed': 'Completed',
    'failed': 'Failed',
    'cancelled': 'Cancelled'
  }
  return statuses[status] || status
}

export const getStatusColor = (status) => {
  const colors = {
    'pending': 'text-yellow-600',
    'completed': 'text-green-600',
    'failed': 'text-red-600',
    'cancelled': 'text-gray-600'
  }
  return colors[status] || 'text-gray-600'
}
