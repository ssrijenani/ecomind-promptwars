const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are a friendly, practical sustainability coach helping everyday people in India reduce their carbon footprint.

Rules:
- Give exactly 4 tips, each 1-2 sentences.
- Each tip must reference a SPECIFIC number from the user's data (e.g. their commute distance, electricity use, diet, or flights) so it feels personalized, not generic.
- Prioritize the user's single largest emission category first.
- Be encouraging, never preachy or guilt-inducing.
- Keep suggestions realistic and low-cost (no "buy an EV" as the only suggestion).
- Output ONLY valid JSON, no markdown, no preamble, in this exact shape:
{"tips": ["tip 1", "tip 2", "tip 3", "tip 4"]}`;

/**
 * Generates personalized carbon-reduction tips using Claude based on the
 * user's footprint breakdown.
 *
 * @param {object} breakdown - kg CO2/month per category (commute, diet, electricity, flights)
 * @param {object} rawInput - the user's original questionnaire answers, for context
 * @returns {Promise<string[]>} an array of tip strings
 */
async function generateTips(breakdown, rawInput) {
  const userContext = `
User's monthly footprint breakdown (kg CO2):
- Commute: ${breakdown.commute} (mode: ${rawInput.commuteMode}, ${rawInput.weeklyCommuteKm} km/week)
- Diet: ${breakdown.diet} (diet type: ${rawInput.dietType})
- Electricity: ${breakdown.electricity} (${rawInput.monthlyElectricityKwh} kWh/month)
- Flights: ${breakdown.flights} (${rawInput.domesticFlightsPerYear} domestic, ${rawInput.internationalFlightsPerYear} international per year)
`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContext }],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock) {
      throw new Error('No text content returned from Claude');
    }

    const parsed = JSON.parse(textBlock.text.trim());
    if (!Array.isArray(parsed.tips)) {
      throw new Error('Unexpected response shape from Claude');
    }

    return parsed.tips;
  } catch (err) {
    // If the AI call fails (rate limit, network, bad key, malformed JSON),
    // we fall back to safe generic tips rather than breaking the whole request.
    // This keeps the core product usable even if the AI layer has an issue.
    console.error('generateTips failed, using fallback tips:', err.message);
    return getFallbackTips(breakdown);
  }
}

function getFallbackTips(breakdown) {
  const categories = Object.entries(breakdown).sort((a, b) => b[1] - a[1]);
  const [topCategory] = categories[0];

  const fallbackMap = {
    commute: 'Your commute is your biggest contributor. Try combining trips or using public transport a few days a week.',
    diet: 'Diet is your largest category. Swapping in a few more plant-based meals each week can meaningfully reduce this.',
    electricity: 'Electricity use is your top contributor. Switching to LED lighting and unplugging idle devices can help.',
    flights: 'Flights make up a large share of your footprint. Where possible, combine trips or consider train travel for shorter distances.',
  };

  return [
    fallbackMap[topCategory] || 'Small daily changes across categories add up over time.',
    'Unplug chargers and electronics when not in use to cut idle electricity draw.',
    'Walking or cycling for short trips under 2km can replace a notable share of car commute emissions.',
    'Reducing food waste at home lowers your effective diet-related footprint.',
  ];
}

module.exports = { generateTips };
