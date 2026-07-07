require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = Number(process.env.PORT || 5000);
const JSON_LIMIT = process.env.JSON_LIMIT || "100mb";
const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, "data");
const BACKUP_DIR = path.join(ROOT_DIR, "backups");
const DB_FILE = path.join(DATA_DIR, "db.json");
const ADMIN_DIR = path.join(ROOT_DIR, "public", "admin");
const SHOP_DIR = path.join(ROOT_DIR, "public", "shop");

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(BACKUP_DIR, { recursive: true });

const corsOrigins = String(process.env.CORS_ORIGINS || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(morgan("tiny"));
app.use(cors({
  origin(origin, callback) {
    if (!origin || corsOrigins.length === 0 || corsOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS không cho phép domain: ${origin}`));
  }
}));
app.use(express.json({ limit: JSON_LIMIT }));

function defaultDb() {
  return { revision: 0, updatedAt: "", updatedBy: "", data: {} };
}

function readDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const init = defaultDb();
      fs.writeFileSync(DB_FILE, JSON.stringify(init, null, 2), "utf8");
      return init;
    }
    const raw = fs.readFileSync(DB_FILE, "utf8");
    if (!raw.trim()) return defaultDb();
    const db = JSON.parse(raw);
    return {
      revision: Number(db.revision || 0),
      updatedAt: db.updatedAt || "",
      updatedBy: db.updatedBy || "",
      data: db.data && typeof db.data === "object" ? db.data : {}
    };
  } catch (error) {
    console.error("Read DB error:", error);
    return defaultDb();
  }
}

function writeBackup(db) {
  try {
    if (!db || !db.revision) return;
    const name = `backup-rev-${String(db.revision).padStart(6, "0")}-${Date.now()}.json`;
    fs.writeFileSync(path.join(BACKUP_DIR, name), JSON.stringify(db, null, 2), "utf8");
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.endsWith(".json"))
      .map(file => ({ file, time: fs.statSync(path.join(BACKUP_DIR, file)).mtimeMs }))
      .sort((a, b) => b.time - a.time);
    files.slice(80).forEach(item => fs.rmSync(path.join(BACKUP_DIR, item.file), { force: true }));
  } catch (error) {
    console.warn("Backup error:", error.message);
  }
}

function writeDb(data, updatedBy = "unknown") {
  const oldDb = readDb();
  writeBackup(oldDb);
  const db = {
    revision: Number(oldDb.revision || 0) + 1,
    updatedAt: new Date().toISOString(),
    updatedBy,
    data: data && typeof data === "object" ? data : {}
  };
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf8");
  return db;
}

app.get("/api/health", (req, res) => {
  const db = readDb();
  res.json({
    ok: true,
    message: "HL Web All-in-One đang chạy. Máy A sửa máy B sẽ thấy khi cùng mở link này.",
    shop: "/",
    admin: "/admin/",
    api: "/api/data",
    revision: db.revision,
    updatedAt: db.updatedAt,
    time: new Date().toISOString()
  });
});

app.get("/api/data", (req, res) => {
  const db = readDb();
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.json({ ok: true, revision: db.revision, updatedAt: db.updatedAt, updatedBy: db.updatedBy, data: db.data || {} });
});

app.put("/api/data", (req, res) => {
  const payload = req.body || {};
  const data = payload.data && typeof payload.data === "object" ? payload.data : payload;
  const updatedBy = payload.clientId || payload.updatedBy || req.ip || "unknown";
  const db = writeDb(data, updatedBy);
  res.json({ ok: true, message: "Đã lưu dữ liệu chung", revision: db.revision, updatedAt: db.updatedAt, updatedBy: db.updatedBy });
});

app.post("/api/reset", (req, res) => {
  const db = writeDb({}, req.body?.clientId || "reset");
  res.json({ ok: true, message: "Đã reset dữ liệu chung", revision: db.revision, updatedAt: db.updatedAt });
});

app.get("/api/backups", (req, res) => {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(file => file.endsWith(".json"))
    .map(file => {
      const stat = fs.statSync(path.join(BACKUP_DIR, file));
      return { file, size: stat.size, updatedAt: stat.mtime.toISOString() };
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  res.json({ ok: true, backups: files });
});

app.get("/api/backups/:file", (req, res) => {
  const safeName = path.basename(req.params.file);
  const file = path.join(BACKUP_DIR, safeName);
  if (!fs.existsSync(file)) return res.status(404).json({ ok: false, message: "Không tìm thấy backup" });
  res.download(file);
});


// ===== API mở rộng cho web bán hàng chuyên nghiệp =====
function getCollection(name) {
  const db = readDb();
  const data = db.data || {};
  if (!Array.isArray(data[name])) data[name] = [];
  return { db, data, list: data[name] };
}
function saveCollection(name, list, updatedBy = 'api') {
  const db = readDb();
  const data = db.data || {};
  data[name] = Array.isArray(list) ? list : [];
  return writeDb(data, updatedBy);
}
function nextId(list) {
  return Math.max(0, ...list.map(x => Number(x.id || 0)).filter(Boolean)) + 1;
}
function matchText(item, q) {
  if (!q) return true;
  return JSON.stringify(item || {}).toLowerCase().includes(String(q).toLowerCase());
}

app.get('/api/summary', (req, res) => {
  const data = readDb().data || {};
  const products = data.products || [];
  const orders = data.orders || [];
  const contacts = data.contacts || [];
  const revenue = orders.reduce((sum, o) => sum + Number(o.total || o.totalPrice || 0), 0);
  res.json({ ok: true, summary: {
    products: products.length,
    activeProducts: products.filter(p => p.isActive !== false).length,
    orders: orders.length,
    contacts: contacts.length,
    revenue,
    lowStock: products.filter(p => Number(p.stock || 0) <= Number(p.minStock || 3)).length
  }});
});

['products','categories','brands','banners','orders','customers','contacts','reviews','warranties','coupons','buildPcPresets','suppliers','menus','pages','settings','news'].forEach(collection => {
  app.get(`/api/${collection}`, (req, res) => {
    const { list } = getCollection(collection);
    let rows = list.filter(x => matchText(x, req.query.q));
    if (req.query.status) rows = rows.filter(x => String(x.status || '').toLowerCase() === String(req.query.status).toLowerCase());
    if (req.query.category) rows = rows.filter(x => String(x.category || '').toLowerCase().includes(String(req.query.category).toLowerCase()));
    if (req.query.active === 'true') rows = rows.filter(x => x.isActive !== false);
    res.json({ ok: true, total: rows.length, data: rows });
  });

  app.get(`/api/${collection}/:id`, (req, res) => {
    const { list } = getCollection(collection);
    const item = list.find(x => String(x.id) === String(req.params.id));
    if (!item) return res.status(404).json({ ok: false, message: 'Không tìm thấy dữ liệu' });
    res.json({ ok: true, data: item });
  });

  app.post(`/api/${collection}`, (req, res) => {
    const { list } = getCollection(collection);
    const item = { id: req.body.id || nextId(list), ...req.body, createdAt: req.body.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() };
    list.unshift(item);
    saveCollection(collection, list, req.body.updatedBy || 'api-create');
    res.json({ ok: true, message: 'Đã thêm dữ liệu', data: item });
  });

  app.put(`/api/${collection}/:id`, (req, res) => {
    const { list } = getCollection(collection);
    const idx = list.findIndex(x => String(x.id) === String(req.params.id));
    if (idx < 0) return res.status(404).json({ ok: false, message: 'Không tìm thấy dữ liệu' });
    list[idx] = { ...list[idx], ...req.body, id: list[idx].id, updatedAt: new Date().toISOString() };
    saveCollection(collection, list, req.body.updatedBy || 'api-update');
    res.json({ ok: true, message: 'Đã cập nhật dữ liệu', data: list[idx] });
  });

  app.delete(`/api/${collection}/:id`, (req, res) => {
    const { list } = getCollection(collection);
    const next = list.filter(x => String(x.id) !== String(req.params.id));
    saveCollection(collection, next, req.body?.updatedBy || 'api-delete');
    res.json({ ok: true, message: 'Đã xóa dữ liệu' });
  });
});

app.post('/api/orders/:id/status', (req, res) => {
  const { list } = getCollection('orders');
  const idx = list.findIndex(x => String(x.id) === String(req.params.id));
  if (idx < 0) return res.status(404).json({ ok: false, message: 'Không tìm thấy đơn hàng' });
  list[idx].status = req.body.status || list[idx].status || 'Mới';
  list[idx].updatedAt = new Date().toISOString();
  saveCollection('orders', list, 'order-status');
  res.json({ ok: true, data: list[idx] });
});

app.get('/api/export/full', (req, res) => {
  const db = readDb();
  res.setHeader('Content-Disposition', `attachment; filename="hl-export-${Date.now()}.json"`);
  res.json(db);
});

app.post('/api/import/full', (req, res) => {
  const payload = req.body || {};
  const data = payload.data && typeof payload.data === 'object' ? payload.data : payload;
  const db = writeDb(data, 'import-full');
  res.json({ ok: true, message: 'Đã import dữ liệu', revision: db.revision });
});

// Web bán hàng: /
app.use("/", express.static(SHOP_DIR, { etag: false, maxAge: 0 }));

// Admin: /admin/
app.use("/admin", express.static(ADMIN_DIR, { etag: false, maxAge: 0 }));
app.get("/admin", (req, res) => res.redirect("/admin/"));

// Fallback cho shop
app.get("*", (req, res) => {
  if (req.path.startsWith("/admin")) return res.sendFile(path.join(ADMIN_DIR, "index.html"));
  return res.sendFile(path.join(SHOP_DIR, "index.html"));
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ ok: false, message: error.message || "Lỗi server" });
});

app.listen(PORT, () => {
  console.log(`HL Web All-in-One đang chạy tại http://localhost:${PORT}`);
  console.log(`Web bán hàng: http://localhost:${PORT}/`);
  console.log(`Admin: http://localhost:${PORT}/admin/`);
  console.log(`API: http://localhost:${PORT}/api/health`);
});
