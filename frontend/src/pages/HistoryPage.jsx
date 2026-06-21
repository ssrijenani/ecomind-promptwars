import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { getFootprintHistory } from '../lib/api';

export default function HistoryPage() {
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    getFootprintHistory()
      .then((data) => setSnapshots(data.snapshots || []))
      .catch((err) => setError(err.message || 'Could not load your history.'))
      .finally(() => setLoading(false));
  }, []);

  const chartData = [...snapshots]
    .reverse()
    .map((snap) => ({
      date: new Date(snap.created_at).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
      }),
      total: snap.total_monthly_kg_co2,
    }));

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Your footprint over time</h1>

        {loading && <p>Loading your history…</p>}
        {error && (
          <p role="alert" style={styles.error}>
            {error}
          </p>
        )}

        {!loading && !error && snapshots.length === 0 && (
          <div style={styles.emptyState}>
            <p>You haven't saved a footprint yet.</p>
            <button style={styles.primaryButton} onClick={() => navigate('/questionnaire')}>
              Calculate your first footprint
            </button>
          </div>
        )}

        {!loading && snapshots.length > 0 && (
          <>
            {snapshots.length > 1 && (
              <div style={styles.chartWrap}>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={chartData}>
                    <CartesianGrid stroke="var(--color-line)" strokeDasharray="3 3" />
                    <XAxis dataKey="date" stroke="var(--color-ink-soft)" fontSize={12} />
                    <YAxis stroke="var(--color-ink-soft)" fontSize={12} />
                    <Tooltip formatter={(value) => `${value} kg CO₂`} />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="var(--color-forest)"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <ul style={styles.list}>
              {snapshots.map((snap) => (
                <li key={snap.id} style={styles.listItem}>
                  <div>
                    <strong>{snap.total_monthly_kg_co2} kg CO₂</strong>
                    <div style={styles.listDate}>
                      {new Date(snap.created_at).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        <button style={styles.secondaryButton} onClick={() => navigate('/questionnaire')}>
          Calculate a new footprint
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
    maxWidth: '640px',
    width: '100%',
  },
  title: {
    fontSize: '1.875rem',
    marginBottom: 'var(--space-6)',
  },
  error: {
    color: 'var(--color-clay)',
  },
  emptyState: {
    textAlign: 'center',
    padding: 'var(--space-8) 0',
  },
  chartWrap: {
    marginBottom: 'var(--space-8)',
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
    marginBottom: 'var(--space-8)',
  },
  listItem: {
    background: 'var(--color-paper)',
    border: '1px solid var(--color-line)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-4)',
  },
  listDate: {
    fontSize: '0.85rem',
    color: 'var(--color-ink-soft)',
    marginTop: 'var(--space-1)',
  },
  primaryButton: {
    marginTop: 'var(--space-4)',
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
