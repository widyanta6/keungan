import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'database.json');

import {
  INITIAL_USERS,
  INITIAL_WORKSPACES,
  INITIAL_BRANDS,
  INITIAL_BRAND_POLICY,
  INITIAL_INVITATIONS,
  INITIAL_PASSWORD_RESETS,
  INITIAL_ASSETS,
  INITIAL_TRANSACTIONS,
  INITIAL_PRODUCTS,
  INITIAL_HPP_RECIPES,
  INITIAL_KOLS,
  INITIAL_ORDERS,
  INITIAL_KOL_RECAPS,
  INITIAL_TEAM_MEMBERS,
  INITIAL_TASKS,
  INITIAL_PAYROLL_RECAPS,
  INITIAL_WORKSHEETS,
  INITIAL_COMMISSIONS,
  INITIAL_MARKETING,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
} from './src/data/initialData';

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory sessions storage (token -> userId)
const activeSessions = new Map<string, { userId: string; expiresAt: number }>();

function createDefaultDatabase() {
  return {
    users: INITIAL_USERS,
    workspaces: INITIAL_WORKSPACES,
    brands: INITIAL_BRANDS,
    brandPolicy: INITIAL_BRAND_POLICY,
    invitations: INITIAL_INVITATIONS,
    passwordResets: INITIAL_PASSWORD_RESETS,
    assets: INITIAL_ASSETS,
    transactions: INITIAL_TRANSACTIONS,
    products: INITIAL_PRODUCTS,
    hppRecipes: INITIAL_HPP_RECIPES,
    kols: INITIAL_KOLS,
    orders: INITIAL_ORDERS,
    kolRecaps: INITIAL_KOL_RECAPS,
    teamMembers: INITIAL_TEAM_MEMBERS,
    tasks: INITIAL_TASKS,
    payrollRecaps: INITIAL_PAYROLL_RECAPS,
    worksheets: INITIAL_WORKSHEETS,
    commissions: INITIAL_COMMISSIONS,
    marketing: INITIAL_MARKETING,
    notifications: INITIAL_NOTIFICATIONS,
    auditLogs: INITIAL_AUDIT_LOGS,
  };
}

// Load or initialize DB from initialData
function getDatabase() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    } catch (e) {
      console.error('Error reading database file, using defaults:', e);
    }
  }
  const defaultDb = createDefaultDatabase();
  saveDatabase(defaultDb);
  return defaultDb;
}

function saveDatabase(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving database file:', e);
  }
}

// Brand access rules per role
const ROLE_BRAND_MAP: Record<string, string[]> = {
  ika: ['brand_tirama', 'brand_chemi'],
  redi: ['brand_bye', 'brand_metamorph', 'brand_presta'],
  super_admin: ['brand_tirama', 'brand_chemi', 'brand_bye', 'brand_metamorph', 'brand_presta'],
  admin: ['brand_tirama', 'brand_chemi', 'brand_bye', 'brand_metamorph', 'brand_presta'],
};

// Middleware: Authenticate Session Token
interface AuthenticatedRequest extends Request {
  user?: any;
  allowedBrandIds?: string[];
}

function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Tidak terautentikasi. Silakan login terlebih dahulu.' });
  }

  const token = authHeader.substring(7).trim();
  const session = activeSessions.get(token);

  if (!session || session.expiresAt < Date.now()) {
    if (session) activeSessions.delete(token);
    return res.status(401).json({ error: 'Sesi telah kedaluwarsa. Silakan login kembali.' });
  }

  const db = getDatabase();
  const user = db?.users?.find((u: any) => u.id === session.userId);
  if (!user || user.status !== 'active') {
    return res.status(403).json({ error: 'Akun tidak aktif atau tidak ditemukan.' });
  }

  req.user = user;
  // Calculate authorized brand IDs strictly from backend rules
  let allowedBrands = user.allowedBrandIds || [];
  if (ROLE_BRAND_MAP[user.role]) {
    allowedBrands = ROLE_BRAND_MAP[user.role];
  }
  req.allowedBrandIds = allowedBrands;

  next();
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Seed / Sync database from initial client payload if DB is not yet populated
  app.post('/api/sync/bootstrap', (req, res) => {
    let db = getDatabase();
    if (!db) {
      db = req.body;
      saveDatabase(db);
      console.log('Database bootstrapped from initial seed.');
    }
    res.json({ success: true });
  });

  // 1. Auth: Login
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email wajib diisi.' });
    }

    const db = getDatabase();
    const cleanEmail = email.trim().toLowerCase();
    const user = db?.users?.find((u: any) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      return res.status(401).json({ error: 'Email atau kata sandi tidak terdaftar di sistem BizFlow.' });
    }

    if (user.status === 'invited') {
      return res.status(403).json({ error: 'Akun Anda belum aktif. Silakan masukkan token undangan.' });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Akses Ditolak: Akun Anda ditangguhkan oleh Super Admin.' });
    }
    if (user.status === 'disabled') {
      return res.status(403).json({ error: 'Akses Ditolak: Akun ini telah dinonaktifkan.' });
    }

    // Generate secure session token
    const token = `biz_sec_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
    // Session valid for 24 hours
    activeSessions.set(token, {
      userId: user.id,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    });

    const allowedBrands = ROLE_BRAND_MAP[user.role] || user.allowedBrandIds || [];

    // Return sanitized user info with secure token
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      workspaceId: user.workspaceId,
      status: user.status,
      allowedBrandIds: allowedBrands,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      bio: user.bio,
    };

    res.json({
      success: true,
      token,
      user: safeUser,
    });
  });

  // 2. Auth: Me
  app.get('/api/auth/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        workspaceId: user.workspaceId,
        status: user.status,
        allowedBrandIds: req.allowedBrandIds,
        avatarUrl: user.avatarUrl,
        phone: user.phone,
        bio: user.bio,
      },
    });
  });

  // 3. Auth: Logout
  app.post('/api/auth/logout', (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      activeSessions.delete(token);
    }
    res.json({ success: true });
  });

  // 4. Secure Data Query: Strictly isolated by user's authorized brand IDs
  app.get('/api/data', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    const db = getDatabase();
    if (!db) {
      return res.status(500).json({ error: 'Database belum terinisialisasi.' });
    }

    const user = req.user;
    const allowed = req.allowedBrandIds || [];
    const isSuperAdmin = user.role === 'super_admin';
    const isTranspAdmin = user.role === 'admin';

    // Filter brands strictly:
    const scopedBrands = (db.brands || []).filter((b: any) => {
      if (isSuperAdmin || isTranspAdmin) return true;
      return allowed.includes(b.id);
    });

    // Filter transactions:
    const scopedTransactions = (db.transactions || []).filter((t: any) => {
      if (t.isDeleted) return false;
      if (isSuperAdmin || isTranspAdmin) return true;
      return allowed.includes(t.brandId);
    });

    // Filter assets:
    const scopedAssets = (db.assets || []).filter((a: any) => {
      if (isSuperAdmin || isTranspAdmin) return true;
      return a.workspaceId === user.workspaceId || (a.brandId && allowed.includes(a.brandId));
    });

    // Filter orders:
    const scopedOrders = (db.orders || []).filter((o: any) => {
      if (isSuperAdmin || isTranspAdmin) return true;
      return allowed.includes(o.brandId);
    });

    // Filter products:
    const scopedProducts = (db.products || []).filter((p: any) => {
      if (isSuperAdmin || isTranspAdmin) return true;
      return allowed.includes(p.brandId);
    });

    // Filter HPP recipes:
    const scopedHpp = (db.hppRecipes || []).filter((h: any) => {
      if (isSuperAdmin || isTranspAdmin) return true;
      return allowed.includes(h.brandId);
    });

    // Filter KOLs:
    const scopedKols = (db.kols || []).filter((k: any) => {
      if (isSuperAdmin || isTranspAdmin) return true;
      return allowed.includes(k.brandId);
    });

    // Filter KOL recaps:
    const scopedKolRecaps = (db.kolRecaps || []).filter((r: any) => {
      if (isSuperAdmin || isTranspAdmin) return true;
      return allowed.includes(r.brandId);
    });

    // Filter team members:
    const scopedTeam = (db.teamMembers || []).filter((m: any) => {
      if (isSuperAdmin || isTranspAdmin) return true;
      return m.workspaceId === user.workspaceId || (m.brandId && allowed.includes(m.brandId));
    });

    // Filter tasks:
    const scopedTasks = (db.tasks || []).filter((t: any) => {
      if (isSuperAdmin || isTranspAdmin) return true;
      return allowed.includes(t.brandId);
    });

    // Filter payroll recaps:
    const scopedPayrolls = (db.payrollRecaps || []).filter((p: any) => {
      if (isSuperAdmin || isTranspAdmin) return true;
      return allowed.includes(p.brandId);
    });

    // Filter worksheets:
    const scopedWorksheets = (db.worksheets || []).filter((w: any) => {
      if (isSuperAdmin || isTranspAdmin) return true;
      return allowed.includes(w.brandId);
    });

    // Filter marketing campaigns:
    const scopedMarketing = (db.marketing || []).filter((m: any) => {
      if (isSuperAdmin || isTranspAdmin) return true;
      return allowed.includes(m.brandId);
    });

    // Filter notifications:
    const scopedNotifications = (db.notifications || []).filter((n: any) => {
      if (isSuperAdmin) return true;
      if (isTranspAdmin) return n.workspaceId === 'ws_admin';
      return n.workspaceId === user.workspaceId;
    });

    res.json({
      success: true,
      brands: scopedBrands,
      transactions: scopedTransactions,
      assets: scopedAssets,
      orders: scopedOrders,
      products: scopedProducts,
      hppRecipes: scopedHpp,
      kols: scopedKols,
      kolRecaps: scopedKolRecaps,
      teamMembers: scopedTeam,
      tasks: scopedTasks,
      payrollRecaps: scopedPayrolls,
      worksheets: scopedWorksheets,
      marketing: scopedMarketing,
      notifications: scopedNotifications,
      readOnly: isTranspAdmin,
    });
  });

  // 5. Secure Mutation: Transaction Add / Update / Delete
  app.post('/api/transactions', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Akses Ditolak: Akun pengawas Baliyoutevolution bersifat read-only.' });
    }

    const { brandId, type, category, description, amount, assetId, paymentMethod, date, time } = req.body;
    if (!brandId || !req.allowedBrandIds?.includes(brandId)) {
      return res.status(403).json({ error: 'Akses Ditolak: Anda tidak memiliki izin untuk brand ini.' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Nominal transaksi harus lebih dari 0.' });
    }

    const db = getDatabase();
    if (!db) return res.status(500).json({ error: 'Database belum siap.' });

    const newTx = {
      ...req.body,
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      workspaceId: user.workspaceId,
      createdBy: user.id,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      isDeleted: false,
    };

    db.transactions = [newTx, ...(db.transactions || [])];
    saveDatabase(db);

    res.json({ success: true, transaction: newTx });
  });

  // Serve Vite in development or static in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BizFlow Secure Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
