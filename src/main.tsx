import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import '@fontsource/inter/greek-400.css'
import '@fontsource/inter/greek-500.css'
import '@fontsource/inter/greek-600.css'
import '@fontsource/inter/greek-700.css'
import '@fontsource/inter/greek-800.css'
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-700.css'
import '@fontsource/inter/latin-800.css'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  // when a new version takes over, reload once so the update shows immediately (not only on the second open)
  const hadController = !!navigator.serviceWorker.controller
  let reloaded = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController && !reloaded) {
      reloaded = true
      location.reload()
    }
  })
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}))
}
