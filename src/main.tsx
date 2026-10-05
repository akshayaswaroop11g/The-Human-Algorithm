import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* HashRouter (URLs like /#/results) works on any static host with no server setup. */}
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
