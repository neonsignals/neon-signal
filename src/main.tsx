import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './client/styles/tokens.css'
import './client/styles/global.css'
import './client/styles/visual-upgrade.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)