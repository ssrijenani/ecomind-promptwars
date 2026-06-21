import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { saveFootprint } from '../lib/api';
import { generateTips } from '../lib/aiTips';

const CATEGORY_LABELS = {
  commute: 'Commute',
  diet: 'Diet',
  electricity: 'Electricity',
  flights: 'Flights',
};

const CATEGORY_COLORS = {
  commute: '#2C4A3B',
  diet: '#6B8F63',
  electricity: '#B5562F',
  flights: '#8C6E4E',
};

export default function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [tips, setTips] = useState(null);
  const [tipsLoading, setTipsLoading] = useState(true);

  const { result, input } = location.state || {};

  useEffect(() => {
    if (!result) return;

    let isMounted = true;
    setTipsLoading(true);

    generateTips(result.breakdown, input)
      .then((generatedTips) => {
        if (isMounted) setTips(generatedTips);
      })
      .finally(() => {
        if (isMounted) setTipsLoading(false);
      });

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!result) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <p>No results to show yet.</p>
          <button style={styles.primaryButton} onClick={() => navigate('/questionnaire')}>
            Start the questionnaire
          </button>
        </div>
      </div>
    );
  }

  const { breakdown, totalMonthlyKgCo2, comparison } = result;

  const chartData = Object.entries(breakdown)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => ({
      name: CATEGORY_LABELS[key],
      value,
      color: CATEGORY_COLORS[key],
    }));

  const isAboveAverage = comparison.percentVsAverage > 0;

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      await saveFootprint(input);
      setSaved(true);
    } catch (err) {
      setError(err.message || 'Could not save your result. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <p style={styles.eyebrow}>Your estimated monthly footprint</p>
        <div style={styles.heroNumber}>
          {totalMonthlyKgCo2}
          <span style={styles.heroUnit}>kg CO₂</span>
        </div>

        <p style={styles.comparisonText}>
          That's{' '}
          <strong style={{ color: isAboveAverage ? 'var(--color-clay)' : 'var(--color-forest)' }}>
            {Math.abs(comparison.percentVsAverage)}% {isAboveAverage ? 'above' : 'below'}
          </strong>{' '}
          the estimated India average of {comparison.indiaAvgMonthlyKgCo2} kg CO₂/month.
        </p>

        <div style={styles.chartWrap}>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value} kg CO₂`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <section style={styles.tipsSection}>
          <h2 style={styles.tipsHeading}>Personalized ways to reduce this</h2>
          {tipsLoading && (
            <p style={styles.tipsLoading}>
              Asking your AI coach for personalized tips… (you may see a one-time sign-in
              prompt — it's free, just a quick account)
            </p>
          )}
          {!tipsLoading && tips && (
            <ul style={styles.tipsList}>
              {tips.map((tip, i) => (
                <li key={i} style={styles.tipItem}>
                  {tip}
                </li>
              ))}
            </ul>
          )}
        </section>

        {error && (
          <p role="alert" style={styles.error}>
            {error}
          </p>
        )}

        <div style={styles.actions}>
          <button
            style={styles.primaryButton}
            onClick={handleSave}
            disabled={saving || saved}
          >
            {saved ? 'Saved ✓' : saving ? 'Saving…' : 'Save to my history'}
          </button>
          <button style={styles.secondaryButton} onClick={() => navigate('/history')}>
            View history
          </button>
        </div>
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
    maxWidth: '640px',
    width: '100%',
  },
  eyebrow: {
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontSize: '0.8rem',
    color: 'var(--color-ink-soft)',
    fontWeight: 600,
    margin: 0,
  },
  heroNumber: {
    fontFamily: 'var(--font-display)',
    fontSize: '4.5rem',
    fontWeight: 600,
    color: 'var(--color-forest-deep)',
    lineHeight: 1,
    marginTop: 'var(--space-2)',
    marginBottom: 'var(--space-4)',
  },
  heroUnit: {
    fontSize: '1.5rem',
    marginLeft: 'var(--space-2)',
    color: 'var(--color-ink-soft)',
    fontFamily: 'var(--font-body)',
    fontWeight: 500,
  },
  comparisonText: {
    fontSize: '1rem',
    color: 'var(--color-ink)',
    marginBottom: 'var(--space-6)',
  },
  chartWrap: {
    marginBottom: 'var(--space-8)',
  },
  tipsSection: {
    marginBottom: 'var(--space-6)',
  },
  tipsHeading: {
    fontSize: '1.25rem',
    marginBottom: 'var(--space-4)',
  },
  tipsLoading: {
    fontSize: '0.9rem',
    color: 'var(--color-ink-soft)',
    fontStyle: 'italic',
  },
  tipsList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
  },
  tipItem: {
    background: 'var(--color-paper)',
    border: '1px solid var(--color-line)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-4)',
    fontSize: '0.95rem',
  },
  error: {
    color: 'var(--color-clay)',
    fontSize: '0.875rem',
  },
  actions: {
    display: 'flex',
    gap: 'var(--space-3)',
    flexWrap: 'wrap',
  },
  primaryButton: {
    padding: 'var(--space-3) var(--space-6)',
    background: 'var(--color-forest)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    fontSize: '1rem',
    fontWeight: 600,
  },
  secondaryButton: {
    padding: 'var(--space-3) var(--space-6)',
    background: 'transparent',
    color: 'var(--color-forest)',
    border: '1px solid var(--color-forest)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '1rem',
    fontWeight: 600,
  },
};
