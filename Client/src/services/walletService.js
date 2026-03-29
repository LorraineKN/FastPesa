import api from './api.js'

export const walletService = {
  getWallet: async () => {
    const response = await api.get('/wallet')
    return response.data
  },

  recharge: async (rechargeData) => {
    const response = await api.post('/wallet/recharge', rechargeData)
    return response.data
  }
}
