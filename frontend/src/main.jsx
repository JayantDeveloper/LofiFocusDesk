import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './store/AuthStore'
import { StartupDataProvider } from './store/StartupDataStore'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <StartupDataProvider>
        <App />
      </StartupDataProvider>
    </AuthProvider>
  </StrictMode>,
)
