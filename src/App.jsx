import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import LandingPage from './pages/LandingPage.jsx'
import PredictionForm from './pages/PredictionForm.jsx'
import ResultsDashboard from './pages/ResultsDashboard.jsx'
import EnvironmentalData from './pages/EnvironmentalData.jsx'
import AboutPage from './pages/AboutPage.jsx'

// Scroll to top helper on route change
function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.replace('#', ''))
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
        return
      }
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])

  return null
}

export default function App() {
  return (
    <div className="app-layout">
      <ScrollToTop />
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/predict" element={<PredictionForm />} />
          <Route path="/results" element={<ResultsDashboard />} />
          <Route path="/environmental" element={<EnvironmentalData />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<LandingPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
