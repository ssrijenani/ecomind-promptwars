import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { calculateFootprint } from '../lib/api';

const COMMUTE_OPTIONS = [
  { value: 'walk', label: 'Walk' },
  { value: 'bicycle', label: 'Bicycle' },
  { value: 'bus', label: 'Bus' },
  { value: 'train', label: 'Train / Metro' },
  { value: 'two_wheeler', label: 'Two-wheeler (petrol)' },
  { value: 'car_petrol', label: 'Car (petrol)' },
  { value: 'car_diesel', label: 'Car (diesel)' },
  { value: 'car_ev', label: 'Car (electric)' },
];

const DIET_OPTIONS = [
  { value: 'vegan', label: 'Vegan' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'eggetarian', label: 'Eggetarian' },
  { value: 'non_veg_moderate', label: 'Non-veg, a few times a week' },
  { value: 'non_veg_heavy', label: 'Non-veg, most days' },
];

const initialForm = {
  commuteMode: 'bus',
  weeklyCommuteKm: '',
  dietType: 'vegetarian',
  monthlyElectricityKwh: '',
  domesticFlightsPerYear: '0',
  internationalFlightsPerYear: '0',
};

export default function QuestionnairePage() {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const payload = {
        commuteMode: form.commuteMode,
        weeklyCommuteKm: Number(form.weeklyCommuteKm) || 0,
        dietType: form.dietType,
        monthlyElectricityKwh: Number(form.monthlyElectricityKwh) || 0,
        domesticFlightsPerYear: Number(form.domesticFlightsPerYear) || 0,
        internationalFlightsPerYear: Number(form.internationalFlightsPerYear) || 0,
      };

      const result = await calculateFootprint(payload);
      navigate('/results', { state: { result, input: payload } });
    } catch (err) {
      setError(err.message || 'Could not calculate your footprint. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Tell us about your week</h1>
        <p style={styles.subtitle}>
          A few honest answers are enough — there's no perfect way to do this.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <Field label="How do you usually commute?">
            <select
              value={form.commuteMode}
              onChange={(e) => handleChange('commuteMode', e.target.value)}
              style={styles.input}
            >
              {COMMUTE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="How many km do you travel by that mode per week?">
            <input
              type="number"
              min="0"
              max="2000"
              required
              value={form.weeklyCommuteKm}
              onChange={(e) => handleChange('weeklyCommuteKm', e.target.value)}
              style={styles.input}
              placeholder="e.g. 60"
            />
          </Field>

          <Field label="Which best describes your diet?">
            <select
              value={form.dietType}
              onChange={(e) => handleChange('dietType', e.target.value)}
              style={styles.input}
            >
              {DIET_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Roughly how many units (kWh) of electricity does your home use per month?">
            <input
              type="number"
              min="0"
              max="5000"
              required
              value={form.monthlyElectricityKwh}
              onChange={(e) => handleChange('monthlyElectricityKwh', e.target.value)}
              style={styles.input}
              placeholder="e.g. 150 (check your electricity bill)"
            />
          </Field>

          <Field label="Domestic flights per year">
            <input
              type="number"
              min="0"
              max="100"
              value={form.domesticFlightsPerYear}
              onChange={(e) => handleChange('domesticFlightsPerYear', e.target.value)}
              style={styles.input}
            />
          </Field>

          <Field label="International flights per year">
            <input
              type="number"
              min="0"
              max="50"
              value={form.internationalFlightsPerYear}
              onChange={(e) => handleChange('internationalFlightsPerYear', e.target.value)}
              style={styles.input}
            />
          </Field>

          {error && (
            <p role="alert" style={styles.error}>
              {error}
            </p>
          )}

          <button type="submit" style={styles.submitButton} disabled={submitting}>
            {submitting ? 'Calculating…' : 'See my footprint'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      {children}
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
    maxWidth: '520px',
    width: '100%',
  },
  title: {
    fontSize: '1.875rem',
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
    gap: 'var(--space-6)',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
  },
  label: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: 'var(--color-ink)',
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
  },
  submitButton: {
    marginTop: 'var(--space-2)',
    padding: 'var(--space-4)',
    background: 'var(--color-forest)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    fontSize: '1rem',
    fontWeight: 600,
  },
};
