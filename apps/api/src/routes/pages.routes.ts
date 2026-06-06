import { Router } from 'express';
import { requireAdmin } from '../middleware/auth';
import { doubleCsrfProtection } from '../middleware/csrf';
import { validate, validateQuery } from '../middleware/validate';
import { PageUpdateSchema } from '../schemas/pages.schema';
import { SlugParamSchema } from '../schemas/common.schema';

const router = Router();

router.get('/', (req, res) => {
  // Public endpoint
  // TODO: Fetch from DB
  res.json({ success: true, data: [] });
});

router.get('/:slug', validateQuery(SlugParamSchema), (req, res) => {
  // Public endpoint
  // TODO: Fetch from DB
  res.json({ success: true, data: { slug: req.params.slug } });
});

router.put('/:slug', requireAdmin, doubleCsrfProtection, validateQuery(SlugParamSchema), validate(PageUpdateSchema), (req, res) => {
  // TODO: Update DB
  res.json({ success: true, data: { slug: req.params.slug, ...req.body } });
});

export default router;
