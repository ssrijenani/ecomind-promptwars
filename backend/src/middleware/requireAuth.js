const { supabase } = require('../services/supabaseClient');

/**
 * Verifies the Supabase access token sent by the frontend in the
 * Authorization header (format: "Bearer <token>") and attaches the
 * authenticated user to req.user.
 *
 * Rejecting requests without a valid token here -- rather than trusting a
 * user ID sent in the request body -- prevents one user from reading or
 * writing another user's data.
 */
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header.' });
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ error: 'Invalid or expired session.' });
    }

    req.user = data.user;
    next();
  } catch (err) {
    console.error('Auth verification failed:', err.message);
    return res.status(401).json({ error: 'Could not verify session.' });
  }
}

module.exports = { requireAuth };
