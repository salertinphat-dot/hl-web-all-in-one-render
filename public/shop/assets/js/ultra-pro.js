const API_BASE = window.HL_SHOP_API_BASE || window.HL_API_BASE || '/api';
let db = { products: [], orders: [] };
let selectedCategory = 'ALL';
let cart = JSON.parse(localStorage.getItem('hlUltraCart') || '[]');
let compare = JSON.parse(localStorage.getItem('hlUltraCompare') || '[]');
let buildBudget = 15000000;

const sampleProducts = [
  { id: 910001, name: 'PC HL Gaming Core i5 RTX 4060', category: 'PC', brand: 'HL', price: 19990000, salePrice: 18490000, stock: 8, sku: 'HL-PC-I5-4060', description: 'Bộ PC gaming cân tốt eSport, học tập, làm việc đồ họa nhẹ. Bảo hành rõ ràng, lắp ráp tối ưu luồng gió.', isActive: true },
  { id: 910002, name: 'RAM Kingston Fury Beast 16GB DDR4 3200MHz', category: 'RAM', brand: 'Kingston', price: 890000, salePrice: 790000, stock: 24, sku: 'KF432C16BB/16', description: 'RAM DDR4 16GB bus 3200MHz, ổn định cho nâng cấp máy văn phòng và gaming phổ thông.', isActive: true },
  { id: 910003, name: 'SSD Kingston NV2 1TB NVMe PCIe 4.0', category: 'SSD', brand: 'Kingston', price: 1690000, salePrice: 1450000, stock: 18, sku: 'SNV2S/1000G', description: 'SSD NVMe dung lượng 1TB, tốc độ cao, khởi động Windows và phần mềm nhanh hơn rõ rệt.', isActive: true },
  { id: 910004, name: 'Nguồn HL ATX 550W 80 Plus Bronze', category: 'Nguồn', brand: 'HL', price: 780000, salePrice: 690000, stock: 15, sku: 'HL-ATX550-BR', description: 'Nguồn máy tính chuẩn 80 Plus Bronze, phù hợp PC văn phòng, gaming phổ thông, hoạt động ổn định.', isActive: true },
  { id: 910005, name: 'Màn hình Acer EK221Q E3 21.5 inch 100Hz', category: 'Màn hình', brand: 'Acer', price: 2150000, salePrice: 1990000, stock: 10, sku: 'EK221Q-E3', description: 'Màn hình Full HD 100Hz, phù hợp văn phòng, học tập, bán hàng, camera và giải trí cơ bản.', isActive: true },
  { id: 910006, name: 'VGA ASUS Dual GeForce RTX 4060 OC 8GB', category: 'VGA', brand: 'ASUS', price: 8990000, salePrice: 8290000, stock: 7, sku: 'DUAL-RTX4060-O8G', description: 'Card đồ họa RTX 4060 cho gaming 1080p, AI, dựng hình, render nhẹ và streaming.', isActive: true },
  { id: 910007, name: 'CPU Intel Core i5-12400 Box Chính Hãng', category: 'CPU', brand: 'Intel', price: 3890000, salePrice: 3650000, stock: 8, sku: 'BX8071512400', description: 'CPU 6 nhân 12 luồng, hiệu năng tốt cho máy văn phòng cao cấp, gaming và đồ họa cơ bản.', isActive: true },
  { id: 910008, name: 'Mainboard ASUS PRIME H610M-K D4', category: 'Mainboard', brand: 'ASUS', price: 2190000, salePrice: 2050000, stock: 7, sku: 'PRIME-H610M-K-D4', description: 'Mainboard H610 hỗ trợ Intel Gen 12/13, RAM DDR4, phù hợp build PC tiết kiệm ổn định.', isActive: true },
  { id: 910009, name: 'Laptop văn phòng Core i5 RAM 16GB SSD 512GB', category: 'Laptop', brand: 'HL Select', price: 13990000, salePrice: 12490000, stock: 5, sku: 'HL-LAP-I5-16-512', description: 'Laptop văn phòng cấu hình cân đối, phù hợp học tập, kế toán, bán hàng, làm việc từ xa.', isActive: true },
  { id: 910010, name: 'Combo nâng cấp RAM 16GB + SSD 500GB', category: 'Combo', brand: 'HL Combo', price: 2190000, salePrice: 1890000, stock: 12, sku: 'HL-COMBO-RAMSSD', description: 'Combo nâng cấp giúp máy cũ chạy nhanh hơn, phù hợp máy tính văn phòng và laptop đời cũ.', isActive: true }
];

const money = n => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(n || 0));
const esc = s => String(s ?? '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
const catOf = p => p.category || p.group || p.type || 'Khác';
const brandOf = p => p.brand || p.manufacturer || 'HL Select';
const priceOf = p => Number(p.salePrice || p.price || p.sellPrice || 0);
const visible = p => p && p.isActive !== false && String(p.status || '').toLowerCase() !== 'hidden';

function iconFor(text = '') {
  const s = String(text).toLowerCase();
  if (s.includes('ram')) return '🧠';
  if (s.includes('ssd') || s.includes('ổ cứng') || s.includes('hdd')) return '💾';
  if (s.includes('nguồn') || s.includes('psu')) return '⚡';
  if (s.includes('màn')) return '🖥️';
  if (s.includes('vga') || s.includes('gpu') || s.includes('rtx') || s.includes('geforce')) return '🎮';
  if (s.includes('cpu') || s.includes('core') || s.includes('ryzen')) return '🧩';
  if (s.includes('main')) return '🔌';
  if (s.includes('laptop')) return '💻';
  if (s.includes('combo')) return '🎁';
  if (s.includes('pc')) return '🖥️';
  return '📦';
}

function setSync(text, ok = true) {
  const el = document.getElementById('syncDot');
  if (!el) return;
  el.textContent = text;
  el.style.background = ok ? '#052e16' : '#7f1d1d';
  el.style.color = ok ? '#bbf7d0' : '#fecaca';
}

function productsSource() {
  const real = Array.isArray(db.products) ? db.products.filter(visible) : [];
  return real.length ? real : sampleProducts;
}

function categories() {
  const map = new Map();
  productsSource().forEach(p => map.set(catOf(p), (map.get(catOf(p)) || 0) + 1));
  return [['ALL', productsSource().length], ...Array.from(map.entries())];
}

function brands() {
  const map = new Map();
  productsSource().forEach(p => map.set(brandOf(p), (map.get(brandOf(p)) || 0) + 1));
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
}

function safeArg(v) { return String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }

async function loadData(show = false) {
  try {
    const res = await fetch(`${API_BASE}/data?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('API không phản hồi');
    const json = await res.json();
    db = json.data || {};
    if (!Array.isArray(db.products)) db.products = [];
    if (!Array.isArray(db.orders)) db.orders = [];
    setSync(`🟢 Dữ liệu chung · Rev ${json.revision || 0}`, true);
    renderAll();
    if (show) toast('Đã tải lại dữ liệu mới từ server');
  } catch (error) {
    console.warn(error);
    db = { products: [], orders: [] };
    setSync('🔴 Chưa kết nối API chung', false);
    renderAll();
  }
}

function renderCategories() {
  const list = categories();
  const html = list.map(([c, n]) => `
    <button class="category-row ${selectedCategory === c ? 'active' : ''}" onclick="selectCategory('${safeArg(c)}')">
      <i>${c === 'ALL' ? '☰' : iconFor(c)}</i>
      <b>${c === 'ALL' ? 'Tất cả sản phẩm' : esc(c)}</b>
      <span>${n}</span>
    </button>
  `).join('');
  const catList = document.getElementById('categoryList');
  if (catList) catList.innerHTML = html;

  const tabHtml = list.slice(0, 10).map(([c, n]) => `
    <button class="quick-tab ${selectedCategory === c ? 'active' : ''}" onclick="selectCategory('${safeArg(c)}')">
      <i>${c === 'ALL' ? '💻' : iconFor(c)}</i>
      <span><b>${c === 'ALL' ? 'Tất cả' : esc(c)}</b><br><small>${n} sản phẩm</small></span>
    </button>
  `).join('');
  document.getElementById('quickTabs').innerHTML = tabHtml;

  const options = list.map(([c]) => `<option value="${esc(c)}">${c === 'ALL' ? 'Tất cả danh mục' : esc(c)}</option>`).join('');
  document.getElementById('searchCategory').innerHTML = options;
}

function renderBrands() {
  const top = brands().slice(0, 12);
  const html = top.map(([name, count]) => `<div class="brand-card">${esc(name)}<span>${count} sản phẩm</span></div>`).join('');
  document.getElementById('brandWall').innerHTML = html || '<div class="empty">Chưa có thương hiệu.</div>';
}

function selectCategory(c) {
  selectedCategory = c;
  renderAll();
  document.getElementById('productsSection')?.scrollIntoView({ behavior: 'smooth' });
}

function quickSearch(q) {
  document.getElementById('searchInput').value = q;
  document.getElementById('filterInput').value = q;
  selectedCategory = 'ALL';
  renderAll();
  document.getElementById('productsSection')?.scrollIntoView({ behavior: 'smooth' });
}

function filteredProducts() {
  const searchText = ((document.getElementById('searchInput')?.value || '') + ' ' + (document.getElementById('filterInput')?.value || '')).toLowerCase().trim();
  const searchCategory = document.getElementById('searchCategory')?.value || 'ALL';
  const sort = document.getElementById('sortSelect')?.value || 'featured';
  const priceRange = document.getElementById('priceSelect')?.value || 'all';
  let list = productsSource().filter(p => {
    const c = catOf(p);
    const price = priceOf(p);
    const matchCategory = (selectedCategory === 'ALL' || c === selectedCategory) && (searchCategory === 'ALL' || c === searchCategory);
    const matchText = !searchText || JSON.stringify(p).toLowerCase().includes(searchText);
    let matchPrice = true;
    if (priceRange === 'under2') matchPrice = price < 2000000;
    if (priceRange === '2to5') matchPrice = price >= 2000000 && price <= 5000000;
    if (priceRange === '5to10') matchPrice = price > 5000000 && price <= 10000000;
    if (priceRange === 'over10') matchPrice = price > 10000000;
    return matchCategory && matchText && matchPrice;
  });
  if (sort === 'priceAsc') list.sort((a, b) => priceOf(a) - priceOf(b));
  if (sort === 'priceDesc') list.sort((a, b) => priceOf(b) - priceOf(a));
  if (sort === 'stock') list.sort((a, b) => Number(b.stock || 0) - Number(a.stock || 0));
  if (sort === 'sale') list.sort((a, b) => Number(!!b.salePrice) - Number(!!a.salePrice));
  return list;
}

function productImage(p) {
  const img = p.imageUrl || p.imageDataUrl || p.image || p.avatar || p.photo || '';
  if (img) return `<img src="${esc(img)}" alt="${esc(p.name)}">`;
  return `<div class="product-emoji">${iconFor((p.name || '') + ' ' + catOf(p))}</div>`;
}

function productCard(p) {
  const old = Number(p.salePrice ? p.price : 0);
  const price = priceOf(p);
  const desc = p.description || p.note || p.spec || 'Sản phẩm chính hãng, bảo hành rõ ràng, hỗ trợ kỹ thuật tận tâm.';
  const id = Number(p.id);
  const isCompare = compare.includes(id);
  return `
    <article class="product-card">
      <div class="product-ribbon">${old ? 'SALE' : 'HOT'}</div>
      <div class="product-img">${productImage(p)}</div>
      <div class="product-body">
        <div class="product-name">${esc(p.name || 'Sản phẩm')}</div>
        <div class="product-desc">${esc(String(desc).slice(0, 105))}${String(desc).length > 105 ? '...' : ''}</div>
        <div class="product-chips">
          <span class="chip">${esc(catOf(p))}</span>
          <span class="chip gray">${esc(brandOf(p))}</span>
        </div>
        <div class="price-row">
          <div><div class="price">${money(price)}</div>${old ? `<div class="old-price">${money(old)}</div>` : ''}</div>
          <span class="chip gray">SKU ${esc(p.sku || p.code || 'HL')}</span>
        </div>
        <div class="stock-line">✓ Còn hàng: ${Number(p.stock || 0)} · Bảo hành tại HL</div>
        <div class="product-actions">
          <button class="btn-detail" onclick="viewProduct(${id})">Chi tiết</button>
          <button class="btn-buy" onclick="addCart(${id})">Mua ngay</button>
        </div>
        <div class="product-extra-actions">
          <button onclick="toggleCompare(${id})">${isCompare ? 'Đã so sánh' : 'So sánh'}</button>
          <button onclick="quickSearch('${safeArg(catOf(p))}')">Xem tương tự</button>
        </div>
      </div>
    </article>
  `;
}

function renderProducts() {
  const list = filteredProducts();
  const usingSample = !(Array.isArray(db.products) && db.products.filter(visible).length);
  document.getElementById('productCount').textContent = `${list.length} sản phẩm${usingSample ? ' · đang hiển thị sản phẩm mẫu khi Admin chưa đăng' : ''}`;
  document.getElementById('products').innerHTML = list.length ? list.map(productCard).join('') : '<div class="empty"><b>Không có sản phẩm nào khớp bộ lọc</b><br>Hãy đổi từ khóa hoặc vào Admin để thêm sản phẩm mới.</div>';
  renderFlashSale();
  renderBuildSuggestions();
}

function renderFlashSale() {
  const list = productsSource().filter(p => Number(p.salePrice || 0) > 0).sort((a, b) => (Number(b.price || 0) - priceOf(b)) - (Number(a.price || 0) - priceOf(a))).slice(0, 4);
  const el = document.getElementById('flashProducts');
  if (!el) return;
  el.innerHTML = list.length ? list.map(productCard).join('') : '<div class="empty">Chưa có sản phẩm khuyến mãi.</div>';
}

function renderBuildSuggestions() {
  const list = productsSource().filter(p => priceOf(p) <= buildBudget).sort((a, b) => priceOf(b) - priceOf(a)).slice(0, 5);
  document.getElementById('buildList').innerHTML = list.map(p => `
    <div class="build-item">
      <div><b>${esc(p.name)}</b><br><span style="color:#64748b;font-weight:750;font-size:12px">${esc(catOf(p))} · ${esc(brandOf(p))}</span></div>
      <span>${money(priceOf(p))}</span>
    </div>
  `).join('') || '<div class="empty">Chưa có gợi ý cấu hình.</div>';
}

function setBudget(v) {
  buildBudget = Number(v);
  document.getElementById('budgetLabel').textContent = money(buildBudget);
  renderBuildSuggestions();
}

function findProduct(id) { return productsSource().find(x => Number(x.id) === Number(id)); }

function viewProduct(id) {
  const p = findProduct(id);
  if (!p) return;
  document.getElementById('modalImg').innerHTML = productImage(p);
  document.getElementById('modalName').textContent = p.name || 'Sản phẩm';
  document.getElementById('modalChips').innerHTML = `<span class="chip">${esc(catOf(p))}</span><span class="chip gray">${esc(brandOf(p))}</span><span class="chip gray">SKU ${esc(p.sku || p.code || 'HL')}</span><span class="chip gray">Tồn ${Number(p.stock || 0)}</span>`;
  document.getElementById('modalPrice').textContent = money(priceOf(p));
  document.getElementById('modalDesc').textContent = p.description || p.note || p.spec || 'Sản phẩm chính hãng, bảo hành theo chính sách cửa hàng.';
  document.getElementById('modalAdd').textContent = 'Thêm vào giỏ';
  document.getElementById('modalAdd').onclick = () => { addCart(id); closeModal(); };
  document.getElementById('productModal').classList.add('active');
}
function closeModal() { document.getElementById('productModal').classList.remove('active'); }

function addCart(id) {
  const p = findProduct(id);
  if (!p) return;
  const item = cart.find(x => Number(x.id) === Number(id));
  if (item) item.qty += 1;
  else cart.push({ id: Number(p.id), name: p.name, price: priceOf(p), qty: 1 });
  localStorage.setItem('hlUltraCart', JSON.stringify(cart));
  renderCart();
  toast('Đã thêm vào giỏ hàng');
}

function removeCart(id) {
  cart = cart.filter(x => String(x.id) !== String(id));
  localStorage.setItem('hlUltraCart', JSON.stringify(cart));
  renderCart();
}

function changeQty(id, delta) {
  const item = cart.find(x => String(x.id) === String(id));
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) removeCart(id);
  else {
    localStorage.setItem('hlUltraCart', JSON.stringify(cart));
    renderCart();
  }
}

function renderCart() {
  const count = cart.reduce((s, x) => s + Number(x.qty || 0), 0);
  const total = cart.reduce((s, x) => s + Number(x.price || 0) * Number(x.qty || 0), 0);
  ['cartCount', 'cartCount2'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = count; });
  document.getElementById('cartItems').innerHTML = cart.length ? cart.map(i => `
    <div class="cart-item">
      <div><b>${esc(i.name)}</b><br><span style="color:#64748b;font-size:13px;font-weight:750">${money(i.price)} × ${i.qty}</span></div>
      <div style="text-align:right"><b>${money(i.price * i.qty)}</b><br><button onclick="changeQty('${esc(i.id)}',-1)" style="margin-top:8px;border:0;border-radius:10px;padding:6px 8px;font-weight:950">-</button><button onclick="changeQty('${esc(i.id)}',1)" style="margin-left:5px;border:0;border-radius:10px;padding:6px 8px;font-weight:950">+</button></div>
    </div>
  `).join('') : '<div class="empty" style="padding:22px">Giỏ hàng đang trống.</div>';
  document.getElementById('cartTotal').textContent = money(total);
}

function toggleCart(show) {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('overlay');
  const active = typeof show === 'boolean' ? show : !drawer.classList.contains('active');
  drawer.classList.toggle('active', active);
  overlay.classList.toggle('active', active);
}

async function placeOrder() {
  if (!cart.length) return alert('Giỏ hàng đang trống');
  const name = document.getElementById('customerName').value.trim();
  const phone = document.getElementById('customerPhone').value.trim();
  const address = document.getElementById('customerAddress').value.trim();
  if (!name || !phone) return alert('Bạn nhập tên và số điện thoại nha');
  try {
    const fresh = await fetch(`${API_BASE}/data?t=${Date.now()}`, { cache: 'no-store' }).then(r => r.json());
    const data = fresh.data || db;
    if (!Array.isArray(data.orders)) data.orders = [];
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const code = `HL${Date.now().toString().slice(-8)}`;
    data.orders.unshift({ id: Date.now(), orderCode: code, code, customerName: name, customerPhone: phone, customerAddress: address, phone, address, items: cart, total, status: 'PENDING', source: 'Website HL TechMart', createdAt: new Date().toISOString() });
    const put = await fetch(`${API_BASE}/data`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data, clientId: 'shop-order-' + Date.now() }) });
    if (!put.ok) throw new Error('Không lưu được đơn hàng');
    db = data;
    cart = [];
    localStorage.setItem('hlUltraCart', '[]');
    renderAll();
    toggleCart(false);
    alert(`Đã gửi đơn hàng thành công. Mã đơn: ${code}`);
  } catch (error) {
    console.warn(error);
    alert('Lỗi gửi đơn. Vui lòng kiểm tra backend/API Render.');
  }
}

function toggleCompare(id) {
  id = Number(id);
  if (compare.includes(id)) compare = compare.filter(x => x !== id);
  else {
    if (compare.length >= 3) return alert('So sánh tối đa 3 sản phẩm');
    compare.push(id);
  }
  localStorage.setItem('hlUltraCompare', JSON.stringify(compare));
  renderCompare();
  renderProducts();
}

function renderCompare() {
  const bar = document.getElementById('compareBar');
  const items = compare.map(findProduct).filter(Boolean);
  if (!items.length) return bar.classList.remove('active');
  bar.classList.add('active');
  document.getElementById('compareItems').innerHTML = items.map(p => `<span class="compare-tag">${esc(p.name).slice(0, 26)}${p.name.length > 26 ? '...' : ''}</span>`).join('');
}

function showCompare() {
  const items = compare.map(findProduct).filter(Boolean);
  if (!items.length) return;
  const rows = ['category', 'brand', 'sku', 'stock'].map(key => `
    <tr><th style="text-align:left;padding:10px;background:#f8fafc">${key}</th>${items.map(p => `<td style="padding:10px;border-bottom:1px solid #e5e7eb">${esc(p[key] || (key === 'category' ? catOf(p) : key === 'brand' ? brandOf(p) : ''))}</td>`).join('')}</tr>
  `).join('');
  const html = `<table style="width:100%;border-collapse:collapse"><tr><th></th>${items.map(p => `<th style="padding:10px;text-align:left;color:#0f172a">${esc(p.name)}</th>`).join('')}</tr><tr><th style="text-align:left;padding:10px;background:#f8fafc">Giá</th>${items.map(p => `<td style="padding:10px;color:#ef233c;font-weight:950">${money(priceOf(p))}</td>`).join('')}</tr>${rows}</table>`;
  document.getElementById('modalImg').innerHTML = '<div class="product-emoji">⚖️</div>';
  document.getElementById('modalName').textContent = 'So sánh sản phẩm';
  document.getElementById('modalChips').innerHTML = '<span class="chip">Tối đa 3 sản phẩm</span>';
  document.getElementById('modalPrice').textContent = '';
  document.getElementById('modalDesc').innerHTML = html;
  document.getElementById('modalAdd').onclick = () => { compare = []; localStorage.setItem('hlUltraCompare', '[]'); renderCompare(); closeModal(); renderProducts(); };
  document.getElementById('modalAdd').textContent = 'Xóa so sánh';
  document.getElementById('productModal').classList.add('active');
}

function lookupOrder() {
  const q = document.getElementById('lookupInput').value.trim().toLowerCase();
  const el = document.getElementById('lookupResult');
  if (!q) return el.textContent = 'Nhập mã đơn hoặc số điện thoại để tra cứu.';
  const found = (db.orders || []).filter(o => String(o.orderCode || o.code || '').toLowerCase().includes(q) || String(o.customerPhone || o.phone || '').toLowerCase().includes(q));
  el.innerHTML = found.length ? found.slice(0, 5).map(o => `<div class="build-item"><div><b>${esc(o.orderCode || o.code || o.id)}</b><br><span style="color:#64748b;font-size:12px">${esc(o.customerName || '')} · ${esc(o.status || 'PENDING')}</span></div><span>${money(o.total || o.totalPrice || 0)}</span></div>`).join('') : 'Không tìm thấy đơn hàng phù hợp.';
}

function toast(text) {
  const t = document.createElement('div');
  t.textContent = text;
  t.style.cssText = 'position:fixed;right:18px;top:18px;z-index:9999;background:#0f172a;color:#fff;padding:12px 14px;border-radius:16px;font-weight:900;box-shadow:0 18px 42px rgba(0,0,0,.22)';
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1800);
}

function renderAll() {
  renderCategories();
  renderBrands();
  renderProducts();
  renderCart();
  renderCompare();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('searchInput').addEventListener('input', renderAll);
  document.getElementById('filterInput').addEventListener('input', renderAll);
  document.getElementById('searchCategory').addEventListener('change', renderAll);
  document.getElementById('sortSelect').addEventListener('change', renderAll);
  document.getElementById('priceSelect').addEventListener('change', renderAll);
  document.getElementById('overlay').addEventListener('click', () => toggleCart(false));
  document.getElementById('budgetLabel').textContent = money(buildBudget);
  loadData();
  setInterval(() => loadData(false), 25000);
});
