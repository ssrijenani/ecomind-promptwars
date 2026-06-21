const {
  ELECTRICITY_KG_CO2_PER_KWH,
  COMMUTE_KG_CO2_PER_KM,
  DIET_KG_CO2_PER_DAY,
  FLIGHT_KG_CO2,
  INDIA_AVG_ANNUAL_KG_CO2_PER_CAPITA,
} = require('../utils/emissionFactors');

const DAYS_PER_MONTH = 30.44; // average, used for monthly diet estimate
const WEEKS_PER_MONTH = 4.345; // average weeks per month

/**
 * Calculates an estimated monthly carbon footprint broken down by category.
 *
 * @param {object} input - validated footprint input
 * @returns {object} breakdown (kg CO2/month per category) and total
 */
function calculateFootprint(input) {
  const {
    commuteMode,
    weeklyCommuteKm,
    dietType,
    monthlyElectricityKwh,
    domesticFlightsPerYear,
    internationalFlightsPerYear,
  } = input;

  const commuteFactor = COMMUTE_KG_CO2_PER_KM[commuteMode];
  const commuteMonthly = commuteFactor * weeklyCommuteKm * WEEKS_PER_MONTH;

  const dietFactor = DIET_KG_CO2_PER_DAY[dietType];
  const dietMonthly = dietFactor * DAYS_PER_MONTH;

  const electricityMonthly = monthlyElectricityKwh * ELECTRICITY_KG_CO2_PER_KWH;

  // Flights are annual events; we amortize them across 12 months so the
  // monthly total reflects a fair "average month" rather than spiking once a year.
  const flightsMonthly =
    (domesticFlightsPerYear * FLIGHT_KG_CO2.domestic_roundtrip +
      internationalFlightsPerYear * FLIGHT_KG_CO2.international_roundtrip) /
    12;

  const breakdown = {
    commute: roundTo(commuteMonthly, 1),
    diet: roundTo(dietMonthly, 1),
    electricity: roundTo(electricityMonthly, 1),
    flights: roundTo(flightsMonthly, 1),
  };

  const totalMonthlyKgCo2 = roundTo(
    breakdown.commute + breakdown.diet + breakdown.electricity + breakdown.flights,
    1
  );

  const indiaAvgMonthlyKgCo2 = roundTo(INDIA_AVG_ANNUAL_KG_CO2_PER_CAPITA / 12, 1);

  return {
    breakdown,
    totalMonthlyKgCo2,
    comparison: {
      indiaAvgMonthlyKgCo2,
      percentVsAverage: roundTo(
        ((totalMonthlyKgCo2 - indiaAvgMonthlyKgCo2) / indiaAvgMonthlyKgCo2) * 100,
        1
      ),
    },
  };
}

function roundTo(value, decimals) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

module.exports = { calculateFootprint };
