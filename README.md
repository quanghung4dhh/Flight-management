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

---
# Các câu truy vấn sử dụng

## 1. Đăng nhập / Xác thực

```sql
-- Tìm tài khoản theo username (auth-router.ts)
SELECT * FROM Accounts WHERE Username = ? LIMIT 1;
```

---

## 2. Tìm kiếm chuyến bay

```sql
-- Tìm route theo sân bay đi/đến (flightRouter.ts - search)
SELECT * FROM Route 
WHERE DepartureAirportID = ? AND ArrivalAirportID = ? 
LIMIT 1;

-- Tìm chuyến bay theo route + ngày + status
SELECT * FROM Flight 
WHERE RouteID = ? 
  AND ScheduledDeparture BETWEEN ? AND ? 
  AND Status = 'scheduled'
ORDER BY ScheduledDeparture;

-- Lấy giá vé theo chuyến bay + hạng ghế
SELECT * FROM FlightPricing 
WHERE FlightID = ? AND SeatClassID = ? 
LIMIT 1;
```

---

## 3. Lấy danh sách ghế

```sql
-- Lấy ghế của máy bay + tên hạng ghế
SELECT Seat.SeatID, Seat.SeatNumber, Seat.SeatClassID, SeatClass.Name
FROM Seat
INNER JOIN SeatClass ON Seat.SeatClassID = SeatClass.SeatClassID
WHERE Seat.AircraftID = ?;

-- Kiểm tra ghế đã đặt (loại trừ cancelled)
SELECT SeatID FROM Ticket 
WHERE FlightID = ? AND Status != 'cancelled';
```

---

## 4. Đặt vé (Transaction)

```sql
-- Tạo booking
INSERT INTO Booking (BookingID, CustomerID, BookDate, TotalAmount, Status)
VALUES (?, ?, NOW(), ?, 'pending');

-- Tạo ticket
INSERT INTO Ticket (TicketID, BookingID, FlightID, SeatID, Status, PassengerName, PassengerPassport, PurchasedPrice)
VALUES (?, ?, ?, ?, 'active', ?, ?, ?);
```

---

## 5. Thanh toán

```sql
-- Tạo payment
INSERT INTO Payment (PaymentID, TransactionID, BookingID, PayDate, Method, Status)
VALUES (?, ?, ?, NOW(), ?, 'pending');

-- Xác nhận thanh toán
UPDATE Payment SET Status = 'paid' WHERE PaymentID = ?;
UPDATE Booking SET Status = 'confirmed' WHERE BookingID = ?;
```

---

## 6. Lịch sử đặt vé (My Bookings)

```sql
-- Lấy booking của user + đếm số vé + thông tin chuyến bay
SELECT b.*, COUNT(t.TicketID) as passengerCount
FROM Booking b
LEFT JOIN Ticket t ON b.BookingID = t.BookingID
WHERE b.CustomerID = ?
GROUP BY b.BookingID
ORDER BY b.CreatedAt DESC;
```

---

## 7. Hủy vé

```sql
-- Cập nhật booking
UPDATE Booking SET Status = 'cancelled' WHERE BookingID = ?;

-- Cập nhật tickets
UPDATE Ticket SET Status = 'cancelled' WHERE BookingID = ?;
```

---

## 8. Dashboard Admin — Thống kê

```sql
-- Tổng số chuyến bay
SELECT COUNT(*) FROM Flight;

-- Tổng số đặt vé
SELECT COUNT(*) FROM Booking;

-- Tổng số người dùng
SELECT COUNT(*) FROM Accounts;

-- Tổng doanh thu
SELECT COALESCE(SUM(b.TotalAmount), 0)
FROM Payment p
INNER JOIN Booking b ON p.BookingID = b.BookingID
WHERE p.Status = 'paid';
```

---

## 9. Báo cáo doanh thu theo ngày

```sql
SELECT DATE(PayDate) as date, 
       COALESCE(SUM(b.TotalAmount), 0) as total,
       COUNT(*) as count
FROM Payment p
INNER JOIN Booking b ON p.BookingID = b.BookingID
WHERE p.Status = 'paid'
  AND PayDate BETWEEN ? AND ?
GROUP BY DATE(PayDate)
ORDER BY DATE(PayDate);
```

---

## 10. Quản lý chuyến bay (Admin)

```sql
-- Danh sách chuyến bay có phân trang
SELECT * FROM Flight 
ORDER BY ScheduledDeparture DESC
LIMIT ? OFFSET ?;
```

---

## 11. Quản lý đặt vé (Admin)

```sql
-- Danh sách booking có phân trang + filter status
SELECT * FROM Booking 
WHERE Status = ?
ORDER BY CreatedAt DESC
LIMIT ? OFFSET ?;
```

---

## 12. Danh sách sân bay

```sql
SELECT * FROM Airport ORDER BY IATACode;
```

---

## 13. Tìm kiếm sân bay

```sql
SELECT * FROM Airport
WHERE IATACode LIKE ? OR City LIKE ? OR AirportID LIKE ?
LIMIT 10;
```

---

## 14. Profile người dùng

```sql
-- Lấy thông tin account + customer
SELECT a.*, c.*
FROM Accounts a
LEFT JOIN Customers c ON a.AccountID = c.AccountID
WHERE a.AccountID = ?;
```

---

## 15. Cập nhật profile

```sql
UPDATE Customers 
SET Name = ?, Phone = ?, Email = ?, Passport = ?, Address = ?, Birthday = ?
WHERE AccountID = ?;
```

---

## Tóm tắt theo loại

| Loại | Số lượng | Ví dụ |
|------|----------|-------|
| **SELECT** | 9 | Tìm chuyến bay, lịch sử vé, thống kê |
| **INSERT** | 4 | Đặt vé, thanh toán, tạo tài khoản |
| **UPDATE** | 4 | Hủy vé, xác nhận thanh toán, cập nhật profile |
| **COUNT/SUM** | 2 | Dashboard, báo cáo doanh thu |

---


