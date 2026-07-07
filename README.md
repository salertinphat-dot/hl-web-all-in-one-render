# HL Web All-in-One Render - Original TechMart UI

Bản này gồm:
- `/` web bán hàng giao diện mới, không copy nguyên mẫu ngoài, chỉ lấy cảm hứng shop linh kiện Việt Nam.
- `/admin/` giữ nguyên giao diện admin gốc.
- `/api/data` API đồng bộ dữ liệu chung.

Chạy local:
```bash
npm install
npm run dev
```

Mở:
- Web bán hàng: http://localhost:5000/
- Admin: http://localhost:5000/admin/
- API: http://localhost:5000/api/health

Tài khoản admin:
- Email: admin@hl.com
- Mật khẩu: Admin@123456

Deploy Render:
- Build Command: npm install
- Start Command: npm start

Máy A thêm/sửa sản phẩm trong Admin, máy B mở web bán hàng và reload sẽ thấy dữ liệu mới.


## Ultra Pro UI

Bản này đã nâng cấp giao diện web bán hàng lên phong cách siêu thị linh kiện máy tính chuyên nghiệp: header lớn, banner hero, quảng cáo 2 bên, flash sale, bộ lọc, Build PC, so sánh sản phẩm, tra cứu đơn hàng và giỏ hàng. Admin vẫn giữ giao diện gốc.
