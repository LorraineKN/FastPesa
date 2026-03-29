export const validateUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9]{3,30}$/
  return usernameRegex.test(username)
}

export const validatePin = (pin) => {
  const pinRegex = /^\d{4}$/
  return pinRegex.test(pin)
}

export const validatePhone = (phone) => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/
  return phoneRegex.test(phone)
}

export const validateAmount = (amount) => {
  const amountNum = parseFloat(amount)
  return !isNaN(amountNum) && amountNum > 0 && amountNum <= 50000
}

export const validateFullName = (name) => {
  return name && name.trim().length >= 2 && name.trim().length <= 100
}
