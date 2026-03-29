import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { transactionService } from '../services/transactionService'
import useWalletStore from '../stores/walletStore'
import TransactionItem from '../components/wallet/TransactionItem'
import Button from '../components/UI/Button'
import { formatDate, formatCurrency } from '../utils/formatters'
import toast from 'react-hot-toast'

const Transactions = () => {
  const navigate = useNavigate()
  const { transactions, setTransactions } = useWalletStore()
  
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    limit: 20,
    offset: 0,
    total: 0
  })
  const [filters, setFilters] = useState({
    type: '',
    status: ''
  })

  useEffect(() => {
    fetchTransactions()
  }, [pagination.offset, filters])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const params = {
        limit: pagination.limit,
        offset: pagination.offset,
        ...filters
      }
      
      const data = await transactionService.getTransactions(params)
      setTransactions(data.transactions)
      setPagination(prev => ({ ...prev, total: data.pagination.total }))
    } catch (error) {
      toast.error('Failed to fetch transactions')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
    setPagination(prev => ({ ...prev, offset: 0 }))
  }

  const loadMore = () => {
    setPagination(prev => ({ 
      ...prev, 
      offset: prev.offset + prev.limit 
    }))
  }

  const totalPages = Math.ceil(pagination.total / pagination.limit)
  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button 
              variant="secondary" 
              onClick={() => navigate('/dashboard')}
              className="mr-4"
            >
              ← Back
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">Transaction History</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transaction Type
              </label>
              <select
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="recharge">Recharge</option>
                <option value="payment">Payment</option>
                <option value="refund">Refund</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                <p>Total: {pagination.total} transactions</p>
                <p>Page {currentPage} of {totalPages || 1}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading transactions...</p>
            </div>
          ) : transactions.length > 0 ? (
            <>
              {transactions.map((transaction) => (
                <TransactionItem key={transaction.id} transaction={transaction} />
              ))}
              
              {pagination.offset + pagination.limit < pagination.total && (
                <div className="text-center pt-4">
                  <Button onClick={loadMore} disabled={loading}>
                    {loading ? 'Loading...' : 'Load More'}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
              <p className="text-gray-600 mb-4">
                {filters.type || filters.status 
                  ? 'No transactions match your filters.' 
                  : 'You haven\'t made any transactions yet.'}
              </p>
              <Button onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default Transactions
