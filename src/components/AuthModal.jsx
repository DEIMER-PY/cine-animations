import { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Check, Eye, EyeOff, KeyRound, LoaderCircle, Mail, UserRound, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { TextScramble } from './animations';

const copy = {
  login: ['WELCOME BACK', 'Entra a tu archivo personal de cine.'],
  register: ['JOIN THE ARCHIVE', 'Construye una colección que viaje contigo.'],
  reset: ['RECOVER ACCESS', 'Te enviaremos un enlace seguro para volver.'],
  update: ['NEW PASSWORD', 'Crea una nueva clave para tu cuenta.'],
};

const fieldClass = 'w-full rounded-xl border border-white/10 bg-white/[0.045] py-3.5 pl-11 pr-4 text-sm text-white outline-none transition focus:border-cinema-accent/60 focus:ring-2 focus:ring-cinema-accent/15 placeholder:text-white/20';

export default function AuthModal({ isOpen, onClose }) {
  const titleId = useId();
  const panelRef = useRef(null);
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ displayName: '', email: '', password: '', confirmation: '' });
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const { signIn, signUp, requestPasswordReset, updatePassword } = useStore();

  useEffect(() => {
    if (!isOpen) return undefined;
    const params = new window.URLSearchParams(window.location.hash.slice(1));
    if (params.get('type') === 'recovery') setMode('update');
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Tab' && panelRef.current) {
        const focusable = [...panelRef.current.querySelectorAll('button,input')].filter((node) => !node.disabled);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    window.setTimeout(() => panelRef.current?.querySelector('input')?.focus(), 50);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    setMessage(null);
  }, [mode]);

  const change = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setMessage(null);
  };

  const validate = () => {
    if (mode === 'register' && form.displayName.trim().length < 2) return 'Escribe un nombre de al menos 2 caracteres.';
    if (mode !== 'update' && !/^\S+@\S+\.\S+$/.test(form.email)) return 'Escribe un correo válido.';
    if (mode === 'reset') return null;
    if (form.password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
    if ((mode === 'register' || mode === 'update') && form.password !== form.confirmation) return 'Las contraseñas no coinciden.';
    return null;
  };

  const submit = async (event) => {
    event.preventDefault();
    const validation = validate();
    if (validation) {
      setMessage({ type: 'error', text: validation });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      if (mode === 'login') {
        await signIn({ email: form.email, password: form.password });
        onClose();
      } else if (mode === 'register') {
        const result = await signUp({ email: form.email, password: form.password, displayName: form.displayName.trim() });
        if (result.session) onClose();
        else setMessage({ type: 'success', text: 'Revisa tu correo para confirmar la cuenta.' });
      } else if (mode === 'reset') {
        await requestPasswordReset(form.email);
        setMessage({ type: 'success', text: 'Enlace enviado. Revisa tu bandeja de entrada.' });
      } else {
        await updatePassword(form.password);
        setMessage({ type: 'success', text: 'Contraseña actualizada. Ya puedes volver al cine.' });
        window.setTimeout(onClose, 900);
      }
    } catch (error) {
      const fallback = 'No fue posible completar la solicitud. Inténtalo de nuevo.';
      setMessage({ type: 'error', text: error?.message || fallback });
    } finally {
      setLoading(false);
    }
  };

  const needsEmail = mode !== 'update';
  const needsPassword = mode !== 'reset';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="fixed inset-0 z-[1000] grid place-items-center overflow-y-auto p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button className="absolute inset-0 cursor-default bg-black/80 backdrop-blur-md" onClick={onClose} aria-label="Cerrar autenticación" />
          <motion.section
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative my-auto grid w-full max-w-4xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#090909] shadow-[0_45px_120px_rgba(0,0,0,.8)] md:grid-cols-[1.08fr_.92fr]"
            data-lenis-prevent
            initial={{ opacity: 0, scale: 0.94, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ type: 'spring', damping: 26, stiffness: 260 }}
          >
            <div className="relative hidden min-h-[610px] overflow-hidden md:block">
              <img src="https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1400&q=85" alt="Proyector cinematográfico iluminando una sala" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-cinema-accent/10" />
              <div className="absolute inset-x-8 bottom-9">
                <p className="font-mono text-[10px] tracking-[.35em] text-cinema-gold">PRIVATE SCREENING · 01</p>
                <p className="mt-4 max-w-sm font-display text-5xl leading-[.88] tracking-wide text-white">YOUR FILMS.<br />YOUR MEMORY.</p>
              </div>
            </div>

            <div className="relative flex min-h-[610px] flex-col justify-center p-7 sm:p-10">
              <button onClick={onClose} className="absolute right-5 top-5 rounded-full border border-white/10 p-2 text-white/40 transition hover:border-white/30 hover:text-white" aria-label="Cerrar">
                <X size={17} />
              </button>
              {(mode === 'reset' || mode === 'update') && (
                <button onClick={() => setMode('login')} className="absolute left-7 top-7 flex items-center gap-2 font-mono text-[10px] tracking-[.18em] text-white/40 transition hover:text-white">
                  <ArrowLeft size={14} /> VOLVER
                </button>
              )}

              <div className="mb-8">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-cinema-accent/30 bg-cinema-accent/10 text-cinema-accent">
                  <KeyRound size={22} />
                </div>
                <h2 id={titleId} className="font-display text-4xl tracking-[.06em] text-white">
                  <TextScramble text={copy[mode][0]} duration={0.65} />
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-white/40">{copy[mode][1]}</p>
              </div>

              {(mode === 'login' || mode === 'register') && (
                <div className="mb-6 grid grid-cols-2 rounded-xl border border-white/5 bg-white/[.025] p-1">
                  {['login', 'register'].map((item) => (
                    <button key={item} onClick={() => setMode(item)} className={`relative rounded-lg py-2.5 font-mono text-[10px] tracking-[.18em] ${mode === item ? 'text-white' : 'text-white/30'}`}>
                      {mode === item && <motion.span layoutId="auth-mode" className="absolute inset-0 rounded-lg border border-cinema-accent/20 bg-cinema-accent/10" />}
                      <span className="relative">{item === 'login' ? 'ENTRAR' : 'REGISTRARME'}</span>
                    </button>
                  ))}
                </div>
              )}

              <form onSubmit={submit} className="space-y-4" noValidate>
                {mode === 'register' && (
                  <label className="relative block">
                    <span className="sr-only">Nombre</span><UserRound className="absolute left-4 top-4 text-white/25" size={17} />
                    <input className={fieldClass} name="displayName" value={form.displayName} onChange={change} placeholder="Nombre en pantalla" autoComplete="name" />
                  </label>
                )}
                {needsEmail && (
                  <label className="relative block">
                    <span className="sr-only">Correo electrónico</span><Mail className="absolute left-4 top-4 text-white/25" size={17} />
                    <input className={fieldClass} name="email" type="email" value={form.email} onChange={change} placeholder="tu@correo.com" autoComplete="email" />
                  </label>
                )}
                {needsPassword && (
                  <label className="relative block">
                    <span className="sr-only">Contraseña</span><KeyRound className="absolute left-4 top-4 text-white/25" size={17} />
                    <input className={`${fieldClass} pr-12`} name="password" type={visible ? 'text' : 'password'} value={form.password} onChange={change} placeholder="Mínimo 8 caracteres" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
                    <button type="button" onClick={() => setVisible((value) => !value)} className="absolute right-4 top-3.5 text-white/30 hover:text-white" aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                      {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </label>
                )}
                {(mode === 'register' || mode === 'update') && (
                  <label className="relative block">
                    <span className="sr-only">Confirmar contraseña</span><Check className="absolute left-4 top-4 text-white/25" size={17} />
                    <input className={fieldClass} name="confirmation" type={visible ? 'text' : 'password'} value={form.confirmation} onChange={change} placeholder="Repite la contraseña" autoComplete="new-password" />
                  </label>
                )}

                <AnimatePresence mode="wait">
                  {message && (
                    <motion.p role="status" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`rounded-xl border px-4 py-3 text-xs leading-relaxed ${message.type === 'error' ? 'border-red-500/20 bg-red-500/10 text-red-200' : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200'}`}>
                      {message.text}
                    </motion.p>
                  )}
                </AnimatePresence>

                <button disabled={loading} className="group flex w-full items-center justify-center gap-2 rounded-xl bg-cinema-accent py-3.5 font-mono text-[11px] font-bold tracking-[.2em] text-white transition hover:bg-[#dc1839] disabled:opacity-50">
                  {loading && <LoaderCircle className="animate-spin" size={16} />}
                  {mode === 'login' ? 'ENTRAR AL ARCHIVO' : mode === 'register' ? 'CREAR CUENTA' : mode === 'reset' ? 'ENVIAR ENLACE' : 'ACTUALIZAR CONTRASEÑA'}
                </button>
              </form>

              {mode === 'login' && (
                <button onClick={() => setMode('reset')} className="mt-5 text-center font-mono text-[10px] tracking-[.12em] text-white/35 transition hover:text-cinema-gold">
                  ¿OLVIDASTE TU CONTRASEÑA?
                </button>
              )}
              <p className="mt-8 text-center font-mono text-[9px] leading-relaxed tracking-[.1em] text-white/20">SIN BOTONES FALSOS · SESIÓN SEGURA CON SUPABASE</p>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
