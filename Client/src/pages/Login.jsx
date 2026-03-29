import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuthStore from '../stores/authStore'
import { authService } from '../services/authService'
import { validateUsername, validatePin } from '../utils/validators'
import Button from '../components/UI/Button'
import Input from '../components/UI/Input'
import toast from 'react-hot-toast'

const Login = () => {
  const navigate = useNavigate()
  const login = useAuthStore(state => state.login)
  
  const [formData, setFormData] = useState({
    username: '',
    pin: ''
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
    
    if (!formData.username) {
      newErrors.username = 'Username is required'
    } else if (!validateUsername(formData.username)) {
      newErrors.username = 'Invalid username format'
    }
    
    if (!formData.pin) {
      newErrors.pin = 'PIN is required'
    } else if (!validatePin(formData.pin)) {
      newErrors.pin = 'PIN must be 4 digits'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    
    try {
      const response = await authService.login(formData)
      login(response)
      toast.success('Login successful!')
      navigate('/dashboard')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6 sm:p-8 space-y-6 sm:space-y-8">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
            Emergency Wallet
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            Sign in to your account
          </p>
        </div>
        
        <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
          <Input
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Enter your username"
            error={errors.username}
            required
          />
          
          <Input
            label="PIN"
            name="pin"
            type="password"
            value={formData.pin}
            onChange={handleChange}
            placeholder="Enter your 4-digit PIN"
            error={errors.pin}
            required
            maxLength={4}
          />
          
          <Button
            type="submit"
            loading={loading}
            className="w-full"
            size="lg"
          >
            Sign In
          </Button>
          
          <div className="text-center pt-3 sm:pt-4 border-t border-gray-200">
            <Link
              to="/register"
              className="text-blue-600 hover:text-blue-700 font-medium text-sm sm:text-base transition-colors"
            >
              Don't have an account? Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login
