import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const app = express();
const JWT_SECRET = 'test-secret-key';

// Mock data
const users = new Map();
users.set('juan@example.com', {
  id: 'user1',
  name: 'Juan García',
  email: 'juan@example.com',
  password: '$2b$10$password', // password123
  company: 'Acme Corp',
  employeeNumber: '12345',
  phone: '555-0001',
  role: 'USER',
  balance: 500,
  qrCode: 'QR_USER_1',
  isActive: true
});

const transactions = [];
const recharges = [];

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, company, employeeNumber, phone } = req.body;

  if (users.has(email)) {
    return res.status(409).json({ error: 'El email ya está registrado' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const userId = 'user_' + Date.now();

  users.set(email, {
    id: userId,
    name,
    email,
    password: hashedPassword,
    company,
    employeeNumber,
    phone,
    role: 'USER',
    balance: 0,
    qrCode: 'QR_' + userId,
    isActive: true
  });

  const accessToken = jwt.sign({ sub: userId, role: 'USER' }, JWT_SECRET, { expiresIn: '1h' });
  const refreshToken = jwt.sign({ sub: userId, role: 'USER' }, JWT_SECRET, { expiresIn: '7d' });

  res.status(201).json({
    user: {
      id: userId,
      name,
      email,
      company,
      role: 'USER',
      balance: '0'
    },
    accessToken,
    refreshToken
  });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = users.get(email);

  if (!user) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const accessToken = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
  const refreshToken = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      company: user.company,
      role: user.role,
      balance: user.balance.toString()
    },
    accessToken,
    refreshToken
  });
});

app.post('/api/auth/refresh', (req, res) => {
  const { refreshToken } = req.body;

  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    const accessToken = jwt.sign({ sub: decoded.sub, role: decoded.role }, JWT_SECRET, { expiresIn: '1h' });
    const newRefreshToken = jwt.sign({ sub: decoded.sub, role: decoded.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    res.status(401).json({ error: 'Token inválido' });
  }
});

// User routes
app.get('/api/users/me', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Mock: find first user (juan)
    const user = Array.from(users.values()).find(u => u.id === decoded.sub);

    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      company: user.company,
      employeeNumber: user.employeeNumber,
      phone: user.phone,
      role: user.role,
      balance: user.balance.toString(),
      qrCode: user.qrCode,
      isActive: user.isActive
    });
  } catch (err) {
    res.status(401).json({ error: 'Token inválido' });
  }
});

// Transactions
app.get('/api/transactions', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    jwt.verify(token, JWT_SECRET);
    res.json({
      data: transactions,
      total: transactions.length,
      page: 1,
      limit: 20
    });
  } catch (err) {
    res.status(401).json({ error: 'Token inválido' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Mock Server corriendo en puerto ${PORT}`);
  console.log('⚠️  Esto es un servidor MOCK para desarrollo');
  console.log('   Credenciales: juan@example.com / password123');
});
