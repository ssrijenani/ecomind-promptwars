const { z } = require('zod');

/**
 * Validates the footprint questionnaire payload.
 * Using an allow-list (enum) for categorical fields and bounded ranges for
 * numeric fields prevents malformed or malicious input from reaching the
 * calculation logic or being stored.
 */
const footprintInputSchema = z.object({
  commuteMode: z.enum([
    'walk',
    'bicycle',
    'bus',
    'train',
    'two_wheeler',
    'car_petrol',
    'car_diesel',
    'car_ev',
  ]),
  // weekly commute distance in km, one-way distance assumed doubled by caller if needed
  weeklyCommuteKm: z.number().min(0).max(2000),
  dietType: z.enum([
    'vegan',
    'vegetarian',
    'eggetarian',
    'non_veg_moderate',
    'non_veg_heavy',
  ]),
  monthlyElectricityKwh: z.number().min(0).max(5000),
  domesticFlightsPerYear: z.number().int().min(0).max(100),
  internationalFlightsPerYear: z.number().int().min(0).max(50),
});

module.exports = { footprintInputSchema };
