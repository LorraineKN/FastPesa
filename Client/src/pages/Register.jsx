import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'
import { validateUsername, validatePin, validatePhone, validateFullName } from '../utils/validators'
import Button from '../components/UI/Button'
import Input from '../components/UI/Input'
import toast from 'react-hot-toast'

const Register = () => {
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    pin: '',
    confirmPin: '',
    phoneNumber: ''
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
    
    if (!formData.fullName) {
      newErrors.fullName = 'Full name is required'
    } else if (!validateFullName(formData.fullName)) {
      newErrors.fullName = 'Full name must be 2-100 characters'
    }
    
    if (!formData.username) {
      newErrors.username = 'Username is required'
    } else if (!validateUsername(formData.username)) {
      newErrors.username = 'Username must be 3-30 alphanumeric characters'
    }
    
    if (!formData.pin) {
      newErrors.pin = 'PIN is required'
    } else if (!validatePin(formData.pin)) {
      newErrors.pin = 'PIN must be 4 digits'
    }
    
    if (!formData.confirmPin) {
      newErrors.confirmPin = 'Please confirm your PIN'
    } else if (formData.pin !== formData.confirmPin) {
      newErrors.confirmPin = 'PINs do not match'
    }
    
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = 'Phone number is required'
    } else if (!validatePhone(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Invalid phone number format'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    
    try {
      await authService.register({
        fullName: formData.fullName,
        username: formData.username,
        pin: formData.pin,
        phoneNumber: formData.phoneNumber
      })
      toast.success('Registration successful! Please login.')
      navigate('/login')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create Account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join Emergency Wallet today
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <Input
            label="Full Name"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Enter your full name"
            error={errors.fullName}
            required
          />
          
          <Input
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Choose a username"
            error={errors.username}
            required
          />
          
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
            label="PIN"
            name="pin"
            type="password"
            value={formData.pin}
            onChange={handleChange}
            placeholder="Enter 4-digit PIN"
            error={errors.pin}
            required
            maxLength={4}
          />
          
          <Input
            label="Confirm PIN"
            name="confirmPin"
            type="password"
            value={formData.confirmPin}
            onChange={handleChange}
            placeholder="Confirm your PIN"
            error={errors.confirmPin}
            required
            maxLength={4}
          />
          
          <Button
            type="submit"
            loading={loading}
            className="w-full"
          >
            Create Account
          </Button>
          
          <div className="text-center">
            <Link
              to="/login"
              className="text-blue-600 hover:text-blue-500 text-sm"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Register
