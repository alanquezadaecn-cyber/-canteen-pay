export const prismaErrorHandler = (err, req, res, next) => {
  // Prisma connection errors
  if (
    err.code === 'ECONNREFUSED' ||
    err.message?.includes('Cannot find module') ||
    err.message?.includes('DATABASE_URL')
  ) {
    console.error('❌ Database connection error:', err.message);
    return res.status(503).json({
      error: 'Database connection unavailable',
      message: 'El servidor está iniciando. Intenta en unos momentos.'
    });
  }

  next(err);
};
