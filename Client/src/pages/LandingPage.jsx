import React from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/UI/Button'

const LandingPage = () => {
  const features = [
    {
      title: 'Phone-Free Access',
      description: 'Access your wallet from any device using just your username and PIN',
      icon: '📱'
    },
    {
      title: 'Emergency Ready',
      description: 'Perfect for emergencies when you lose your phone or run out of battery',
      icon: '🆘'
    },
    {
      title: 'Secure & Fast',
      description: 'Bank-level security with instant transactions when you need them most',
      icon: '🔒'
    },
    {
      title: 'M-Pesa Integration',
      description: 'Seamlessly integrated with M-Pesa for deposits and withdrawals',
      icon: '💰'
    }
  ]

  const steps = [
    {
      step: '1',
      title: 'Create Account',
      description: 'Register with your username and PIN'
    },
    {
      step: '2',
      title: 'Recharge Wallet',
      description: 'Add funds via M-Pesa STK Push'
    },
    {
      step: '3',
      title: 'Access Anywhere',
      description: 'Login from any device, no phone needed'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-lg sm:text-2xl font-bold text-blue-600">Emergency Wallet</h1>
            </div>
            <div className="flex space-x-2 sm:space-x-4">
              <Link to="/login">
                <Button variant="secondary" size="sm">Login</Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Sign Up</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-gray-900 mb-4 sm:mb-6">
            Access Your Money
            <span className="block text-blue-600">Without Your Phone</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8 max-w-3xl mx-auto px-4">
            Emergency Wallet provides secure access to your M-Pesa funds from any device. 
            Perfect for phone loss, battery drain, or emergency situations.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <Link to="/register">
              <Button size="lg" className="text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto">
                Get Started Now
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary" size="lg" className="text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto">
                Login to Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Emergency Wallet?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Designed for real-life emergencies when you need access to your money most.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-4 sm:p-6 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">{feature.icon}</div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm sm:text-base text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get started in minutes and be prepared for any emergency.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-4">{step.step}</div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm sm:text-base text-gray-600">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <div className="text-2xl text-gray-400">→</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Emergency Scenarios */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Perfect for Emergency Situations
            </h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-red-900 mb-2 sm:mb-3">🚨 Phone Lost or Stolen</h3>
              <p className="text-sm sm:text-base text-red-700">
                Access your funds immediately from any device while you secure your phone and get a replacement.
              </p>
            </div>
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-orange-900 mb-2 sm:mb-3">🔋 Phone Battery Dead</h3>
              <p className="text-sm sm:text-base text-orange-700">
                Borrow a friend's device or use a public computer to access your money when you can't charge your phone.
              </p>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-yellow-900 mb-2 sm:mb-3">🌍 Travel Emergencies</h3>
              <p className="text-sm sm:text-base text-yellow-700">
                Send money home or pay for services when traveling without relying on your mobile device.
              </p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-2 sm:mb-3">⚡ Quick Access Needed</h3>
              <p className="text-sm sm:text-base text-blue-700">
                Skip the hassle of unlocking your phone when you need to make urgent payments.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Be Prepared for Any Emergency
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of users who trust Emergency Wallet for secure, phone-free access to their money.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <a 
              href="/register" 
              className="cta-button-primary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto rounded-lg transition-colors text-center"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = '/register';
              }}
            >
              Create Your Emergency Wallet
            </a>
            <a 
              href="/login" 
              className="cta-button-secondary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto rounded-lg transition-colors text-center"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = '/login';
              }}
            >
              Login to Existing Account
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-blue-400 mb-3 sm:mb-4">Emergency Wallet</h3>
              <p className="footer-text text-sm sm:text-base">
                Your financial safety net for when you need it most.
              </p>
            </div>
            
            <div>
              <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Quick Links</h4>
              <ul className="space-y-1 sm:space-y-2 text-sm sm:text-base">
                <li>
                  <a 
                    href="/login" 
                    className="footer-link block"
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = '/login';
                    }}
                  >
                    Login
                  </a>
                </li>
                <li>
                  <a 
                    href="/register" 
                    className="footer-link block"
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = '/register';
                    }}
                  >
                    Register
                  </a>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Security</h4>
              <p className="footer-text text-sm sm:text-base">
                Bank-level security with encrypted transactions and secure PIN authentication.
              </p>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="footer-text">&copy; 2026 Emergency Wallet. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
