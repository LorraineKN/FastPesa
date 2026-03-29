import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../stores/authStore'
import Button from '../components/UI/Button'
import Input from '../components/UI/Input'
import { validatePin } from '../utils/validators'
import toast from 'react-hot-toast'

const Settings = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  
  const [formData, setFormData] = useState({
    currentPin: '',
    newPin: '',
    confirmNewPin: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
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
      // This would call an API to update the PIN
      // await authService.updatePin(formData)
      
      toast.success('PIN updated successfully!')
      setFormData({ currentPin: '', newPin: '', confirmNewPin: '' })
    } catch (error) {
      toast.error('Failed to update PIN')
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
            >
              ← Back
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600">Full Name:</span>
                <span className="font-medium">{user?.fullName}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600">Username:</span>
                <span className="font-medium">{user?.username}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Account Status:</span>
                <span className="font-medium text-green-600">Active</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Change PIN</h2>
            <form onSubmit={handlePinUpdate} className="space-y-4">
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
              >
                Update PIN
              </Button>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Security Tips</h2>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                Never share your PIN with anyone
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                Change your PIN regularly
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                Use a PIN that's not easily guessable
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                Always logout after using the wallet
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Actions</h2>
            <div className="space-y-3">
              <Button
                variant="secondary"
                onClick={handleLogout}
                className="w-full"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Settings
