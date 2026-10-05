/**
 * App = the page layout (nav + footer) and the list of routes (URLs → pages).
 * To add a page: create it in src/pages, then add a <Route> below and a link in NavBar.
 */
import { lazy, Suspense, useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import Footer from './components/Footer'
import NavBar from './components/NavBar'
import { LoadingState } from './components/States'
import Home from './pages/Home'
import Experiment from './pages/Experiment'
import NotFound from './pages/NotFound'

// Chart-heavy pages are loaded only when visited, so the homepage stays fast.
const Results = lazy(() => import('./pages/Results'))
const Explore = lazy(() => import('./pages/Explore'))
const ExperimentsLibrary = lazy(() => import('./pages/ExperimentsLibrary'))
const ExperimentDetail = lazy(() => import('./pages/ExperimentDetail'))
const About = lazy(() => import('./pages/About'))

export default function App() {
  const location = useLocation()

  // Scroll to top on page change (unless jumping to an #anchor).
  useEffect(() => {
    if (location.hash) {
      document.getElementById(location.hash.slice(1))?.scrollIntoView()
    } else {
      window.scrollTo(0, 0)
    }
  }, [location.pathname, location.hash])

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-ink focus:px-4 focus:py-2 focus:text-bg">
        Skip to content
      </a>
      <NavBar />
      <main id="main" className="flex-1">
        <ErrorBoundary key={location.pathname}>
          <Suspense fallback={<LoadingState label="Loading" />}>
            {/* key = pathname replays the enter animation on each page change */}
            <div key={location.pathname} className="animate-fade">
              <Routes location={location}>
                <Route path="/" element={<Home />} />
                <Route path="/experiment" element={<Experiment />} />
                <Route path="/results" element={<Results />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/experiments" element={<ExperimentsLibrary />} />
                <Route path="/experiments/:slug" element={<ExperimentDetail />} />
                <Route path="/about" element={<About />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  )
}
