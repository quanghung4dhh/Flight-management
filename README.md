# SkyViet Airlines - Flight Management System

## Giới thiệu

Hệ thống quản lý chuyến bay SkyViet Airlines - Đồ án đại học môn Kỹ thuật phần mềm ứng dụng.

## Deployed URL

Frontend: Đang cập nhật

## Cách chạy local

### 1. Cài đặt các gói bắt buộc
1. Git
2. Node.js
3. MySQL

### 2. Clone và cài đặt các module

```bash
git clone https://github.com/quanghung4dhh/Flight-management/
cd Flight-management
npm install
```

### 3. Setup database và biến môi trường

1. Tạo database
```bash
mysql -u root -p
```
```mysql
CREATE DATABASE FlightManagement;
-- hoặc tên khác, nhớ khớp với DB_NAME trong .env
EXIT;
```
2. Tạo file `.env` cùng cấp với `package.json` <br>

```python
DATABASE_URL=mysql://root:<password>@localhost:3306/FlightManagement
JWT_SECRET=your-secret-key-at-least-32-characters-long


DB_HOST=localhost
DB_USER=root
DB_PASSWORD=<password>
DB_NAME=FlightManagement
DB_PORT=3306
```
Trong đó `<password>` là mật khẩu mysql. Các trường `DB_USER`, `DB_NAME` có thể thay đổi nếu đã đặt khác
### 4. Push schema và seed data

```bash
npm run db:push
```

### 5. Chạy development server

```bash
npm run dev
```

Server sẽ chạy tại http://localhost:5173

### 6. Seed demo data

Khi vào trang chủ, click nút "Initialize Demo Data" để tạo dữ liệu mẫu (sân bay, chuyến bay, máy bay, phi hành đoàn).
Database sẽ được tạo sẵn các tài khoản
1. Tài khoản admin: admin admin123
2. Tài khoản test: test test123


## Chức năng chính

### Customer Portal

- Tìm kiếm chuyến bay theo tuyến, ngày, hạng vé
- Đặt vé và chọn ghế ngồi
- Thanh toán giả lập (Credit Card, Momo, ZaloPay, QR Code)
- Xem lịch sử đặt vé
- Quản lý hồ sơ cá nhân
- Đa ngôn ngữ (Tiếng Việt / English)

### Admin Portal

- Dashboard với biểu đồ doanh thu
- Quản lý chuyến bay (CRUD)
- Quản lý sân bay
- Quản lý máy bay
- Quản lý đặt vé
- Quản lý khách hàng
- Báo cáo doanh thu


## Tech Stack

- Frontend: React 19 + TypeScript + Tailwind CSS + shadcn/ui
- Backend: tRPC + Drizzle ORM + Hono + MySQL
- Charts: Recharts
- i18n: react-i18next

## Thành viên nhóm: Nhóm 7
1. Đinh Quang Hùng 20232486
2. Nguyễn Công Khanh 20213968
3. Lê Quang Tuấn 20233696


## Ghi chú

- Thanh toán được giả lập (simulated), không có tích hợp thật
- Admin được phân quyền tự động cho user có role="admin"
