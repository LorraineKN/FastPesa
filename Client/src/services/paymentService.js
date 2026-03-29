import api from './api.js'

export const paymentService = {
  payPhone: async (paymentData) => {
    const response = await api.post('/pay/phone', paymentData)
    return response.data
  }
}
