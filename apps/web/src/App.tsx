import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LandingPage } from './pages/landing'
import { AboutPage } from './pages/about'
import { EditorPage } from './pages/editor'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/editor" element={<EditorPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
