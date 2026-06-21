/**
 * Generates personalized carbon-reduction tips using Claude via Puter.js.
 *
 * We use Puter.js instead of a backend Anthropic API call so that no API
 * key or billing setup is required on our side: Puter's "User-Pays" model
 * means each signed-in Puter user covers their own AI usage. The first time
 * this runs in a browser, Puter shows a one-time sign-in popup.
 *
 * If anything goes wrong (popup blocked, network issue, unexpected
 * response shape), we fall back to safe, still-relevant generic tips so the
 * results page never breaks.
 */

const SYSTEM_PROMPT = `You are a friendly, practical sustainability coach helping everyday people in India reduce their carbon footprint.

Rules:
- Give exactly 4 tips, each 1-2 sentences.
- Each tip must reference a SPECIFIC number from the user's data (e.g. their commute distance, electricity use, diet, or flights) so it feels personalized, not generic.
- Prioritize the user's single largest emission category first.
- Be encouraging, never preachy or guilt-inducing.
- Keep suggestions realistic and low-cost (no "buy an EV" as the only suggestion).
- Output ONLY valid JSON, no markdown, no preamble, in this exact shape:
{"tips": ["tip 1", "tip 2", "tip 3", "tip 4"]}`;

export async function generateTips(breakdown, input) {
  const userContext = `
User's monthly footprint breakdown (kg CO2):
- Commute: ${breakdown.commute} (mode: ${input.commuteMode}, ${input.weeklyCommuteKm} km/week)
- Diet: ${breakdown.diet} (diet type: ${input.dietType})
- Electricity: ${breakdown.electricity} (${input.monthlyElectricityKwh} kWh/month)
- Flights: ${breakdown.flights} (${input.domesticFlightsPerYear} domestic, ${input.internationalFlightsPerYear} international per year)
`;

  try {
    if (!window.puter) {
      throw new Error('Puter.js did not load.');
    }

    const response = await window.puter.ai.chat(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContext },
      ],
      { model: 'claude-sonnet-4-6' }
    );

    const text = response?.message?.content?.[0]?.text ?? response;
    const parsed = JSON.parse(String(text).trim());

    if (!Array.isArray(parsed.tips) || parsed.tips.length === 0) {
      throw new Error('Unexpected response shape from Puter/Claude.');
    }

    return parsed.tips;
  } catch (err) {
    console.error('generateTips (Puter) failed, using fallback tips:', err.message);
    return getFallbackTips(breakdown);
  }
}

function getFallbackTips(breakdown) {
  const categories = Object.entries(breakdown).sort((a, b) => b[1] - a[1]);
  const [topCategory] = categories[0];

  const fallbackMap = {
    commute:
      'Your commute is your biggest contributor. Try combining trips or using public transport a few days a week.',
    diet: 'Diet is your largest category. Swapping in a few more plant-based meals each week can meaningfully reduce this.',
    electricity:
      'Electricity use is your top contributor. Switching to LED lighting and unplugging idle devices can help.',
    flights:
      'Flights make up a large share of your footprint. Where possible, combine trips or consider train travel for shorter distances.',
  };

  return [
    fallbackMap[topCategory] || 'Small daily changes across categories add up over time.',
    'Unplug chargers and electronics when not in use to cut idle electricity draw.',
    'Walking or cycling for short trips under 2km can replace a notable share of car commute emissions.',
    'Reducing food waste at home lowers your effective diet-related footprint.',
  ];
}
