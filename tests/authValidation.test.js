import { describe, expect, it } from 'vitest';
import { validateAuth } from '../src/lib/authValidation';

const valid = { displayName: 'Ada', email: 'ada@example.com', password: 'cinema123', confirmation: 'cinema123' };

describe('validateAuth', () => {
  it('accepts valid login, registration, reset and update payloads', () => {
    expect(validateAuth('login', valid)).toBeNull();
    expect(validateAuth('register', valid)).toBeNull();
    expect(validateAuth('reset', valid)).toBeNull();
    expect(validateAuth('update', valid)).toBeNull();
  });

  it('reports invalid email, short passwords and mismatched confirmation', () => {
    expect(validateAuth('login', { ...valid, email: 'bad' })).toMatch(/correo válido/);
    expect(validateAuth('login', { ...valid, password: '123' })).toMatch(/8 caracteres/);
    expect(validateAuth('register', { ...valid, confirmation: 'different' })).toMatch(/no coinciden/);
  });
});
