import React from 'react'
import { formatDate, formatTransactionType, formatStatus, getStatusColor, formatCurrency } from '../../utils/formatters'

const TransactionItem = ({ transaction, onUpdate }) => {
  const { id, type, amount, phone_number, status, reference_code, created_at } = transaction
  
  const handleComplete = async () => {
    if (status !== 'pending') return
    
    try {
      await window.testHelpers.completeTransaction(id, 'success')
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Failed to complete transaction:', error)
    }
  }
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 space-y-2 sm:space-y-0">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className={`w-2 h-2 rounded-full ${status === 'success' ? 'bg-green-500' : status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
          <span className="font-medium text-gray-800 text-sm sm:text-base">{formatTransactionType(type)}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`text-xs sm:text-sm font-medium ${getStatusColor(status)}`}>
            {formatStatus(status)}
          </span>
          {status === 'pending' && (
            <button
              onClick={handleComplete}
              className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
              title="Complete transaction (testing only)"
            >
              Complete
            </button>
          )}
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <p className="text-base sm:text-lg font-semibold text-gray-900">
            {type === 'deposit' ? '+' : '-'}{formatCurrency(amount)}
          </p>
          {phone_number && (
            <p className="text-xs sm:text-sm text-gray-500">{phone_number}</p>
          )}
          {reference_code && (
            <p className="text-xs text-gray-500">Ref: {reference_code}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs sm:text-sm text-gray-500">{formatDate(created_at)}</p>
        </div>
      </div>
    </div>
  )
}

export default TransactionItem
