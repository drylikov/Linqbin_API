import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { createNewEntry, getEntryBySlug } from '../../services/entryService';
import { createEntryDto } from './dtos/createEntryDto';
import { HTTPException } from 'hono/http-exception';
import type { Entry } from '../../data/models';
import { Logger } from '@control.systems/logger';

const logger = new Logger('EntryController');

export function entryController(app: Hono) {
  const entry = new Hono();

  entry.get('/:slug', async (c) => {
    const slug = c.req.param('slug');
    const protoHash = c.req.query('hash');

    if (!slug || !protoHash) {
      return c.text('Invalid request', 400);
    }

    const entry = await getEntryBySlug(slug, protoHash);

    if (!entry) {
      return c.text('Entry not found', 404);
    }
    return c.json(entry);
  });

  entry.post('/', zValidator('json', createEntryDto), async (c) => {
    const { title, content, ttl, visitCountThreshold, protoHash } =
      c.req.valid('json');
    let createdEntry: Omit<Entry, 'hash'> | null = null;

    try {
      createdEntry = await createNewEntry(
        title,
        content,
        ttl,
        visitCountThreshold,
        protoHash
      );
    } catch (error) {
      if (error instanceof Error) {
        throw new HTTPException(400, {
          message: error.message,
        });
      }
      throw new HTTPException(400, {
        message: 'Failed to create a new entry',
      });
    }

    return c.json(createdEntry);
  });

  app.route('/entry', entry);
  logger.info('Entry controller loaded');
  return app;
}
