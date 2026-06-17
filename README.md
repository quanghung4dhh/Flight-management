# SkyViet Airlines - Flight Management System

## Gioi thieu
He thong quan ly chuyen bay SkyViet Airlines - Do an dai hoc mon He Quan Tri CSDL.

## Deployed URL
Frontend: https://4mp2w2kjd6kbc.kimi.page

## Cach chay local (Fullstack)

### 1. Cai dat dependencies
```bash
cd /mnt/agents/output/app
npm install
```

### 2. Setup database
Dam bao MySQL dang chay va DATABASE_URL trong file .env da duoc cau hinh dung.

### 3. Push schema va seed data
```bash
npm run db:push
```

### 4. Chay development server
```bash
npm run dev
```

Server se chay tai http://localhost:3000

### 5. Seed demo data
Khi vao trang chu, click nut "Initialize Demo Data" de tao du lieu mau (san bay, chuyen bay, may bay, phi hanh doan).

## Chuc nang chinh

### Customer Portal
- Tim kiem chuyen bay theo tuyen, ngay, hang ve
- Dat ve va chon ghe ngoi
- Thanh toan gia lap (Credit Card, Momo, ZaloPay, QR Code)
- Xem lich su dat ve
- Quan ly ho so ca nhan
- Da ngon ngu (Tieng Viet / English)

### Admin Portal
- Dashboard voi bieu do doanh thu
- Quan ly chuyen bay (CRUD)
- Quan ly san bay
- Quan ly may bay
- Quan ly dat ve
- Quan ly khach hang
- Bao cao doanh thu

### Crew & Maintenance (co ban)
- Quan ly thanh vien phi hanh doan
- Lich bao tri may bay

## Tech Stack
- Frontend: React 19 + TypeScript + Tailwind CSS + shadcn/ui
- Backend: tRPC + Drizzle ORM + Hono + MySQL
- Auth: Kimi OAuth 2.0
- Charts: Recharts
- i18n: react-i18next

## Thanh vien nhom
- Nhom 7

## Ghi chu
- Thanh toan duoc gia lap (simulated), khong co tich hop that
- Auth su dung Kimi OAuth - can dang nhap qua Kimi account
- Admin duoc phan quyen tu dong cho user co role="admin"
