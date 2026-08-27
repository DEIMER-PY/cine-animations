import { useState, useEffect } from 'react';
import Preloader from './components/Preloader';
import CustomCursor from './components/CustomCursor';
import Navigation from './components/Navigation';
import HeroSection from './components/HeroSection';
import SynopsisSection from './components/SynopsisSection';
import TrendingSection from './components/TrendingSection';
import VideoGallery from './components/VideoGallery';
import MovieFrames from './components/MovieFrames';
import CinematicCanvas from './components/CinematicCanvas';
import CastSection from './components/CastSection';
import FavoritesGrid from './components/FavoritesGrid';
import MovieDetail from './components/MovieDetail';
import TrailerModal from './components/TrailerModal';
import AuthModal from './components/AuthModal';
import Footer from './components/Footer';
import { useStore } from './store/useStore';

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [assetsReady, setAssetsReady] = useState(false);
  const selectedMovie = useStore((s) => s.selectedMovie);
  const currentSection = useStore((s) => s.currentSection);
  const showAuthModal = useStore((s) => s.showAuthModal);
  const setShowAuthModal = useStore((s) => s.setShowAuthModal);
  const showTrailerModal = useStore((s) => s.showTrailerModal);
  const trailerMovie = useStore((s) => s.trailerMovie);
  const loadFavorites = useStore((s) => s.loadFavorites);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 100);
    loadFavorites();
    return () => clearTimeout(timer);
  }, []);

  if (!loaded) {
    return <Preloader onReady={() => setAssetsReady(true)} />;
  }

  return (
    <div className="relative min-h-screen bg-cinema-black noise-overlay">
      <div className="scan-line" />
      <div className="cinematic-vignette" />
      <CustomCursor />
      <Navigation />

      <main>
        {currentSection === 'home' && (
          <>
            <HeroSection />
            <SynopsisSection />
            <TrendingSection />
            <CastSection />
            <VideoGallery />
            <MovieFrames />
          </>
        )}

        {currentSection === 'catalog' && (
          <section className="relative z-10 min-h-screen pt-24 px-4 md:px-8 lg:px-16">
            <div className="max-w-[1600px] mx-auto">
              <h2 className="font-display text-6xl md:text-8xl text-glow-accent mb-12 tracking-wider">
                THE CINEMATIC CANVAS
              </h2>
              <CinematicCanvas />
              <div className="mt-16">
                <TrendingSection />
              </div>
              <div className="mt-16">
                <VideoGallery />
              </div>
            </div>
          </section>
        )}

        {currentSection === 'cast' && (
          <section className="relative z-10 min-h-screen pt-24 px-4 md:px-8 lg:px-16 pb-32">
            <div className="max-w-[1600px] mx-auto">
              <CastSection />
            </div>
          </section>
        )}

        {currentSection === 'collection' && (
          <section className="relative z-10 min-h-screen pt-24 px-4 md:px-8 lg:px-16 pb-32">
            <div className="max-w-[1600px] mx-auto">
              <h2 className="font-display text-6xl md:text-8xl text-glow-gold mb-12 tracking-wider">
                YOUR COLLECTION
              </h2>
              <FavoritesGrid />
            </div>
          </section>
        )}
      </main>

      <Footer />

      {selectedMovie && <MovieDetail />}
      {showTrailerModal && trailerMovie && (
        <TrailerModal
          isOpen={showTrailerModal}
          onClose={() => useStore.getState().closeTrailer()}
          movieId={trailerMovie.id}
          movieTitle={trailerMovie.title}
          movieBackdropPath={trailerMovie.backdrop_path}
        />
      )}
      {showAuthModal && (
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      )}
    </div>
  );
}
