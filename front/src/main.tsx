import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { NotesProvider } from './stores/notes.tsx'
import { Web3Provider } from './stores/web3'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Web3Provider>
      <NotesProvider>
        <App />
      </NotesProvider>
    </Web3Provider>
  </StrictMode>,
)
