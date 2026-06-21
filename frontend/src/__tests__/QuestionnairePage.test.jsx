import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import QuestionnairePage from '../pages/QuestionnairePage';
import { calculateFootprint } from '../lib/api';

vi.mock('../lib/api', () => ({
  calculateFootprint: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

function renderPage() {
  return render(
    <MemoryRouter>
      <QuestionnairePage />
    </MemoryRouter>
  );
}

describe('QuestionnairePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders all required form fields', () => {
    renderPage();

    expect(screen.getByText(/how do you usually commute/i)).toBeInTheDocument();
    expect(screen.getByText(/km do you travel/i)).toBeInTheDocument();
    expect(screen.getByText(/which best describes your diet/i)).toBeInTheDocument();
    expect(screen.getByText(/units \(kwh\) of electricity/i)).toBeInTheDocument();
  });

  test('submits the form and calls calculateFootprint with numeric values', async () => {
    calculateFootprint.mockResolvedValue({
      breakdown: { commute: 1, diet: 2, electricity: 3, flights: 0 },
      totalMonthlyKgCo2: 6,
      comparison: { indiaAvgMonthlyKgCo2: 158, percentVsAverage: -96 },
      tips: ['tip 1', 'tip 2', 'tip 3', 'tip 4'],
    });

    renderPage();

    const kmInput = screen.getByPlaceholderText('e.g. 60');
    fireEvent.change(kmInput, { target: { value: '50' } });

    const electricityInput = screen.getByPlaceholderText(/check your electricity bill/i);
    fireEvent.change(electricityInput, { target: { value: '120' } });

    const submitButton = screen.getByRole('button', { name: /see my footprint/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(calculateFootprint).toHaveBeenCalledWith(
        expect.objectContaining({
          weeklyCommuteKm: 50,
          monthlyElectricityKwh: 120,
        })
      );
    });
  });

  test('shows an error message if the API call fails', async () => {
    calculateFootprint.mockRejectedValue(new Error('Network error'));

    renderPage();

    fireEvent.change(screen.getByPlaceholderText('e.g. 60'), { target: { value: '50' } });
    fireEvent.change(screen.getByPlaceholderText(/check your electricity bill/i), {
      target: { value: '120' },
    });
    fireEvent.click(screen.getByRole('button', { name: /see my footprint/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Network error');
  });
});
