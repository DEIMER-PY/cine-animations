import { lazy, Suspense, useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Navigation from './components/Navigation';
import ScrollProgress from './components/ScrollProgress';
import TrailerModal from './components/TrailerModal';
import SmoothScroll from './components/SmoothScroll';
import MotionDirector from './components/MotionDirector';
import ProjectionLoader from './components/ProjectionLoader';
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
const SeriesPage = lazy(() => import('./pages/SeriesPage'));
const SeriesDetailPage = lazy(() => import('./pages/SeriesDetailPage'));
const PeoplePage = lazy(() => import('./pages/PeoplePage'));

function RouteStage({ children }) {
  const reduced = useReducedMotion();
  return <motion.div initial={reduced ? false : { opacity: 0, y: 18, rotateX: -3 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} exit={{ opacity: 0, y: reduced ? 0 : -12 }} transition={{ duration: reduced ? 0 : .45, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.div>;
}

export default function App() {
  const location = useLocation();
  const initializeApp = useStore((state) => state.initializeApp);
  const showTrailerModal = useStore((state) => state.showTrailerModal);
  const trailerMovie = useStore((state) => state.trailerMovie);
  const trailerOrigin = useStore((state) => state.trailerOrigin);
  const trailerMediaType = useStore((state) => state.trailerMediaType);
  const collectionError = useStore((state) => state.collectionError);

  useEffect(() => { initializeApp(); }, [initializeApp]);
  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);

  const focusedFlow = location.pathname.includes('/asientos') || location.pathname.startsWith('/checkout') || location.pathname.startsWith('/acceso');
  const immersive = !focusedFlow;
  return (
    <div className="min-h-screen bg-cinema-black text-white">
      {!focusedFlow && <ScrollProgress />}<SmoothScroll enabled={immersive} />{!focusedFlow && <Navigation />}
      <MotionDirector />
      {collectionError && <div className="collection-toast" role="status">{collectionError}<button onClick={() => useStore.setState({ collectionError: '' })} aria-label="Cerrar aviso">×</button></div>}
      <main>
        <AnimatePresence mode="wait" initial={false}>
          <RouteStage key={location.pathname}>
            <Suspense fallback={<ProjectionLoader label="PREPARANDO LA SALA" full />}>
              <Routes location={location}>
                <Route path="/" element={<HomePage />} />
                <Route path="/cartelera" element={<ShowtimesPage />} />
                <Route path="/pelicula/:id" element={<MoviePage />} />
                <Route path="/persona/:id" element={<PersonPage />} />
                <Route path="/personas" element={<PeoplePage />} />
                <Route path="/series" element={<SeriesPage />} />
                <Route path="/serie/:id" element={<SeriesDetailPage />} />
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
      {showTrailerModal && trailerMovie && <TrailerModal isOpen onClose={() => useStore.getState().closeTrailer()} isDemo={Boolean(trailerMovie.demo)} movieId={trailerMovie.id} movieTitle={trailerMovie.title || trailerMovie.name} movieBackdropPath={trailerMovie.backdrop_path} originRect={trailerOrigin} mediaType={trailerMediaType} />}
    </div>
  );
}
