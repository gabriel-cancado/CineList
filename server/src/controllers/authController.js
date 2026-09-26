import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { HttpError } from '../middleware/errorHandler.js';

function createToken(user) {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

export async function register(req, res) {
  const { name, email, password } = req.body;
  if (!name || !email || !password) throw new HttpError(400, 'Nome, e-mail e senha são obrigatórios');
  if (password.length < 6) throw new HttpError(400, 'A senha deve ter pelo menos 6 caracteres');

  if (await User.exists({ email: email.toLowerCase() })) {
    throw new HttpError(409, 'E-mail já cadastrado');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash });
  res.status(201).json({ token: createToken(user), user });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email?.toLowerCase() });
  if (!user || !(await bcrypt.compare(password || '', user.passwordHash))) {
    throw new HttpError(401, 'E-mail ou senha inválidos');
  }
  res.json({ token: createToken(user), user });
}

export async function me(req, res) {
  res.json({ user: req.user });
}
