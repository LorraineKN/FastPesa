import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { walletService } from '../services/walletService'
import { validatePhone, validateAmount } from '../utils/validators'
import Button from '../components/UI/Button'
import Input from '../components/UI/Input'
import toast from 'react-hot-toast'

const Recharge = () => {
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    phoneNumber: '',
    amount: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [stkSent, setStkSent] = useState(false)

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
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    
    try {
      await walletService.recharge({
        phoneNumber: formData.phoneNumber,
        amount: parseFloat(formData.amount)
      })
      
      setStkSent(true)
      toast.success('STK Push sent! Please check your phone.')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Recharge failed')
    } finally {
      setLoading(false)
    }
  }

  const goToDashboard = () => {
    navigate('/dashboard')
  }

  if (stkSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 mb-2">STK Push Sent!</h2>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Phone:</strong> {formData.phoneNumber}
            </p>
            <p className="text-sm text-gray-600 mb-2">
              <strong>Amount:</strong> KES {parseFloat(formData.amount).toFixed(2)}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Reference:</strong> Emergency Wallet
            </p>
          </div>
          
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Please check your phone and complete the M-Pesa transaction. 
              Your wallet will be updated automatically.
            </p>
            
            <Button onClick={goToDashboard} className="w-full">
              Go to Dashboard
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
            <h1 className="text-xl font-semibold text-gray-900">Recharge Wallet</h1>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Add Money via M-Pesa</h2>
            <p className="text-sm text-gray-600">
              Enter your M-Pesa registered phone number and amount to recharge your wallet.
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="M-Pesa Phone Number"
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
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-700">
                <strong>Note:</strong> A confirmation prompt will appear on your phone. 
                Enter your M-Pesa PIN to complete the transaction.
              </p>
            </div>
            
            <Button
              type="submit"
              loading={loading}
              className="w-full"
            >
              Send STK Push
            </Button>
          </form>
        </div>
      </main>
    </div>
  )
}

export default Recharge
