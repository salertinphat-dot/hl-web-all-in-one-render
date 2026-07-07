// API đồng bộ dữ liệu chung cho web bán hàng.
// Khi chạy online chung trên Render, tự dùng cùng domain: https://ten-web.onrender.com/api
// Khi mở file local hoặc chạy localhost, tự dùng http://localhost:5000/api
(function () {
  const isLocalFile = window.location.protocol === "file:";
  const isLocalHost = ["localhost", "127.0.0.1", ""].includes(window.location.hostname);
  window.HL_SHOP_API_BASE = (isLocalFile || isLocalHost)
    ? "http://localhost:5000/api"
    : `${window.location.origin}/api`;
  window.HL_API_BASE = window.HL_SHOP_API_BASE;
})();
