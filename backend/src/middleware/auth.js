import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../lib/jwtSecret.js';

export const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.sub;
    req.userRole = decoded.role;
    req.userEmail = decoded.email;
    req.userCompanyId = decoded.companyId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

export const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }
    next();
  };
};
