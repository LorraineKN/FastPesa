import api from './api.js'

export const authService = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData)
    return response.data
  },

  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials)
    return response.data
  },

  refreshToken: async (refreshToken) => {
    const response = await api.post('/auth/refresh', { refreshToken })
    return response.data
  },

  logout: async (refreshToken) => {
    const response = await api.post('/auth/logout', { refreshToken })
    return response.data
  }
}
