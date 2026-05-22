import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AdminApp from './AdminApp.jsx'

const isAdminEntry =
  window.location.pathname.startsWith('/admin') ||
  ['5174', '5175'].includes(window.location.port)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isAdminEntry ? <AdminApp /> : <App />}
  </StrictMode>,
)
