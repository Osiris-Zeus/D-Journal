import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me-32chars-long!!';
const JWT_EXPIRES_IN = '7d';

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 12);
}
export async function hashPin(pin: string) {
  return bcrypt.hash(pin, 12);
}
export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}
export function signToken(payload: object) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}
export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as any;
}
export function sanitizeEmail(email: string) {
  return email.trim().toLowerCase();
}
