import { lazy, Suspense, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Navigation from './components/Navigation';
import CustomCursor from './components/CustomCursor';
import ScrollProgress from './components/ScrollProgress';
import TrailerModal from './components/TrailerModal';
import SmoothScroll from './components/SmoothScroll';
import HomePage from './pages/HomePage';
import ShowtimesPage from './pages/ShowtimesPage';
import MoviePage from './pages/MoviePage';
import SeatSelectionPage from './pages/SeatSelectionPage';
import CheckoutPage from './pages/CheckoutPage';
import AccountPage from './pages/AccountPage';
import AuthPage from './pages/AuthPage';
import PersonPage from './pages/PersonPage';
import { useStore } from './store/useStore';

const ExperiencesPage = lazy(() => import('./pages/ExperiencesPage'));

function RouteStage({ children }) {
  return <motion.div initial={{ opacity: 0, y: 18, clipPath: 'inset(0 0 8% 0)' }} animate={{ opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)' }} exit={{ opacity: 0, y: -12 }} transition={{ duration: .55, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.div>;
}

export default function App() {
  const location = useLocation();
  const initializeApp = useStore((state) => state.initializeApp);
  const showTrailerModal = useStore((state) => state.showTrailerModal);
  const trailerMovie = useStore((state) => state.trailerMovie);

  useEffect(() => { initializeApp(); }, [initializeApp]);
  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);

  const focusedFlow = location.pathname.includes('/asientos') || location.pathname.startsWith('/checkout') || location.pathname.startsWith('/acceso');
  const immersive = !focusedFlow;
  return (
    <div className="min-h-screen bg-cinema-black text-white noise-overlay">
      <div className="scan-line" /><div className="cinematic-vignette" />
      <CustomCursor />{!focusedFlow && <ScrollProgress />}<SmoothScroll enabled={immersive} />{!focusedFlow && <Navigation />}
      <main>
        <AnimatePresence mode="wait" initial={false}>
          <RouteStage key={location.pathname}>
            <Suspense fallback={<div className="grid min-h-screen place-items-center font-mono text-xs tracking-[.3em] text-white/35">PREPARANDO LA SALA</div>}>
              <Routes location={location}>
                <Route path="/" element={<HomePage />} />
                <Route path="/cartelera" element={<ShowtimesPage />} />
                <Route path="/pelicula/:id" element={<MoviePage />} />
                <Route path="/persona/:id" element={<PersonPage />} />
                <Route path="/funcion/:id/asientos" element={<SeatSelectionPage />} />
                <Route path="/checkout/:holdId" element={<CheckoutPage />} />
                <Route path="/experiencias" element={<ExperiencesPage />} />
                <Route path="/cuenta" element={<AccountPage />} />
                <Route path="/acceso" element={<AuthPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </RouteStage>
        </AnimatePresence>
      </main>
      {showTrailerModal && trailerMovie && <TrailerModal isOpen onClose={() => useStore.getState().closeTrailer()} movieId={trailerMovie.id} movieTitle={trailerMovie.title} movieBackdropPath={trailerMovie.backdrop_path} />}
    </div>
  );
}
