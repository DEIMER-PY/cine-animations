export function validateAuth(mode, form) {
  if (mode === 'register' && form.displayName.trim().length < 2) return 'Escribe un nombre de al menos 2 caracteres.';
  if (mode !== 'update' && !/^\S+@\S+\.\S+$/.test(form.email)) return 'Escribe un correo válido.';
  if (mode === 'reset') return null;
  if (form.password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
  if ((mode === 'register' || mode === 'update') && form.password !== form.confirmation) return 'Las contraseñas no coinciden.';
  return null;
}
