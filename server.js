require('dotenv').config();
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const { PORT = 3000, MONGODB_URI, JWT_SECRET } = process.env;

if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI in .env');
  process.exit(1);
}
if (!JWT_SECRET) {
  console.error('Missing JWT_SECRET in .env');
  process.exit(1);
}

// Schemas (complaintText removed)
const ComplaintSchema = new mongoose.Schema({
  id: { type: String, unique: true, index: true },
  maxNumber: { type: String, required: true },
  department: { type: String, required: true },
  issueType: { type: String, required: true },
  location: { type: String, required: true },
  contactNumber: { type: String, required: true },
  status: { type: String, default: 'Registered' },
  progressText: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const AdminSchema = new mongoose.Schema({
  username: { type: String, unique: true, index: true },
  passwordHash: String,
  createdAt: { type: Date, default: Date.now }
});

const Complaint = mongoose.model('Complaint', ComplaintSchema);
const Admin = mongoose.model('Admin', AdminSchema);

// Helpers
function randomString(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}
function authAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Missing token' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}
async function ensureDefaultAdmin() {
  const count = await Admin.estimatedDocumentCount();
  if (count === 0) {
    const passwordHash = await bcrypt.hash('password123', 10);
    await Admin.create({ username: 'admin', passwordHash });
    console.log('Seeded default admin: username=admin password=password123');
  }
}

// API
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Create complaint (complaintText removed)
app.post('/api/complaints', async (req, res) => {
  try {
    const { id, maxNumber, department, issueType, location, contactNumber } = req.body;

    if (!/^[78]\d{4}$/.test(maxNumber)) return res.status(400).json({ message: 'Invalid max number' });
    if (!department || !issueType || !location) return res.status(400).json({ message: 'Missing fields' });
    if (!/^\d{10}$/.test(contactNumber)) return res.status(400).json({ message: 'Invalid contact number' });
    if (!id) return res.status(400).json({ message: 'Missing complaint ID' });

    const complaint = await Complaint.create({
      id, maxNumber, department, issueType, location, contactNumber
    });
    res.status(201).json(complaint);
  } catch (e) {
    if (e && e.code === 11000) {
      return res.status(409).json({ message: 'Complaint with this ID already exists' });
    }
    console.error('Create error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get by ID
app.get('/api/complaints/:id', async (req, res) => {
  const c = await Complaint.findOne({ id: req.params.id }).lean();
  if (!c) return res.status(404).json({ message: 'Not found' });
  res.json(c);
});

// List all (admin)
app.get('/api/complaints', authAdmin, async (req, res) => {
  const list = await Complaint.find().sort({ createdAt: -1 }).lean();
  res.json(list);
});

// Update (admin) — status + progressText
app.patch('/api/complaints/:id', authAdmin, async (req, res) => {
  try {
    const allowedStatuses = ['Registered', 'In Progress', 'Resolved', 'Closed'];
    const updates = {};

    if (typeof req.body.status === 'string') {
      if (!allowedStatuses.includes(req.body.status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      updates.status = req.body.status;
    }
    if (typeof req.body.progressText === 'string') {
      updates.progressText = req.body.progressText;
    }
    if (!Object.keys(updates).length) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }
    updates.updatedAt = new Date();

    const c = await Complaint.findOneAndUpdate(
      { id: req.params.id },
      { $set: updates },
      { new: true }
    ).lean();

    if (!c) return res.status(404).json({ message: 'Not found' });
    res.json(c);
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete (admin)
app.delete('/api/complaints/:id', authAdmin, async (req, res) => {
  const out = await Complaint.findOneAndDelete({ id: req.params.id }).lean();
  if (!out) return res.status(404).json({ message: 'Not found' });
  res.json({ ok: true });
});

// Admin login
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ message: 'Missing credentials' });
  const admin = await Admin.findOne({ username });
  if (!admin) return res.status(401).json({ message: 'Invalid username or password' });
  const ok = await bcrypt.compare(password, admin.passwordHash);
  if (!ok) return res.status(401).json({ message: 'Invalid username or password' });
  const token = jwt.sign({ sub: admin._id.toString(), username }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
});

// Serve frontend (same-origin)
app.use(express.static(path.join(__dirname, 'public')));
app.get(/^(?!\/api).*/, (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected');
    await ensureDefaultAdmin();
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB connection failed:', err);
    process.exit(1);
  });