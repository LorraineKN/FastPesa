import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../stores/authStore'
import useWalletStore from '../stores/walletStore'
import Button from '../components/UI/Button'
import Input from '../components/UI/Input'
import WalletCard from '../components/wallet/WalletCard'
import toast from 'react-hot-toast'
import api from '../services/api'

const Profile = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { balance, dailyLimit, monthlyLimit, setBalance } = useWalletStore()
  
  const [loading, setLoading] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: ''
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetchProfileData()
    fetchWalletData()
  }, [])

  const fetchProfileData = async () => {
    try {
      setLoading(true)
      const response = await api.get('/user/profile')
      const userData = response.data
      setFormData({
        fullName: userData.fullName || '',
        phone: userData.phone || '',
        email: userData.email || ''
      })
    } catch (error) {
      toast.error('Failed to fetch profile data')
    } finally {
      setLoading(false)
    }
  }

  const fetchWalletData = async () => {
    try {
      const walletData = await api.get('/wallet')
      setBalance(walletData.data.balance, walletData.data.dailyLimit, walletData.data.monthlyLimit)
    } catch (error) {
      toast.error('Failed to fetch wallet data')
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    }
    
    if (formData.phone && !/^(\+?\d{10,15})?$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number'
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    
    try {
      await api.put('/user/update', formData)
      toast.success('Profile updated successfully!')
      setEditMode(false)
      
      // Update user store with new data
      const updatedUser = { ...user, ...formData }
      useAuthStore.setState({ user: updatedUser })
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelEdit = () => {
    setEditMode(false)
    setErrors({})
    fetchProfileData() // Reset to original data
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
    toast.success('Logged out successfully')
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading && !formData.fullName) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
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
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900">My Profile</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4 sm:py-8">
        <div className="space-y-4 sm:space-y-6">
          {/* Wallet Summary */}
          <WalletCard 
            balance={balance} 
            dailyLimit={dailyLimit} 
            monthlyLimit={monthlyLimit}
            loading={loading}
          />

          {/* Personal Information */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-2 sm:space-y-0">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Personal Information</h2>
              {!editMode && (
                <Button variant="secondary" size="sm" onClick={() => setEditMode(true)}>
                  Edit Profile
                </Button>
              )}
            </div>

            {editMode ? (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <Input
                  label="Full Name"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  error={errors.fullName}
                />
                
                <Input
                  label="Phone Number"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number (optional)"
                  error={errors.phone}
                />
                
                <Input
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email (optional)"
                  error={errors.email}
                />
                
                <div className="flex flex-col sm:flex-row sm:space-x-3 pt-4 space-y-3 sm:space-y-0">
                  <Button
                    type="submit"
                    loading={loading}
                    className="w-full sm:flex-1"
                  >
                    Save Changes
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleCancelEdit}
                    className="w-full sm:flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-200">
                  <span className="text-gray-600">Full Name:</span>
                  <span className="font-medium">{formData.fullName || 'Not set'}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-200">
                  <span className="text-gray-600">Username:</span>
                  <span className="font-medium">{user?.username}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-200">
                  <span className="text-gray-600">Phone Number:</span>
                  <span className="font-medium">{formData.phone || 'Not added'}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-200">
                  <span className="text-gray-600">Email Address:</span>
                  <span className="font-medium">{formData.email || 'Not added'}</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-gray-600">Account Status:</span>
                  <span className="font-medium text-green-600">Active</span>
                </div>
              </div>
            )}
          </div>

          {/* Account Details */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Account Details</h2>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between py-2 sm:py-3 border-b border-gray-200">
                <span className="text-sm sm:text-base text-gray-600">Account Created:</span>
                <span className="font-medium text-sm sm:text-base">
                  {user?.createdAt ? formatDate(user.createdAt) : 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between py-2 sm:py-3 border-b border-gray-200">
                <span className="text-sm sm:text-base text-gray-600">Last Login:</span>
                <span className="font-medium text-sm sm:text-base">
                  {user?.lastLoginAt ? formatDate(user.lastLoginAt) : 'First time login'}
                </span>
              </div>
              <div className="flex justify-between py-2 sm:py-3 border-b border-gray-200">
                <span className="text-sm sm:text-base text-gray-600">Account Type:</span>
                <span className="font-medium text-sm sm:text-base">Personal</span>
              </div>
              <div className="flex justify-between py-2 sm:py-3">
                <span className="text-sm sm:text-base text-gray-600">Daily Transaction Limit:</span>
                <span className="font-medium text-sm sm:text-base">Ksh {dailyLimit?.toLocaleString() || '0'}</span>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Security Settings</h2>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start py-2 sm:py-3 border-b border-gray-200 space-y-1 sm:space-y-0">
                <div>
                  <span className="text-sm sm:text-base text-gray-600 block">PIN Protection</span>
                  <span className="text-xs sm:text-sm text-gray-500">4-digit PIN required for access</span>
                </div>
                <span className="text-green-600 font-medium text-sm sm:text-base">Enabled</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start py-2 sm:py-3 border-b border-gray-200 space-y-1 sm:space-y-0">
                <div>
                  <span className="text-sm sm:text-base text-gray-600 block">Session Timeout</span>
                  <span className="text-xs sm:text-sm text-gray-500">Auto logout after inactivity</span>
                </div>
                <span className="text-green-600 font-medium text-sm sm:text-base">5 minutes</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start py-2 sm:py-3 space-y-1 sm:space-y-0">
                <div>
                  <span className="text-sm sm:text-base text-gray-600 block">Two-Factor Authentication</span>
                  <span className="text-xs sm:text-sm text-gray-500">Extra security layer</span>
                </div>
                <span className="text-gray-600 font-medium text-sm sm:text-base">Not Available</span>
              </div>
            </div>
            
            <div className="mt-4 sm:mt-6">
              <Button variant="secondary" size="sm" onClick={() => navigate('/settings')}>
                Manage Security Settings
              </Button>
            </div>
          </div>

          {/* Account Actions */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Account Actions</h2>
            <div className="space-y-2 sm:space-y-3">
              <Button
                variant="secondary"
                onClick={() => navigate('/settings')}
                className="w-full"
                size="sm"
              >
                ⚙️ Account Settings
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
        </div>
      </main>
    </div>
  )
}

export default Profile
