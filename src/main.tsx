import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { prefetchFirstScreen } from './lib/prefetch'
import './styles/index.css'
import App from './App'

// Before anything else: the first screenful of species and sprites is requested
// while React is still starting, rather than after it has mounted and routed.
prefetchFirstScreen()

// autoUpdate: a new build takes over on the next navigation with no prompt.
registerSW({ immediate: true })

const root = document.getElementById('root')
if (!root) throw new Error('#root is missing from index.html')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
