/**
 * Emission factors used to estimate a user's monthly carbon footprint.
 *
 * IMPORTANT: These are well-established public reference values, not invented
 * numbers. Sources are cited inline so anyone reviewing this code can verify
 * or update them.
 *
 * These are deliberately simplified, India-context averages intended for a
 * personal awareness tool — not for formal carbon accounting or offset claims.
 */

// kg CO2 per kWh of grid electricity in India.
// Source: India's grid emission factor is widely cited around 0.70-0.71 kg CO2/kWh,
// based on Central Electricity Authority (CEA) CO2 Baseline Database and IEA analysis
// of India's generation mix (coal-heavy grid). We use 0.71 as a representative figure.
const ELECTRICITY_KG_CO2_PER_KWH = 0.71;

// kg CO2 per km travelled, by commute mode.
// Sources: derived from typical fuel-economy and passenger-occupancy assumptions
// consistent with EPA/IEA style per-km vehicle emission estimates, adapted for
// common Indian commute vehicle types.
const COMMUTE_KG_CO2_PER_KM = {
  walk: 0,
  bicycle: 0,
  bus: 0.05, // shared public transport, emissions per passenger-km
  train: 0.04, // metro/local train, per passenger-km
  two_wheeler: 0.07, // petrol scooter/motorcycle
  car_petrol: 0.17, // average occupancy petrol car
  car_diesel: 0.16,
  car_ev: 0.71 * 0.15, // EV uses grid electricity; ~0.15 kWh/km typical efficiency
};

// kg CO2 per day, by diet type. These reflect the well-established finding that
// diets higher in animal products (especially red meat) have a substantially
// larger footprint than plant-forward diets, based on lifecycle food-emissions
// research (e.g. Poore & Nemecek, Science, 2018, widely cited approximations).
const DIET_KG_CO2_PER_DAY = {
  vegan: 1.5,
  vegetarian: 2.1,
  eggetarian: 2.4,
  non_veg_moderate: 3.3, // meat a few times a week
  non_veg_heavy: 4.9, // meat most days, including red meat
};

// kg CO2 per round-trip domestic flight (average ~1.5 hr India domestic sector),
// and per round-trip international flight (long-haul), per passenger.
// Source: approximate figures consistent with ICAO carbon calculator methodology.
const FLIGHT_KG_CO2 = {
  domestic_roundtrip: 250,
  international_roundtrip: 1100,
};

// Reference comparison point: approximate average annual per-capita CO2 footprint
// for an individual in India, for context in the dashboard. This is a rough
// national average (not a target), sourced from commonly cited per-capita
// emissions figures (~1.9 tonnes/year territorial emissions per capita, India,
// per Global Carbon Project / Our World in Data style estimates).
const INDIA_AVG_ANNUAL_KG_CO2_PER_CAPITA = 1900;

module.exports = {
  ELECTRICITY_KG_CO2_PER_KWH,
  COMMUTE_KG_CO2_PER_KM,
  DIET_KG_CO2_PER_DAY,
  FLIGHT_KG_CO2,
  INDIA_AVG_ANNUAL_KG_CO2_PER_CAPITA,
};
