import express from 'express';
import { AuthenticatedRequest, authenticateUser } from '../middleware/auth';
import { authenticatedRateLimit } from '../middleware/rateLimiting';

const router = express.Router();

router.get(
  '/api/geocode/cities',
  authenticatedRateLimit,
  authenticateUser,
  async (req: AuthenticatedRequest, res) => {
    const q = req.query.q as string;


    if (!q || q.trim().length < 3) {
      return res.status(400).json({ error: 'Query must be at least 3 characters' });
    }

    const apiKey = process.env.GEOAPIFY_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Geocoding service not configured' });
    }

    try {
      const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(q.trim())}&type=city&limit=5&apiKey=${apiKey}`;
      const response = await fetch(url);
      console.log("test")

      if (!response.ok) {
        return res.status(502).json({ error: 'Geocoding service unavailable' });
      }

      const data = await response.json();

      const results = (data.features ?? []).map((f: any) => ({
        city: f.properties.city || f.properties.name,
        state: f.properties.state,
        country: f.properties.country,
        formatted: f.properties.formatted,
      }));

      const seen = new Set<string>();
      const deduplicated = results.filter((r: any) => {
        if (seen.has(r.formatted)) return false;
        seen.add(r.formatted);
        return true;
      });

      res.json({ results: deduplicated });
    } catch (error) {
      console.error('Geocode error:', error);
      res.status(500).json({ error: 'Failed to fetch city suggestions' });
    }
  }
);

export default router;
