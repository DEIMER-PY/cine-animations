import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import { TextScramble } from './animations';

const Particle = ({ delay }) => {
  const size = Math.random() * 3 + 1;
  const left = Math.random() * 100;
  const duration = Math.random() * 8 + 6;

  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        left: `${left}%`,
        bottom: '-10%',
        background: `radial-gradient(circle, rgba(229,9,20,${0.3 + Math.random() * 0.4}), transparent)`,
      }}
      animate={{
        y: [0, -600 - Math.random() * 400],
        x: [0, (Math.random() - 0.5) * 200],
        opacity: [0, 0.8, 0],
        scale: [0, 1, 0.3],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeOut',
      }}
    />
  );
};

const Particles = () => {
  const particles = useRef(
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      delay: Math.random() * 6,
    }))
  ).current;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <Particle key={p.id} delay={p.delay} />
      ))}
    </div>
  );
};

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const GithubIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

const inputVariants = {
  focus: {
    borderColor: 'rgba(229,9,20,0.6)',
    boxShadow: '0 0 0 1px rgba(229,9,20,0.3), 0 0 20px rgba(229,9,20,0.15)',
  },
  blur: {
    borderColor: 'rgba(255,255,255,0.08)',
    boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 0 0 rgba(229,9,20,0)',
  },
};

const formSlideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.95,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
    scale: 0.95,
  }),
};

export default function AuthModal({ isOpen, onClose }) {
  const [mode, setMode] = useState('login');
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });

  const setUser = useStore((s) => s.setUser);

  useEffect(() => {
    if (!isOpen) {
      setForm({ name: '', email: '', password: '' });
      setError('');
      setLoading(false);
    }
  }, [isOpen]);

  const toggleMode = useCallback(() => {
    setDirection(mode === 'login' ? 1 : -1);
    setMode((m) => (m === 'login' ? 'register' : 'login'));
    setError('');
  }, [mode]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'register' && !form.name.trim()) {
      setError('Name is required');
      return;
    }
    if (!form.email.trim()) {
      setError('Email is required');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(form.email)) {
      setError('Invalid email address');
      return;
    }
    if (!form.password) {
      setError('Password is required');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));

    setUser({
      id: crypto.randomUUID?.() || String(Date.now()),
      name: mode === 'register' ? form.name : form.email.split('@')[0],
      email: form.email,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(form.name || form.email)}&background=e50914&color=fff&bold=true`,
    });

    setLoading(false);
    onClose();
  };

  const handleSocialAuth = async (provider) => {
    setLoading(true);
    setError('');
    await new Promise((r) => setTimeout(r, 1000));

    setUser({
      id: crypto.randomUUID?.() || String(Date.now()),
      name: `${provider} User`,
      email: `user@${provider.toLowerCase()}.com`,
      avatar: `https://ui-avatars.com/api/?name=${provider}&background=e50914&color=fff&bold=true`,
    });

    setLoading(false);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            className="relative w-full max-w-[440px] overflow-hidden rounded-2xl"
            style={{
              background: 'linear-gradient(145deg, rgba(17,17,17,0.95), rgba(10,10,10,0.98))',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow:
                '0 0 80px rgba(229,9,20,0.08), 0 25px 50px rgba(0,0,0,0.5)',
            }}
            initial={{ scale: 0.9, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 30, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <Particles />

            <div className="relative z-10 p-8 md:p-10">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/5 transition-all duration-200"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>

              <div className="text-center mb-8">
                <motion.div
                  className="inline-block mb-4"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cinema-accent/20 to-cinema-accent/5 border border-cinema-accent/20 flex items-center justify-center mx-auto">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e50914" strokeWidth="1.5">
                      <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
                      <polyline points="10 17 15 12 10 7" />
                      <line x1="15" y1="12" x2="3" y2="12" />
                    </svg>
                  </div>
                </motion.div>

                <h2 className="font-display text-3xl tracking-wider text-white mb-2">
                  <TextScramble text={mode === 'login' ? 'WELCOME BACK' : 'JOIN THE CINEMA'} delay={0.4} duration={0.9} />
                </h2>
                <p className="font-mono text-[11px] text-white/30 tracking-wider">
                  {mode === 'login'
                    ? 'Sign in to access your collection'
                    : 'Create an account to begin'}
                </p>
              </div>

              <div className="flex gap-2 mb-6 p-1 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                {['login', 'register'].map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      if (m !== mode) toggleMode();
                    }}
                    className="relative flex-1 py-2.5 rounded-lg font-mono text-xs tracking-[0.15em] transition-colors duration-200"
                    style={{
                      color: mode === m ? 'white' : 'rgba(255,255,255,0.3)',
                    }}
                  >
                    {mode === m && (
                      <motion.div
                        layoutId="authTab"
                        className="absolute inset-0 rounded-lg"
                        style={{
                          background: 'rgba(229,9,20,0.15)',
                          border: '1px solid rgba(229,9,20,0.2)',
                        }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                      />
                    )}
                    <span className="relative z-10">
                      {m === 'login' ? 'SIGN IN' : 'SIGN UP'}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => handleSocialAuth('Google')}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:brightness-110 disabled:opacity-50"
                  style={{ background: '#DB4437', color: 'white' }}
                >
                  <GoogleIcon />
                  <span className="text-xs tracking-wide">Google</span>
                </button>
                <button
                  onClick={() => handleSocialAuth('Facebook')}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:brightness-110 disabled:opacity-50"
                  style={{ background: '#4267B2', color: 'white' }}
                >
                  <FacebookIcon />
                  <span className="text-xs tracking-wide">Facebook</span>
                </button>
                <button
                  onClick={() => handleSocialAuth('GitHub')}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:brightness-110 disabled:opacity-50"
                  style={{ background: '#333', color: 'white' }}
                >
                  <GithubIcon />
                  <span className="text-xs tracking-wide">GitHub</span>
                </button>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="font-mono text-[10px] text-white/20 tracking-widest">OR</span>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div style={{ position: 'relative', overflow: 'hidden' }}>
                  <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                      key={mode}
                      custom={direction}
                      variants={formSlideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                      className="space-y-4"
                    >
                      {mode === 'register' && (
                        <div>
                          <label className="block font-mono text-[10px] text-white/40 tracking-widest mb-2">
                            FULL NAME
                          </label>
                          <motion.input
                            name="name"
                            type="text"
                            value={form.name}
                            onChange={handleChange}
                            onFocus={() => setFocusedField('name')}
                            onBlur={() => setFocusedField(null)}
                            placeholder="Enter your name"
                            className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm font-body placeholder:text-white/20 outline-none transition-all duration-300"
                            animate={focusedField === 'name' ? 'focus' : 'blur'}
                            variants={inputVariants}
                          />
                        </div>
                      )}

                      <div>
                        <label className="block font-mono text-[10px] text-white/40 tracking-widest mb-2">
                          EMAIL
                        </label>
                        <motion.input
                          name="email"
                          type="email"
                          value={form.email}
                          onChange={handleChange}
                          onFocus={() => setFocusedField('email')}
                          onBlur={() => setFocusedField(null)}
                          placeholder="you@example.com"
                          className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm font-body placeholder:text-white/20 outline-none transition-all duration-300"
                          animate={focusedField === 'email' ? 'focus' : 'blur'}
                          variants={inputVariants}
                        />
                      </div>

                      <div>
                        <label className="block font-mono text-[10px] text-white/40 tracking-widest mb-2">
                          PASSWORD
                        </label>
                        <motion.input
                          name="password"
                          type="password"
                          value={form.password}
                          onChange={handleChange}
                          onFocus={() => setFocusedField('password')}
                          onBlur={() => setFocusedField(null)}
                          placeholder="Min 6 characters"
                          className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm font-body placeholder:text-white/20 outline-none transition-all duration-300"
                          animate={focusedField === 'password' ? 'focus' : 'blur'}
                          variants={inputVariants}
                        />
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -8, height: 0 }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cinema-accent/10 border border-cinema-accent/20"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e50914" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span className="text-xs text-cinema-accent font-mono">{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  type="submit"
                  disabled={loading}
                  className="relative w-full py-3.5 rounded-xl font-mono text-xs tracking-[0.2em] text-white overflow-hidden transition-all duration-300 disabled:cursor-not-allowed"
                  style={{
                    background: loading
                      ? 'rgba(229,9,20,0.3)'
                      : 'linear-gradient(135deg, #e50914, #b00710)',
                  }}
                  whileHover={!loading ? { scale: 1.01, y: -1 } : {}}
                  whileTap={!loading ? { scale: 0.99 } : {}}
                >
                  {loading && (
                    <motion.div
                      className="absolute inset-0"
                      style={{
                        background:
                          'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                      }}
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    />
                  )}
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <motion.svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                          <path d="M21 12a9 9 0 11-6.219-8.56" />
                        </motion.svg>
                        AUTHENTICATING...
                      </>
                    ) : mode === 'login' ? (
                      'SIGN IN'
                    ) : (
                      'CREATE ACCOUNT'
                    )}
                  </span>
                </motion.button>
              </form>

              <p className="text-center mt-6 font-mono text-[11px] text-white/25 tracking-wide">
                {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
                <button
                  onClick={toggleMode}
                  className="text-cinema-accent hover:text-cinema-accent/80 transition-colors"
                >
                  {mode === 'login' ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
