import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { paymentService } from '../services/paymentService'
import { validatePhone, validateAmount } from '../utils/validators'
import useWalletStore from '../stores/walletStore'
import Button from '../components/UI/Button'
import Input from '../components/UI/Input'
import toast from 'react-hot-toast'

const PayPhone = () => {
  const navigate = useNavigate()
  const { balance } = useWalletStore()
  
  const [formData, setFormData] = useState({
    phoneNumber: '',
    amount: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = 'Phone number is required'
    } else if (!validatePhone(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Invalid phone number format'
    }
    
    if (!formData.amount) {
      newErrors.amount = 'Amount is required'
    } else if (!validateAmount(formData.amount)) {
      newErrors.amount = 'Amount must be between 1 and 50,000'
    } else if (parseFloat(formData.amount) > balance) {
      newErrors.amount = 'Insufficient balance'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setShowConfirm(true)
  }

  const confirmPayment = async () => {
    setLoading(true)
    
    try {
      await paymentService.payPhone({
        phoneNumber: formData.phoneNumber,
        amount: parseFloat(formData.amount)
      })
      
      toast.success('Payment initiated successfully!')
      navigate('/dashboard')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Payment failed')
    } finally {
      setLoading(false)
      setShowConfirm(false)
    }
  }

  const cancelPayment = () => {
    setShowConfirm(false)
  }

  if (showConfirm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Confirm Payment</h2>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Phone Number:</span>
                <span className="font-medium">{formData.phoneNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium text-lg">KES {parseFloat(formData.amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">New Balance:</span>
                <span className="font-medium text-lg text-blue-600">
                  KES {(balance - parseFloat(formData.amount)).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <Button
              variant="secondary"
              onClick={cancelPayment}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmPayment}
              loading={loading}
              className="flex-1"
            >
              Confirm Payment
            </Button>
          </div>
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
            >
              ← Back
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">Send Money to Phone</h1>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Phone Number"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="+254712345678"
              error={errors.phoneNumber}
              required
            />
            
            <Input
              label="Amount (KES)"
              name="amount"
              type="number"
              value={formData.amount}
              onChange={handleChange}
              placeholder="Enter amount"
              error={errors.amount}
              required
              min="1"
              max="50000"
              step="0.01"
            />
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                <strong>Available Balance:</strong> KES {balance.toFixed(2)}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Maximum transaction: KES 5,000
              </p>
            </div>
            
            <Button
              type="submit"
              loading={loading}
              className="w-full"
            >
              Send Money
            </Button>
          </form>
        </div>
      </main>
    </div>
  )
}

export default PayPhone
