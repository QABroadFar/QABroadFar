import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { storage } from './utils/storage'

// APP VERSION - Increment this every deploy to force cache clear
const APP_VERSION = '20260422.01'

// One-time cache clear for existing users
const storedVersion = localStorage.getItem('kk_app_version')
if (storedVersion !== APP_VERSION) {
  console.log('🔄 New app version detected, clearing old cache...')
  
  // Clear ALL old localStorage data
  storage.clearAllAppData()
  
  // Clear service worker cache if available
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => caches.delete(name))
    })
  }
  
  // Store new version
  localStorage.setItem('kk_app_version', APP_VERSION)
  
  // Only reload if we actually cleared old cache
  if (storedVersion) {
    window.location.reload(true)
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
