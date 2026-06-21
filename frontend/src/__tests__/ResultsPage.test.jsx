import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ResultsPage from '../pages/ResultsPage';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: vi.fn(),
  };
});

vi.mock('../lib/api', () => ({
  saveFootprint: vi.fn(),
}));

import { useLocation } from 'react-router-dom';

function renderWithState(state) {
  useLocation.mockReturnValue({ state });
  return render(
    <MemoryRouter>
      <ResultsPage />
    </MemoryRouter>
  );
}

describe('ResultsPage', () => {
  test('shows a fallback message when there is no result in state', () => {
    renderWithState(undefined);
    expect(screen.getByText(/no results to show yet/i)).toBeInTheDocument();
  });

  test('renders the total footprint number and comparison text', () => {
    renderWithState({
      result: {
        breakdown: { commute: 10, diet: 20, electricity: 5, flights: 0 },
        totalMonthlyKgCo2: 35,
        comparison: { indiaAvgMonthlyKgCo2: 158, percentVsAverage: -78 },
        tips: ['Tip one', 'Tip two', 'Tip three', 'Tip four'],
      },
      input: { commuteMode: 'bus' },
    });

    expect(screen.getByText('35')).toBeInTheDocument();
    expect(screen.getByText(/below/i)).toBeInTheDocument();
    expect(screen.getByText('Tip one')).toBeInTheDocument();
  });

  test('shows "above" when footprint exceeds the average', () => {
    renderWithState({
      result: {
        breakdown: { commute: 100, diet: 50, electricity: 80, flights: 20 },
        totalMonthlyKgCo2: 250,
        comparison: { indiaAvgMonthlyKgCo2: 158, percentVsAverage: 58 },
        tips: ['Tip one', 'Tip two', 'Tip three', 'Tip four'],
      },
      input: { commuteMode: 'car_petrol' },
    });

    expect(screen.getByText(/above/i)).toBeInTheDocument();
  });
});
