import { create } from 'zustand'

const useWalletStore = create((set, get) => ({
  balance: 0,
  dailyLimit: 0,
  monthlyLimit: 0,
  transactions: [],
  loading: false,
  
  setBalance: (balance, dailyLimit, monthlyLimit) => {
    set({ balance, dailyLimit, monthlyLimit })
  },
  
  setTransactions: (transactions) => {
    set({ transactions })
  },
  
  addTransaction: (transaction) => {
    set(state => ({
      transactions: [transaction, ...state.transactions]
    }))
  },
  
  setLoading: (loading) => {
    set({ loading })
  }
}))

export default useWalletStore
