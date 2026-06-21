import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setInfo('');
    setSubmitting(true);

    try {
      if (mode === 'signup') {
        const { error: signUpError } = await signUp(email, password);
        if (signUpError) throw signUpError;
        setInfo('Account created. You can sign in now.');
        setMode('signin');
      } else {
        const { error: signInError } = await signIn(email, password);
        if (signInError) throw signInError;
        navigate('/questionnaire');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>EcoMind</h1>
        <p style={styles.subtitle}>
          Understand your carbon footprint, one honest number at a time.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            autoComplete="email"
          />

          <label style={styles.label} htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          />

          {error && (
            <p role="alert" style={styles.error}>
              {error}
            </p>
          )}
          {info && (
            <p role="status" style={styles.info}>
              {info}
            </p>
          )}

          <button type="submit" style={styles.submitButton} disabled={submitting}>
            {submitting
              ? 'Please wait…'
              : mode === 'signup'
              ? 'Create account'
              : 'Sign in'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin');
            setError('');
            setInfo('');
          }}
          style={styles.switchButton}
        >
          {mode === 'signin'
            ? "Don't have an account? Sign up"
            : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-6)',
  },
  card: {
    background: 'var(--color-paper-raised)',
    border: '1px solid var(--color-line)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-12) var(--space-8)',
    maxWidth: '420px',
    width: '100%',
  },
  title: {
    fontSize: '2.25rem',
    marginBottom: 'var(--space-2)',
  },
  subtitle: {
    color: 'var(--color-ink-soft)',
    marginTop: 0,
    marginBottom: 'var(--space-8)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: 600,
    marginTop: 'var(--space-3)',
  },
  input: {
    padding: 'var(--space-3)',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-line)',
    fontSize: '1rem',
    fontFamily: 'var(--font-body)',
    background: '#fff',
  },
  error: {
    color: 'var(--color-clay)',
    fontSize: '0.875rem',
    marginTop: 'var(--space-2)',
  },
  info: {
    color: 'var(--color-forest)',
    fontSize: '0.875rem',
    marginTop: 'var(--space-2)',
  },
  submitButton: {
    marginTop: 'var(--space-6)',
    padding: 'var(--space-3)',
    background: 'var(--color-forest)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    fontSize: '1rem',
    fontWeight: 600,
  },
  switchButton: {
    marginTop: 'var(--space-6)',
    background: 'none',
    border: 'none',
    color: 'var(--color-forest)',
    textDecoration: 'underline',
    fontSize: '0.875rem',
    padding: 0,
  },
};
