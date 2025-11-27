import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './lib/analytics' // Initialize analytics
import App from './App.tsx'

import { PopoverProvider } from './components/PopoverManager'
import { FeatureFlagProvider } from './contexts/FeatureFlagContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FeatureFlagProvider>
      <PopoverProvider>
        <App />
      </PopoverProvider>
    </FeatureFlagProvider>
  </StrictMode>,
)
