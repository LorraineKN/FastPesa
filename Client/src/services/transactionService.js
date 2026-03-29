import api from './api.js'

export const transactionService = {
  getTransactions: async (params = {}) => {
    const response = await api.get('/transactions', { params })
    return response.data
  }
}
