export function errorHandler(err, req, res, next) {
  // Log error for server diagnostics
  console.error('[Error]', err);

  let statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  let message = err.message || 'An unexpected internal server error occurred.';

  // 1. Mongoose CastError (e.g. malformed ObjectId string in query or params)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid identifier format: '${err.value}'. Expected a valid resource identifier.`;
  }

  // 2. Mongoose Schema ValidationError (e.g. missing required fields)
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    const details = Object.values(err.errors || {}).map(e => e.message).join('; ');
    message = details || err.message;
  }

  // 3. Known business conflicts & validation errors
  else if (message.includes('already voided')) {
    statusCode = 409;
  } else if (message.includes('not found') || message.includes('does not exist')) {
    statusCode = 404;
  } else if (
    message.includes('cannot be negative') ||
    message.includes('greater than zero') ||
    message.includes('is required') ||
    message.includes('at least one') ||
    message.includes('Invalid file type')
  ) {
    statusCode = 400;
  }

  res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === 'development' && statusCode === 500 ? err.stack : undefined
  });
}
