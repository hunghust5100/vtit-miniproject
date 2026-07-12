# VTIT Asset Management System - Mini Project

Dự án Mini Project thuộc chương trình **Viettel Digital Talent (VDT)**. Đây là Hệ thống Quản lý Tài sản VTIT tích hợp Chatbot AI hỗ trợ truy vấn tự động bằng ngôn ngữ tự nhiên thông qua chuyển đổi Text-to-SQL.

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

### 1. Backend
- **Java**: Version 25 (OpenJDK)
- **Framework**: Spring Boot 4.0.6 (với Spring Security, Spring Data JPA, Spring AI)
- **AI Integration**: Spring AI Starter Model OpenAI (kết nối qua API Gemini hoặc OpenAI)
- **Vector Database**: pgvector (PostgreSQL 17)
- **Build Tool**: Gradle 9+

### 2. Frontend
- **Framework**: React 19.2.6
- **Build Tool / Bundler**: Vite 8.0.12, TypeScript 6.0.2
- **Thư viện chính**: React Router DOM 7.18.0, Axios 1.18.1, Lucide React (Icons)
- **Styling**: Vanilla CSS (tối ưu hóa giao diện hiện đại, responsive)

---

## 🚀 Hướng dẫn cài đặt và chạy ứng dụng

Trước khi bắt đầu, hãy sao chép file cấu hình môi trường `.envExample` thành `.env` ở thư mục gốc của dự án và điền đầy đủ các thông tin cấu hình (như `DB_PASSWORD`, `JWT_SECRET`, `OPENAI_API_KEY`...).

```bash
cp .envExample .env
```

### Cách 1: Chạy trực tiếp trên máy local (Nếu chạy thủ công)

#### 1. Cấu hình Database
- Đảm bảo bạn đã cài đặt **PostgreSQL 17** trở lên và đã cài extension **pgvector**.
- Tạo cơ sở dữ liệu có tên trùng với `DB_NAME` trong cấu hình `.env` (mặc định là `vtit`).
- Khởi tạo extension `vector` bằng cách chạy script trong file `init.sql`:
  ```sql
  CREATE EXTENSION IF NOT EXISTS vector;
  ```

#### 2. Chạy Backend (Spring Boot)
- Di chuyển vào thư mục backend và chạy ứng dụng thông qua Gradle:
  ```bash
  cd backend/vtit
  ./gradlew bootRun
  ```
- Ứng dụng Backend sẽ chạy tại cổng được cấu hình bởi `SERVER_PORT` (mặc định là `http://localhost:8080`).

#### 3. Chạy Frontend (React + Vite)
- Di chuyển vào thư mục frontend:
  ```bash
  cd frontend/app
  ```
- Cấu hình file `.env` nếu cần thiết (biến `VITE_API_URL` trỏ về API Backend, mặc định là `http://localhost:8080`).
- Cài đặt các dependencies và khởi chạy server phát triển:
  ```bash
  npm install
  npm run dev
  ```
- Ứng dụng Frontend sẽ chạy tại `http://localhost:5173`.

---

### Cách 2: Sử dụng Docker (Khuyên dùng cho Database & Backend)

Dự án cung cấp cấu hình Docker Compose để khởi chạy cơ sở dữ liệu pgvector và backend Spring Boot một cách nhanh chóng.

1. **Khởi động Database và Backend**:
   Tại thư mục gốc của dự án (nơi chứa file `docker-compose.yml` và `.env`), chạy lệnh:
   ```bash
   docker-compose up --build -d
   ```
   *Lệnh này sẽ tự động tải image PostgreSQL chứa pgvector, chạy file khởi tạo `init.sql`, build ứng dụng Spring Boot từ Dockerfile và kết nối chúng lại với nhau.*

2. **Chạy Frontend**:
   Hiện tại, dịch vụ frontend vẫn chạy trực tiếp trên môi trường phát triển local bằng Node.js:
   ```bash
   cd frontend/app
   npm install
   npm run dev
   ```

---

## 📖 Tài liệu API (Swagger UI)

Khi ứng dụng Backend được khởi chạy thành công, bạn có thể truy cập tài liệu hướng dẫn API tự động sinh bởi OpenAPI/SpringDoc tại:

- **Swagger UI**: `http://localhost:8080/swagger-ui/index.html` (thay thế cổng `8080` bằng cổng Server của bạn).
- **OpenAPI JSON**: `http://localhost:8080/v3/api-docs`

---

## 🌟 Các tính năng chính của hệ thống

1. **Quản lý thiết bị (Asset Instances)**: Quản lý chi tiết từng thiết bị, serial number, trạng thái khấu hao, chi phí bảo trì.
2. **Quản lý danh mục thiết bị (Asset Models & Types)**: Phân nhóm các thiết bị theo chủng loại (Laptop, Monitor, Printer...) và dòng máy.
3. **Cấp phát & Bàn giao (Allocations)**: Quy trình mượn - trả thiết bị của nhân viên, phê duyệt bởi Quản lý phòng ban hoặc Admin.
4. **Quản lý Nhân sự & Phòng ban (Users & Departments)**: Phân quyền vai trò người dùng (ADMIN, MANAGER, STAFF), gắn kết nhân viên vào từng phòng ban.
5. **AI Chatbot (Text-to-SQL)**: Sử dụng mô hình ngôn ngữ lớn tích hợp qua Spring AI, tự động chuyển đổi các câu hỏi tiếng Việt của người dùng thành câu lệnh SQL SELECT an toàn và tối ưu để trả về kết quả ngay lập tức từ cơ sở dữ liệu.
