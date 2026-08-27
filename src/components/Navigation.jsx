import { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Heart,
  Film,
  Home,
  Star,
  Menu,
  X,
  LogIn,
  LogOut,
} from 'lucide-react';

const navItems = [
  { id: 'home', label: 'HOME', icon: Home, description: 'Featured films, trailers, and cinematic experiences' },
  { id: 'catalog', label: 'CATALOG', icon: Film, description: 'Browse our complete library of premium cinema' },
  { id: 'cast', label: 'ENSEMBLE', icon: Star, description: 'Meet the talented cast and crew behind the films' },
  { id: 'collection', label: 'COLLECTION', icon: Heart, description: 'Your personal curated favorites' },
];

export default function Navigation() {
  const {
    currentSection,
    setSection,
    favorites,
    user,
    signOut,
    setShowAuthModal,
  } = useStore();

  const [scrolled, setScrolled] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const searchInputRef = useRef(null);
  const dropdownTimeoutRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === '/' && !searchOpen && !mobileOpen) {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setMobileOpen(false);
        setUserMenuOpen(false);
        setHoveredItem(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [searchOpen, mobileOpen]);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleNavHoverEnter = useCallback((id) => {
    clearTimeout(dropdownTimeoutRef.current);
    setHoveredItem(id);
  }, []);

  const handleNavHoverLeave = useCallback(() => {
    dropdownTimeoutRef.current = setTimeout(() => setHoveredItem(null), 150);
  }, []);

  const handleNavClick = useCallback((id) => {
    setSection(id);
    setHoveredItem(null);
    setMobileOpen(false);
  }, [setSection]);

  const toggleSearch = useCallback(() => {
    setSearchOpen((prev) => {
      if (prev) setSearchQuery('');
      return !prev;
    });
  }, []);

  const handleLogout = useCallback(async () => {
    await signOut();
    setUserMenuOpen(false);
  }, [signOut]);

  return (
    <>
      <motion.nav
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-[200] transition-all duration-300 ${
          scrolled
            ? 'bg-cinema-black/70 backdrop-blur-xl border-b border-white/5'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className={`flex items-center justify-between transition-all duration-300 ${scrolled ? 'h-14' : 'h-16'}`}>
            {/* Left - Menu */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Menu size={20} />
              </button>

              <div className="hidden lg:flex items-center gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentSection === item.id;
                  return (
                    <div
                      key={item.id}
                      className="relative"
                      onMouseEnter={() => handleNavHoverEnter(item.id)}
                      onMouseLeave={handleNavHoverLeave}
                    >
                      <button
                        onClick={() => handleNavClick(item.id)}
                        className={`relative flex items-center gap-2 px-3 py-2 rounded-lg font-mono text-xs tracking-[0.2em] transition-all duration-300 ${
                          isActive
                            ? 'text-cinema-accent'
                            : 'text-white/50 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Icon size={14} />
                        <span>{item.label}</span>
                        {isActive && (
                          <motion.div
                            layoutId="activeNav"
                            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-cinema-accent shadow-[0_0_8px_rgba(255,0,60,0.8)]"
                            transition={{ type: 'spring', stiffness:380, damping:30 }}
                          />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Center - Logo */}
            <button
              onClick={() => handleNavClick('home')}
              className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center group"
            >
              <span className="font-display text-xl sm:text-2xl font-bold tracking-[0.15em] text-glow-accent text-cinema-accent">
                CINE
              </span>
              <span className="hidden sm:block font-mono text-[8px] tracking-[0.4em] text-white/30 uppercase -mt-0.5">
                ANIMATIONS
              </span>
            </button>

            {/* Right - Actions */}
            <div className="flex items-center gap-1">
              {/* Search */}
              <div className="relative flex items-center">
                <AnimatePresence>
                  {searchOpen && (
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 220, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute right-0 overflow-hidden"
                    >
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search films..."
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 font-mono text-xs text-white placeholder-white/30 focus:outline-none focus:border-cinema-accent/50"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
                <button
                  onClick={toggleSearch}
                  className={`p-2 rounded-lg transition-all duration-300 ${
                    searchOpen
                      ? 'text-cinema-accent'
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Search size={18} />
                </button>
              </div>

              {/* Favorites */}
              <button
                onClick={() => handleNavClick('collection')}
                className="relative p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Heart size={18} className={favorites.length > 0 ? 'fill-cinema-accent/30 text-cinema-accent' : ''} />
                {favorites.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center rounded-full bg-cinema-accent text-[8px] font-mono font-bold text-white">
                    {favorites.length}
                  </span>
                )}
              </button>

              {/* User */}
              <div className="relative">
                {user ? (
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-cinema-accent/20 border border-cinema-accent/30 flex items-center justify-center">
                      <span className="font-mono text-xs text-cinema-accent font-bold">
                        {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                      </span>
                    </div>
                  </button>
                ) : (
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="flex items-center gap-1.5 p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <LogIn size={18} />
                  </button>
                )}

                <AnimatePresence>
                  {userMenuOpen && user && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-cinema-black/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-white/5">
                        <p className="font-mono text-xs text-white/90 truncate">{user.name || user.email}</p>
                      </div>
                      <div className="py-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-4 py-2 text-xs font-mono text-red-400/70 hover:text-red-400 hover:bg-red-400/5 transition-colors"
                        >
                          <LogOut size={14} />
                          <span>Logout</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Hover Dropdowns */}
        <AnimatePresence>
          {hoveredItem && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="absolute top-full left-0 right-0 pointer-events-none"
              onMouseEnter={() => handleNavHoverEnter(hoveredItem)}
              onMouseLeave={handleNavHoverLeave}
            >
              <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pointer-events-auto">
                <div className="glass-panel-tight max-w-md rounded-xl border border-white/10 p-4 mt-2">
                  {hoveredItem === 'collection' ? (
                    <div>
                      <p className="font-mono text-[10px] tracking-[0.2em] text-white/40 mb-3">YOUR FAVORITES</p>
                      {favorites.length > 0 ? (
                        <div className="flex gap-3">
                          {favorites.slice(0, 3).map((fav, i) => (
                            <div key={i} className="w-16 h-24 rounded-lg bg-white/5 border border-white/10 overflow-hidden flex-shrink-0">
                              {fav.poster_path ? (
                                <img src={`https://image.tmdb.org/t/p/w92${fav.poster_path}`} alt={fav.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Film size={20} className="text-white/20" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="font-mono text-xs text-white/30">No favorites yet</p>
                      )}
                    </div>
                  ) : (
                    <p className="font-mono text-xs text-white/50 leading-relaxed">
                      {navItems.find(n => n.id === hoveredItem)?.description}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[250] bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 left-0 w-72 z-[251] bg-cinema-black/95 backdrop-blur-xl border-r border-white/5"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/5">
                <span className="font-display text-lg font-bold tracking-[0.15em] text-cinema-accent">CINE</span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 space-y-1">
                {navItems.map((item, i) => {
                  const Icon = item.icon;
                  const isActive = currentSection === item.id;
                  return (
                    <motion.button
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg font-mono text-sm tracking-[0.15em] transition-colors ${
                        isActive
                          ? 'text-cinema-accent bg-cinema-accent/10 border border-cinema-accent/20'
                          : 'text-white/50 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                      {isActive && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cinema-accent shadow-[0_0_8px_rgba(255,0,60,0.8)]" />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {!user && (
                <div className="p-4 border-t border-white/5 mt-4">
                  <button
                    onClick={() => { setMobileOpen(false); setShowAuthModal(true); }}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-cinema-accent/10 border border-cinema-accent/20 text-cinema-accent font-mono text-xs tracking-[0.15em] hover:bg-cinema-accent/20 transition-colors"
                  >
                    <LogIn size={16} />
                    <span>SIGN IN</span>
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 z-[190] md:hidden bg-cinema-black/80 backdrop-blur-xl border-t border-white/5 safe-area-inset-bottom">
        <div className="flex items-center justify-around h-14 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex flex-col items-center gap-0.5 p-2 rounded-lg transition-colors ${
                  isActive ? 'text-cinema-accent' : 'text-white/40'
                }`}
              >
                <Icon size={20} />
                <span className="font-mono text-[9px] tracking-[0.15em]">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="mobileActiveNav"
                    className="w-1 h-1 rounded-full bg-cinema-accent shadow-[0_0_6px_rgba(255,0,60,0.8)]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
