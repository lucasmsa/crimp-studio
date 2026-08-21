import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LandingPage } from './pages/landing'
import { AboutPage } from './pages/about'
import { EditorPage } from './pages/editor'
import { ScanPage } from './pages/scan'
import { useThemeStore } from './stores/theme'

function App() {
  /* Read once so the stored choice is applied on any page, not only the ones
     that happen to show the toggle */
  useThemeStore((state) => state.theme)

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/scan" element={<ScanPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
