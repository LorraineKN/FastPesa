// Utility function to clear session data for debugging
export const clearSessionData = () => {
  console.log('[Utils] Clearing all session data');
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
  // Also clear any other potential old data
  Object.keys(localStorage).forEach(key => {
    if (key.includes('auth') || key.includes('supabase') || key.includes('token')) {
      localStorage.removeItem(key);
    }
  });
  // Force page reload to clear any in-memory state
  window.location.reload();
};
