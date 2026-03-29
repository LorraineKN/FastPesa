import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { walletService } from '../services/walletService'
import { transactionService } from '../services/transactionService'
import useAuthStore from '../stores/authStore'
import useWalletStore from '../stores/walletStore'
import WalletCard from '../components/wallet/WalletCard'
import TransactionItem from '../components/wallet/TransactionItem'
import Button from '../components/UI/Button'
import toast from 'react-hot-toast'
import api from '../services/api'

const Dashboard = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { balance, dailyLimit, monthlyLimit, transactions, setBalance, setTransactions, setLoading } = useWalletStore()
  
  const [loading, setLoadingState] = useState(true)

  // Make testHelpers available globally for testing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.testHelpers = {
        completeTransaction: async (transactionId, status = 'success') => {
          try {
            const response = await api.post('/wallet/mock-callback', {
              transactionId,
              status
            })
            return response.data
          } catch (error) {
            console.error('Failed to complete transaction:', error)
            throw error
          }
        }
      }
    }
  }, [])

  useEffect(() => {
    fetchWalletData()
    fetchRecentTransactions()
  }, [])

  const fetchWalletData = async () => {
    try {
      setLoading(true)
      const walletData = await walletService.getWallet()
      setBalance(walletData.balance, walletData.dailyLimit, walletData.monthlyLimit)
    } catch (error) {
      toast.error('Failed to fetch wallet data')
    } finally {
      setLoading(false)
      setLoadingState(false)
    }
  }

  const fetchRecentTransactions = async () => {
    try {
      const transactionsData = await transactionService.getTransactions({ limit: 5 })
      setTransactions(transactionsData?.transactions || [])
    } catch (error) {
      toast.error('Failed to fetch transactions')
      setTransactions([]) // Ensure transactions is always an array
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
    toast.success('Logged out successfully')
  }

  const quickActions = [
    {
      title: 'Send Money',
      description: 'Send money to phone number',
      icon: '💸',
      onClick: () => navigate('/pay-phone'),
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Recharge Wallet',
      description: 'Add money via M-Pesa',
      icon: '📱',
      onClick: () => navigate('/recharge'),
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'View Transactions',
      description: 'See all transaction history',
      icon: '📊',
      onClick: () => navigate('/transactions'),
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'Settings',
      description: 'Manage account settings',
      icon: '⚙️',
      onClick: () => navigate('/settings'),
      color: 'bg-gray-500 hover:bg-gray-600'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center h-auto sm:h-16 py-3 sm:py-0">
            <div className="mb-2 sm:mb-0">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Emergency Wallet</h1>
              <p className="text-xs sm:text-sm text-gray-500">Welcome back, {user?.fullName}</p>
            </div>
            <div className="flex flex-row space-x-2">
              <Button variant="secondary" size="sm" onClick={() => navigate('/profile')}>
                👤 Profile
              </Button>
              <Button variant="secondary" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          <div className="xl:col-span-2 space-y-4 sm:space-y-6">
            <WalletCard 
              balance={balance} 
              dailyLimit={dailyLimit} 
              monthlyLimit={monthlyLimit}
              loading={loading}
            />
            
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 space-y-2 sm:space-y-0">
                <h2 className="text-base sm:text-lg font-semibold text-gray-800">Recent Transactions</h2>
                <Button variant="secondary" size="sm" onClick={() => navigate('/transactions')}>
                  View All
                </Button>
              </div>
              
              <div className="space-y-2 sm:space-y-3">
                {transactions && transactions.length > 0 ? (
                  transactions.map((transaction) => (
                    <TransactionItem 
                      key={transaction.id} 
                      transaction={transaction} 
                      onUpdate={() => {
                        fetchWalletData()
                        fetchRecentTransactions()
                      }}
                    />
                  ))
                ) : (
                  <p className="text-gray-600 text-center py-6 sm:py-8">No transactions yet</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 sm:grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.onClick}
                    className={`${action.color} text-white rounded-lg p-3 sm:p-4 text-center transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2`}
                  >
                    <div className="text-xl sm:text-2xl mb-1 sm:mb-2">{action.icon}</div>
                    <div className="font-medium text-xs sm:text-sm">{action.title}</div>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
              <h3 className="font-medium text-blue-900 mb-2 text-sm sm:text-base">Emergency Access</h3>
              <p className="text-xs sm:text-sm text-blue-700">
                Your wallet is accessible from any device with just your username and PIN. 
                No phone required for emergency situations.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard
