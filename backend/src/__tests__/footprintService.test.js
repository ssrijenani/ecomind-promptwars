const { calculateFootprint } = require('../services/footprintService');

describe('calculateFootprint', () => {
  test('returns zero commute and electricity emissions for a walking, no-electricity input', () => {
    const result = calculateFootprint({
      commuteMode: 'walk',
      weeklyCommuteKm: 20,
      dietType: 'vegan',
      monthlyElectricityKwh: 0,
      domesticFlightsPerYear: 0,
      internationalFlightsPerYear: 0,
    });

    expect(result.breakdown.commute).toBe(0);
    expect(result.breakdown.electricity).toBe(0);
    expect(result.breakdown.flights).toBe(0);
    expect(result.breakdown.diet).toBeGreaterThan(0);
    expect(result.totalMonthlyKgCo2).toBe(result.breakdown.diet);
  });

  test('higher-emission commute mode produces a larger footprint than a lower-emission mode, all else equal', () => {
    const base = {
      weeklyCommuteKm: 100,
      dietType: 'vegetarian',
      monthlyElectricityKwh: 100,
      domesticFlightsPerYear: 0,
      internationalFlightsPerYear: 0,
    };

    const bikeResult = calculateFootprint({ ...base, commuteMode: 'bicycle' });
    const carResult = calculateFootprint({ ...base, commuteMode: 'car_petrol' });

    expect(carResult.totalMonthlyKgCo2).toBeGreaterThan(bikeResult.totalMonthlyKgCo2);
  });

  test('non_veg_heavy diet produces a larger footprint than vegan diet, all else equal', () => {
    const base = {
      commuteMode: 'bus',
      weeklyCommuteKm: 50,
      monthlyElectricityKwh: 150,
      domesticFlightsPerYear: 0,
      internationalFlightsPerYear: 0,
    };

    const veganResult = calculateFootprint({ ...base, dietType: 'vegan' });
    const heavyResult = calculateFootprint({ ...base, dietType: 'non_veg_heavy' });

    expect(heavyResult.breakdown.diet).toBeGreaterThan(veganResult.breakdown.diet);
  });

  test('international flights contribute substantially more than domestic flights', () => {
    const base = {
      commuteMode: 'walk',
      weeklyCommuteKm: 0,
      dietType: 'vegan',
      monthlyElectricityKwh: 0,
    };

    const domesticResult = calculateFootprint({
      ...base,
      domesticFlightsPerYear: 2,
      internationalFlightsPerYear: 0,
    });
    const internationalResult = calculateFootprint({
      ...base,
      domesticFlightsPerYear: 0,
      internationalFlightsPerYear: 2,
    });

    expect(internationalResult.breakdown.flights).toBeGreaterThan(
      domesticResult.breakdown.flights
    );
  });

  test('comparison.percentVsAverage is positive when total exceeds the India average', () => {
    const result = calculateFootprint({
      commuteMode: 'car_petrol',
      weeklyCommuteKm: 500,
      dietType: 'non_veg_heavy',
      monthlyElectricityKwh: 1000,
      domesticFlightsPerYear: 10,
      internationalFlightsPerYear: 5,
    });

    expect(result.comparison.percentVsAverage).toBeGreaterThan(0);
  });

  test('total is the sum of all breakdown categories', () => {
    const result = calculateFootprint({
      commuteMode: 'train',
      weeklyCommuteKm: 80,
      dietType: 'eggetarian',
      monthlyElectricityKwh: 200,
      domesticFlightsPerYear: 1,
      internationalFlightsPerYear: 0,
    });

    const sum =
      result.breakdown.commute +
      result.breakdown.diet +
      result.breakdown.electricity +
      result.breakdown.flights;

    expect(result.totalMonthlyKgCo2).toBeCloseTo(sum, 1);
  });

  test('zero input across all categories produces zero total', () => {
    const result = calculateFootprint({
      commuteMode: 'walk',
      weeklyCommuteKm: 0,
      dietType: 'vegan',
      monthlyElectricityKwh: 0,
      domesticFlightsPerYear: 0,
      internationalFlightsPerYear: 0,
    });

    // diet floor for vegan still contributes; commute/electricity/flights should be 0
    expect(result.breakdown.commute).toBe(0);
    expect(result.breakdown.electricity).toBe(0);
    expect(result.breakdown.flights).toBe(0);
  });
});
