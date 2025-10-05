
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { entryController } from './controllers/entry/entryController';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { HTTPException } from 'hono/http-exception';
import { Logger } from '@control.systems/logger';

const logger = new Logger('App');

const app = new Hono();
app.use(
  '/*',
  cors({
    origin: ['https://linqb.in', 'https://linqbin.cc'],
    allowMethods: ['POST', 'GET', 'OPTIONS'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
  })
);

const rateLimiter = new RateLimiterMemory({
  points: 5, // 5 requests
  duration: 5, // 5 seconds
  blockDuration: 10, // 10 seconds
});

app.use('*', async (c, next) => {
  const ip = c.req.raw.headers.get('x-forwarded-for');
  if (!ip) {
    return next();
  }

  try {
    await next();

    const status = c.res.status;
    if (status === 400 || status === 404) {
      const rateLimitInfo = await rateLimiter.get(ip);
      const remainingPoints = rateLimitInfo?.remainingPoints ?? 5;
      const msBeforeNext = rateLimitInfo?.msBeforeNext ?? 0;

      c.res.headers.set('X-RateLimit-Limit', '5');
      c.res.headers.set('X-RateLimit-Remaining', remainingPoints.toString());
      c.res.headers.set(
        'X-RateLimit-Reset',
        Math.ceil(Date.now() / 1000) + (msBeforeNext / 1000).toString()
      );

      await rateLimiter.consume(ip);
    }
  } catch (e) {
    throw new HTTPException(429);
  }
});

entryController(app);

app.get('/', (c) => {
  return c.text('OK');
});

logger.info(`Server listening on port ${process.env.PORT || 4000}`);

export default {
  fetch: app.fetch,
  port: process.env.PORT || 4000,
};
