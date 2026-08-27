import { useState, useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { Mail, ArrowUp, Film, Star, Heart, Play, Globe, Shield } from 'lucide-react';

const quickLinks = [
  { label: 'Home', href: '#' },
  { label: 'Catalog', href: '#catalog' },
  { label: 'Collection', href: '#collection' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
];

const categories = [
  { label: 'Action', href: '#action' },
  { label: 'Drama', href: '#drama' },
  { label: 'Sci-Fi', href: '#sci-fi' },
  { label: 'Horror', href: '#horror' },
  { label: 'Comedy', href: '#comedy' },
  { label: 'Documentary', href: '#documentary' },
];

const legalLinks = [
  { label: 'Terms', href: '#terms' },
  { label: 'Privacy Policy', href: '#privacy' },
  { label: 'Cookie Policy', href: '#cookies' },
  { label: 'DMCA', href: '#dmca' },
];

const socialLinks = [
  {
    label: 'Instagram',
    href: '#instagram',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    ),
  },
  {
    label: 'Twitter/X',
    href: '#twitter',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: 'YouTube',
    href: '#youtube',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.13C5.12 19.56 12 19.56 12 19.56s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.43z" />
        <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: 'TikTok',
    href: '#tiktok',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.88-2.89 2.89 2.89 0 0 1 2.88-2.89c.28 0 .54.04.79.11V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.18 8.18 0 0 0 3.77.93V6.23a4.84 4.84 0 0 1-3.78.46z" />
      </svg>
    ),
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const columnVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer ref={ref} className="relative mt-24">
      <div className="scan-line-top" />

      <div className="relative overflow-hidden bg-gradient-to-b from-black/95 via-[#0a0a0f]/98 to-black/95 backdrop-blur-xl border-t border-white/[0.04]">
        <div className="absolute inset-0 bg-gradient-to-r from-red-600/[0.02] via-transparent to-red-600/[0.02] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8"
          >
            <motion.div variants={columnVariants} className="lg:col-span-4">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-lg shadow-red-600/20">
                  <Film className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-2xl font-black tracking-[0.15em] text-white relative">
                  <span className="relative z-10">CINE</span>
                  <span className="absolute inset-0 text-red-500 blur-md opacity-50 z-0">CINE</span>
                </h3>
              </div>
              <p className="text-xs font-medium tracking-[0.3em] uppercase text-red-400/80 mb-4">
                Premium Cinema Experience
              </p>
              <p className="text-sm text-white/40 leading-relaxed max-w-xs">
                Curating the finest cinematic moments. From timeless classics to modern masterpieces — your definitive destination for premium film experiences.
              </p>
            </motion.div>

            <motion.div variants={columnVariants} className="lg:col-span-2">
              <h4 className="text-xs font-bold tracking-[0.2em] uppercase text-white/70 mb-5 flex items-center gap-2">
                <Play className="w-3.5 h-3.5 text-red-500" />
                Quick Links
              </h4>
              <ul className="space-y-3">
                {quickLinks.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-white/40 hover:text-red-400 transition-colors duration-300 hover:translate-x-1 inline-block"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div variants={columnVariants} className="lg:col-span-2">
              <h4 className="text-xs font-bold tracking-[0.2em] uppercase text-white/70 mb-5 flex items-center gap-2">
                <Star className="w-3.5 h-3.5 text-red-500" />
                Categories
              </h4>
              <ul className="space-y-3">
                {categories.map((cat) => (
                  <li key={cat.label}>
                    <a
                      href={cat.href}
                      className="text-sm text-white/40 hover:text-red-400 transition-colors duration-300 hover:translate-x-1 inline-block"
                    >
                      {cat.label}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div variants={columnVariants} className="lg:col-span-2">
              <h4 className="text-xs font-bold tracking-[0.2em] uppercase text-white/70 mb-5 flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-red-500" />
                Legal
              </h4>
              <ul className="space-y-3">
                {legalLinks.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-white/40 hover:text-red-400 transition-colors duration-300 hover:translate-x-1 inline-block"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div variants={columnVariants} className="lg:col-span-2">
              <h4 className="text-xs font-bold tracking-[0.2em] uppercase text-white/70 mb-5 flex items-center gap-2">
                <Heart className="w-3.5 h-3.5 text-red-500" />
                Social
              </h4>
              <div className="flex flex-wrap gap-3 mb-8">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="w-10 h-10 rounded-lg border border-white/[0.06] bg-white/[0.03] flex items-center justify-center text-white/40 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/[0.06] transition-all duration-300"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>

              <h4 className="text-xs font-bold tracking-[0.2em] uppercase text-white/70 mb-3 flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-red-500" />
                Language
              </h4>
              <div className="relative">
                <select className="w-full appearance-none bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white/60 cursor-pointer hover:border-red-500/30 transition-colors duration-300 outline-none focus:border-red-500/50">
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="ja">日本語</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/30">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-14 max-w-md mx-auto text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Mail className="w-4 h-4 text-red-500" />
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-white/70">
                Newsletter
              </span>
            </div>
            <p className="text-sm text-white/30 mb-4">
              Get exclusive updates on new releases and curated picks.
            </p>
            {subscribed ? (
              <div className="flex items-center justify-center gap-2 py-3 text-red-400">
                <Heart className="w-4 h-4 fill-red-400" />
                <span className="text-sm font-medium">Welcome to the crew.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-red-500/40 focus:bg-white/[0.06] transition-all duration-300"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-sm font-semibold rounded-lg transition-all duration-300 shadow-lg shadow-red-600/20 hover:shadow-red-600/40 active:scale-95"
                >
                  Subscribe
                </button>
              </form>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-12 pt-6 border-t border-white/[0.04]"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-white/25">
                &copy; 2026 CINE. All rights reserved.
              </p>
              <p className="text-xs text-white/25 flex items-center gap-1">
                Powered by{' '}
                <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-red-400 transition-colors duration-300">
                  TMDB API
                </a>
              </p>
            </div>
          </motion.div>
        </div>

        <button
          onClick={scrollToTop}
          aria-label="Back to top"
          className="fixed bottom-8 right-8 z-50 w-11 h-11 rounded-full bg-white/[0.06] border border-white/[0.08] backdrop-blur-md flex items-center justify-center text-white/40 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/[0.08] transition-all duration-300 shadow-lg shadow-black/40"
        >
          <ArrowUp className="w-4 h-4" />
        </button>

        <style>{`
          .scan-line-top {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(
              90deg,
              transparent,
              rgba(239, 68, 68, 0.0) 10%,
              rgba(239, 68, 68, 0.6) 50%,
              rgba(239, 68, 68, 0.0) 90%,
              transparent
            );
            animation: scanLine 6s ease-in-out infinite;
            pointer-events: none;
          }
          @keyframes scanLine {
            0%, 100% { opacity: 0.3; transform: scaleX(0.6); }
            50% { opacity: 1; transform: scaleX(1); }
          }
        `}</style>
      </div>
    </footer>
  );
}
