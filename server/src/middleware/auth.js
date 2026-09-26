import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { HttpError } from './errorHandler.js';

// Expects "Authorization: Bearer <token>" and puts the logged user in req.user.
export async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) throw new HttpError(401, 'Authentication required');

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new HttpError(401, 'Invalid or expired token');
  }

  req.user = await User.findById(payload.id);
  if (!req.user) throw new HttpError(401, 'User not found');
  next();
}
