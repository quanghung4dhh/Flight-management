import Header from "./Header";
import { Outlet } from "react-router";

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">SkyViet Airlines</h3>
              <p className="text-gray-400 text-sm">
                Bay cao cùng ước mơ. Đặt vé máy bay nội địa và quốc tế với giá
                tốt nhất.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4">Liên kết nhanh</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <p>Trang chủ</p>
                <p>Tìm chuyến bay</p>
                <p>Vé của tôi</p>
                <p>Hỗ trợ</p>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4">Liên hệ</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <p>Hotline: 1900 xxxx</p>
                <p>Email: support@skyviet.com</p>
                <p>Địa chỉ: Hà Nội</p>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-4 border-t border-gray-800 text-center text-sm text-gray-500">
            SkyViet Airlines. Group 7 - HUST.
          </div>
        </div>
      </footer>
    </div>
  );
}
