import { isAxiosError } from 'axios';
import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import {
  authErrorBoxClass,
  authInputClass,
  authLabelClass,
  authPrimaryButtonClass,
} from '../authFieldClasses';
import { Spinner } from './Spinner';

export function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err: unknown) {
      let msg = 'No se pudo iniciar sesión.';
      if (isAxiosError(err)) {
        const data = err.response?.data as
          | { message?: string; errors?: { email?: string[] } }
          | undefined;
        msg =
          data?.message ||
          data?.errors?.email?.[0] ||
          msg;
      }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {error ? (
        <div className={authErrorBoxClass} role="alert">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </span>
          <span>{error}</span>
        </div>
      ) : null}

      <div>
        <label className={authLabelClass} htmlFor="login-email">
          Correo electrónico
        </label>
        <input
          id="login-email"
          className={authInputClass}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div>
        <label className={authLabelClass} htmlFor="login-password">
          Contraseña
        </label>
        <input
          id="login-password"
          className={authInputClass}
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <div className="pt-1">
        <button type="submit" disabled={submitting} className={authPrimaryButtonClass}>
          {submitting ? (
            <>
              <Spinner />
              Entrando…
            </>
          ) : (
            'Entrar'
          )}
        </button>
      </div>

      <p className="text-center text-sm text-slate-600">
        Solo los administradores pueden acceder al sistema.
      </p>
    </form>
  );
}
