import React from 'react'
import { formatDate, formatTransactionType, formatStatus, getStatusColor, formatCurrency } from '../../utils/formatters'

const TransactionItem = ({ transaction }) => {
  const { id, type, amount, phone_number, status, reference, created_at } = transaction
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3">
          <div className={`w-2 h-2 rounded-full ${status === 'completed' ? 'bg-green-500' : status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
          <span className="font-medium text-gray-800">{formatTransactionType(type)}</span>
        </div>
        <span className={`text-sm font-medium ${getStatusColor(status)}`}>
          {formatStatus(status)}
        </span>
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold text-gray-900">
            {type === 'recharge' ? '+' : '-'}{formatCurrency(amount)}
          </p>
          {phone_number && (
            <p className="text-sm text-gray-500">{phone_number}</p>
          )}
          {reference && (
            <p className="text-xs text-gray-400">Ref: {reference}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">{formatDate(created_at)}</p>
        </div>
      </div>
    </div>
  )
}

export default TransactionItem
