const express = require('express');
const rateLimit = require('express-rate-limit');
const { footprintInputSchema } = require('../utils/validation');
const { calculateFootprint } = require('../services/footprintService');
const { generateTips } = require('../services/aiInsightsService');
const { requireAuth } = require('../middleware/requireAuth');
const { supabase } = require('../services/supabaseClient');

const router = express.Router();

// The AI call is the most expensive/abusable endpoint, so it gets a tighter
// rate limit than the rest of the API to prevent cost abuse and basic DoS.
const calculateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many requests. Please wait a moment and try again.' },
});

/**
 * POST /api/footprint/calculate
 * Calculates a footprint breakdown and AI tips from questionnaire input.
 * Does NOT save anything -- this is a preview step before the user saves.
 */
router.post('/calculate', calculateLimiter, requireAuth, async (req, res) => {
  const parseResult = footprintInputSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      error: 'Invalid input.',
      details: parseResult.error.flatten().fieldErrors,
    });
  }

  const input = parseResult.data;

  try {
    const { breakdown, totalMonthlyKgCo2, comparison } = calculateFootprint(input);
    const tips = await generateTips(breakdown, input);

    res.json({ breakdown, totalMonthlyKgCo2, comparison, tips });
  } catch (err) {
    console.error('Error calculating footprint:', err.message);
    res.status(500).json({ error: 'Something went wrong while calculating your footprint.' });
  }
});

/**
 * POST /api/footprint/save
 * Persists a calculated snapshot to Supabase for the authenticated user.
 */
router.post('/save', requireAuth, async (req, res) => {
  const parseResult = footprintInputSchema.safeParse(req.body.input);

  if (!parseResult.success) {
    return res.status(400).json({
      error: 'Invalid input.',
      details: parseResult.error.flatten().fieldErrors,
    });
  }

  const input = parseResult.data;

  try {
    const { breakdown, totalMonthlyKgCo2, comparison } = calculateFootprint(input);

    const { data, error } = await supabase
      .from('footprint_snapshots')
      .insert({
        user_id: req.user.id,
        input,
        breakdown,
        total_monthly_kg_co2: totalMonthlyKgCo2,
        comparison,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error.message);
      return res.status(500).json({ error: 'Could not save your footprint snapshot.' });
    }

    res.status(201).json({ snapshot: data });
  } catch (err) {
    console.error('Error saving footprint:', err.message);
    res.status(500).json({ error: 'Something went wrong while saving your footprint.' });
  }
});

/**
 * GET /api/footprint/history
 * Returns the authenticated user's past snapshots, most recent first.
 */
router.get('/history', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('footprint_snapshots')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Supabase select error:', error.message);
      return res.status(500).json({ error: 'Could not fetch your history.' });
    }

    res.json({ snapshots: data });
  } catch (err) {
    console.error('Error fetching history:', err.message);
    res.status(500).json({ error: 'Something went wrong while fetching your history.' });
  }
});

module.exports = router;
