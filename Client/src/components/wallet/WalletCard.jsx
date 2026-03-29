import React from 'react'
import { formatCurrency } from '../../utils/formatters'

const WalletCard = ({ balance, dailyLimit, monthlyLimit, loading }) => {
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Wallet Balance</h2>
        {loading && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        )}
      </div>
      
      <div className="mb-6">
        <p className="text-3xl font-bold text-blue-600">
          {formatCurrency(balance)}
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Daily Limit</p>
          <p className="font-medium text-gray-800">{formatCurrency(dailyLimit)}</p>
        </div>
        <div>
          <p className="text-gray-500">Monthly Limit</p>
          <p className="font-medium text-gray-800">{formatCurrency(monthlyLimit)}</p>
        </div>
      </div>
    </div>
  )
}

export default WalletCard
