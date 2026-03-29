import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../stores/authStore'
import useWalletStore from '../stores/walletStore'
import Button from '../components/UI/Button'
import Input from '../components/UI/Input'
import { validatePin } from '../utils/validators'
import toast from 'react-hot-toast'
import api from '../services/api'

const Settings = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { dailyLimit, monthlyLimit, setDailyLimit, setMonthlyLimit } = useWalletStore()
  
  const [formData, setFormData] = useState({
    currentPin: '',
    newPin: '',
    confirmNewPin: ''
  })
  const [preferences, setPreferences] = useState({
    theme: 'light',
    language: 'en',
    notifications: true,
    autoLogout: true,
    sessionTimeout: '5',
    emailNotifications: false,
    smsNotifications: false,
    transactionAlerts: true,
    lowBalanceAlert: true,
    lowBalanceThreshold: '1000'
  })
  const [limits, setLimits] = useState({
    dailyLimit: '',
    monthlyLimit: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('security')

  useEffect(() => {
    fetchPreferences()
    fetchLimits()
  }, [])

  const fetchPreferences = async () => {
    try {
      const response = await api.get('/user/preferences')
      if (response.data) {
        setPreferences(prev => ({ ...prev, ...response.data }))
      }
    } catch (error) {
      // If no preferences exist yet, use defaults
      console.log('No preferences found, using defaults')
    }
  }

  const fetchLimits = async () => {
    try {
      const response = await api.get('/wallet/limits')
      if (response.data) {
        setLimits({
          dailyLimit: response.data.dailyLimit?.toString() || '',
          monthlyLimit: response.data.monthlyLimit?.toString() || ''
        })
      }
    } catch (error) {
      console.log('No custom limits found, using defaults')
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    if (name.startsWith('pref_')) {
      const prefName = name.replace('pref_', '')
      setPreferences(prev => ({ 
        ...prev, 
        [prefName]: type === 'checkbox' ? checked : value 
      }))
    } else if (name.startsWith('limit_')) {
      const limitName = name.replace('limit_', '')
      setLimits(prev => ({ ...prev, [limitName]: value }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.currentPin) {
      newErrors.currentPin = 'Current PIN is required'
    } else if (!validatePin(formData.currentPin)) {
      newErrors.currentPin = 'PIN must be 4 digits'
    }
    
    if (!formData.newPin) {
      newErrors.newPin = 'New PIN is required'
    } else if (!validatePin(formData.newPin)) {
      newErrors.newPin = 'PIN must be 4 digits'
    }
    
    if (!formData.confirmNewPin) {
      newErrors.confirmNewPin = 'Please confirm your new PIN'
    } else if (formData.newPin !== formData.confirmNewPin) {
      newErrors.confirmNewPin = 'PINs do not match'
    }
    
    if (formData.currentPin === formData.newPin) {
      newErrors.newPin = 'New PIN must be different from current PIN'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handlePinUpdate = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    
    try {
      await api.put('/auth/update-pin', {
        currentPin: formData.currentPin,
        newPin: formData.newPin
      })
      
      toast.success('PIN updated successfully!')
      setFormData({ currentPin: '', newPin: '', confirmNewPin: '' })
    } catch (error) {
      toast.error('Failed to update PIN')
    } finally {
      setLoading(false)
    }
  }

  const handlePreferencesUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      await api.put('/user/preferences', preferences)
      toast.success('Preferences updated successfully!')
    } catch (error) {
      toast.error('Failed to update preferences')
    } finally {
      setLoading(false)
    }
  }

  const handleLimitsUpdate = async (e) => {
    e.preventDefault()
    
    // Validate limits
    const newErrors = {}
    const daily = parseFloat(limits.dailyLimit)
    const monthly = parseFloat(limits.monthlyLimit)
    
    if (!limits.dailyLimit || daily < 0) {
      newErrors.dailyLimit = 'Please enter a valid daily limit'
    }
    
    if (!limits.monthlyLimit || monthly < 0) {
      newErrors.monthlyLimit = 'Please enter a valid monthly limit'
    }
    
    if (daily && monthly && daily > monthly) {
      newErrors.dailyLimit = 'Daily limit cannot exceed monthly limit'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    setLoading(true)
    
    try {
      await api.put('/wallet/limits', {
        dailyLimit: daily,
        monthlyLimit: monthly
      })
      
      setDailyLimit(daily)
      setMonthlyLimit(monthly)
      toast.success('Limits updated successfully!')
    } catch (error) {
      toast.error('Failed to update limits')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
    toast.success('Logged out successfully')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button 
              variant="secondary" 
              onClick={() => navigate('/dashboard')}
              className="mr-4"
              size="sm"
            >
              ← Back
            </Button>
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Settings</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4 sm:py-8">
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-4 sm:mb-6">
          <div className="flex flex-wrap border-b border-gray-200">
            <button
              onClick={() => setActiveTab('security')}
              className={`flex-1 min-w-0 px-3 sm:px-6 py-3 font-medium text-xs sm:text-sm border-b-2 transition-colors ${
                activeTab === 'security'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <span className="hidden sm:inline">🔒 Security</span>
              <span className="sm:hidden">🔒</span>
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className={`flex-1 min-w-0 px-3 sm:px-6 py-3 font-medium text-xs sm:text-sm border-b-2 transition-colors ${
                activeTab === 'preferences'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <span className="hidden sm:inline">⚙️ Preferences</span>
              <span className="sm:hidden">⚙️</span>
            </button>
            <button
              onClick={() => setActiveTab('limits')}
              className={`flex-1 min-w-0 px-3 sm:px-6 py-3 font-medium text-xs sm:text-sm border-b-2 transition-colors ${
                activeTab === 'limits'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <span className="hidden sm:inline">📊 Limits</span>
              <span className="sm:hidden">📊</span>
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex-1 min-w-0 px-3 sm:px-6 py-3 font-medium text-xs sm:text-sm border-b-2 transition-colors ${
                activeTab === 'notifications'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <span className="hidden sm:inline">🔔 Notifications</span>
              <span className="sm:hidden">🔔</span>
            </button>
          </div>
        </div>

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Account Information</h2>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-sm sm:text-base text-gray-600">Full Name:</span>
                  <span className="font-medium text-sm sm:text-base">{user?.fullName}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-sm sm:text-base text-gray-600">Username:</span>
                  <span className="font-medium text-sm sm:text-base">{user?.username}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm sm:text-base text-gray-600">Account Status:</span>
                  <span className="font-medium text-green-600 text-sm sm:text-base">Active</span>
                </div>
              </div>
              <div className="mt-3 sm:mt-4">
                <Button variant="secondary" size="sm" onClick={() => navigate('/profile')}>
                  View Full Profile
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Change PIN</h2>
              <form onSubmit={handlePinUpdate} className="space-y-3 sm:space-y-4">
                <Input
                  label="Current PIN"
                  name="currentPin"
                  type="password"
                  value={formData.currentPin}
                  onChange={handleChange}
                  placeholder="Enter current PIN"
                  error={errors.currentPin}
                  maxLength={4}
                />
                
                <Input
                  label="New PIN"
                  name="newPin"
                  type="password"
                  value={formData.newPin}
                  onChange={handleChange}
                  placeholder="Enter new 4-digit PIN"
                  error={errors.newPin}
                  maxLength={4}
                />
                
                <Input
                  label="Confirm New PIN"
                  name="confirmNewPin"
                  type="password"
                  value={formData.confirmNewPin}
                  onChange={handleChange}
                  placeholder="Confirm new PIN"
                  error={errors.confirmNewPin}
                  maxLength={4}
                />
                
                <Button
                  type="submit"
                  loading={loading}
                  className="w-full"
                  size="sm"
                >
                  Update PIN
                </Button>
              </form>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Security Tips</h2>
              <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 flex-shrink-0">•</span>
                  Never share your PIN with anyone
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 flex-shrink-0">•</span>
                  Change your PIN regularly
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 flex-shrink-0">•</span>
                  Use a PIN that's not easily guessable
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 flex-shrink-0">•</span>
                  Always logout after using the wallet
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Website Preferences</h2>
              <form onSubmit={handlePreferencesUpdate} className="space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Theme
                  </label>
                  <select
                    name="pref_theme"
                    value={preferences.theme}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto (System)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Language
                  </label>
                  <select
                    name="pref_language"
                    value={preferences.language}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  >
                    <option value="en">English</option>
                    <option value="sw">Swahili</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="pref_autoLogout"
                    checked={preferences.autoLogout}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Auto-logout after inactivity
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Session Timeout (minutes)
                  </label>
                  <select
                    name="pref_sessionTimeout"
                    value={preferences.sessionTimeout}
                    onChange={handleChange}
                    disabled={!preferences.autoLogout}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-sm sm:text-base"
                  >
                    <option value="2">2 minutes</option>
                    <option value="5">5 minutes</option>
                    <option value="10">10 minutes</option>
                    <option value="15">15 minutes</option>
                  </select>
                </div>

                <Button
                  type="submit"
                  loading={loading}
                  className="w-full"
                  size="sm"
                >
                  Save Preferences
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* Limits Tab */}
        {activeTab === 'limits' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Transaction Limits</h2>
              <form onSubmit={handleLimitsUpdate} className="space-y-3 sm:space-y-4">
                <Input
                  label="Daily Transaction Limit (Ksh)"
                  name="limit_dailyLimit"
                  type="number"
                  value={limits.dailyLimit}
                  onChange={handleChange}
                  placeholder="Enter daily limit"
                  error={errors.dailyLimit}
                  min="0"
                  step="100"
                />
                
                <Input
                  label="Monthly Transaction Limit (Ksh)"
                  name="limit_monthlyLimit"
                  type="number"
                  value={limits.monthlyLimit}
                  onChange={handleChange}
                  placeholder="Enter monthly limit"
                  error={errors.monthlyLimit}
                  min="0"
                  step="1000"
                />
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                  <h4 className="font-medium text-blue-900 mb-2 text-sm sm:text-base">Current Limits</h4>
                  <p className="text-xs sm:text-sm text-blue-700">
                    Daily: Ksh {dailyLimit?.toLocaleString() || '0'}<br />
                    Monthly: Ksh {monthlyLimit?.toLocaleString() || '0'}
                  </p>
                </div>
                
                <Button
                  type="submit"
                  loading={loading}
                  className="w-full"
                  size="sm"
                >
                  Update Limits
                </Button>
              </form>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Limit Information</h2>
              <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-600">
                <p>
                  <strong>Daily Limit:</strong> Maximum amount you can transact in a single day.
                </p>
                <p>
                  <strong>Monthly Limit:</strong> Maximum amount you can transact in a calendar month.
                </p>
                <p>
                  <strong>Security:</strong> Limits help protect your account from unauthorized transactions.
                </p>
                <p>
                  <strong>Note:</strong> Changes take effect immediately and apply to all future transactions.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Notification Preferences</h2>
              <form onSubmit={handlePreferencesUpdate} className="space-y-4 sm:space-y-6">
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-sm sm:text-md font-medium text-gray-800">Alert Types</h3>
                  
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      name="pref_transactionAlerts"
                      checked={preferences.transactionAlerts}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      Transaction alerts (send/receive money)
                    </label>
                  </div>

                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      name="pref_lowBalanceAlert"
                      checked={preferences.lowBalanceAlert}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      Low balance alerts
                    </label>
                  </div>

                  <div className="ml-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Alert when balance falls below:
                    </label>
                    <input
                      type="number"
                      name="pref_lowBalanceThreshold"
                      value={preferences.lowBalanceThreshold}
                      onChange={handleChange}
                      disabled={!preferences.lowBalanceAlert}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-sm sm:text-base"
                      min="0"
                      step="100"
                    />
                    <span className="text-xs text-gray-500 ml-2">Ksh</span>
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-sm sm:text-md font-medium text-gray-800">Notification Channels</h3>
                  
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      name="pref_emailNotifications"
                      checked={preferences.emailNotifications}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      Email notifications
                    </label>
                  </div>

                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      name="pref_smsNotifications"
                      checked={preferences.smsNotifications}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      SMS notifications
                    </label>
                  </div>
                </div>

                <Button
                  type="submit"
                  loading={loading}
                  className="w-full"
                  size="sm"
                >
                  Save Notification Settings
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* Account Actions */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Account Actions</h2>
          <div className="space-y-2 sm:space-y-3">
            <Button
              variant="secondary"
              onClick={() => navigate('/profile')}
              className="w-full"
              size="sm"
            >
              👤 View Profile
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate('/transactions')}
              className="w-full"
              size="sm"
            >
              📊 View Transaction History
            </Button>
            <Button
              variant="danger"
              onClick={handleLogout}
              className="w-full"
              size="sm"
            >
              🚪 Logout
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Settings
