/**
 * In-memory sliding-window rate limiter for sensitive endpoints (e.g. login)
 */
export function rateLimiter({ windowMs = 15 * 60 * 1000, max = 20, message = 'Too many attempts. Please try again later.' } = {}) {
  const store = new Map();

  // Periodically cleanup expired entries
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (now > record.resetTime) {
        store.delete(key);
      }
    }
  }, 60 * 1000).unref();

  return (req, res, next) => {
    // Determine client identifier (IP or X-Forwarded-For)
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';
    const key = `${req.baseUrl}${req.path}:${ip}`;
    const now = Date.now();

    let record = store.get(key);

    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + windowMs };
      store.set(key, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > max) {
      res.setHeader('Retry-After', retryAfterSec);
      return res.status(429).json({
        message,
        retryAfter: retryAfterSec
      });
    }

    next();
  };
}
