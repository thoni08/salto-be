# Salto Backend API

API backend untuk management user dengan fitur follow/unfollow dan authentication menggunakan JWT.

## 📋 Table of Contents

- [Teknologi](#teknologi)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Running the Server](#running-the-server)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Error Handling](#error-handling)

## 🛠️ Teknologi

- **Node.js** - JavaScript Runtime
- **Express.js** - Web Framework
- **Prisma** - ORM Database
- **PostgreSQL** - Database
- **JWT** - JSON Web Token untuk Authentication
- **bcrypt** - Password Hashing
- **CORS** - Cross-Origin Resource Sharing

## 📦 Setup & Installation

### Prerequisites
- Node.js (v16 atau lebih tinggi)
- PostgreSQL
- pnpm atau npm

### Steps

1. Clone repository
```bash
git clone https://github.com/thoni08/salto-be.git
cd salto-be
```

2. Install dependencies
```bash
pnpm install
```

3. Setup environment variables (lihat [Environment Variables](#environment-variables))

4. Setup database
```bash
pnpm prisma:generate
pnpm prisma:migrate
```

5. Run server
```bash
pnpm dev  # Development dengan nodemon
# atau
pnpm start  # Production
```

Server akan berjalan di `http://localhost:3000` (atau PORT yang di-set di .env)

## 🔐 Environment Variables

Buat file `.env` di root folder:

```env
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/salto_db
JWT_SECRET=your_secret_key_here
```

## ▶️ Running the Server

### Development
```bash
pnpm dev
```

### Production
```bash
pnpm start
```

### Check Health
```bash
curl http://localhost:3000/health
```

Respons:
```json
{
  "status": "OK",
  "message": "Server is running perfectly"
}
```

---

## 🌐 API Endpoints

Base URL: `http://localhost:3000/api`

### Health Check

#### GET /health
Check server status

**Response (200)**
```json
{
  "status": "OK",
  "message": "Server is running perfectly"
}
```

---

### Auth Endpoints

#### POST /login
Login user dan dapatkan JWT token

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200)**
```json
{
  "message": "Login Berhasil",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "username": "username",
    "role": "User"
  }
}
```

**Error Response (401)**
```json
{
  "message": "Email atau password salah"
}
```

---

#### POST /register
Register user baru

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "username": "newusername",
  "role": "User"
}
```

**Response (201)**
```json
{
  "message": "Registrasi Berhasil!",
  "data": {
    "id": "user_id",
    "email": "newuser@example.com",
    "username": "newusername",
    "role": "User"
  }
}
```

**Error Response (400)**
```json
{
  "message": "Email sudah terdaftar"
}
```

---

#### GET /profile
Get profil user yang sedang login *(Requires Authentication)*

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200)**
```json
{
  "message": "Kamu berhasil masuk rute rahasia",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "username": "username",
    "role": "User"
  }
}
```

---

### User Endpoints

#### GET /users
Get semua user dengan pagination *(Requires Authentication)*

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Halaman ke- (default: 1)
- `limit` (optional): Jumlah data per halaman (default: 10)
- `search` (optional): Search berdasarkan username/email

**Response (200)**
```json
{
  "message": "Data users berhasil diambil",
  "data": [
    {
      "id": "user_id",
      "email": "user@example.com",
      "username": "username",
      "role": "User",
      "avatar": "url_avatar",
      "bio": "user bio",
      "createdAt": "2025-01-01T10:00:00Z",
      "updatedAt": "2025-01-01T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

---

#### GET /user
Get profil user yang sedang login *(Requires Authentication)*

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200)**
```json
{
  "message": "Data user berhasil diambil",
  "data": {
    "id": "user_id",
    "email": "user@example.com",
    "username": "username",
    "role": "User",
    "avatar": "url_avatar",
    "bio": "user bio",
    "createdAt": "2025-01-01T10:00:00Z",
    "updatedAt": "2025-01-01T10:00:00Z"
  }
}
```

---

#### GET /user/:id
Get user berdasarkan ID *(Requires Authentication)*

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `id` (required): User ID

**Response (200)**
```json
{
  "message": "Data user berhasil diambil",
  "data": {
    "id": "user_id",
    "email": "user@example.com",
    "username": "username",
    "role": "User",
    "avatar": "url_avatar",
    "bio": "user bio",
    "createdAt": "2025-01-01T10:00:00Z",
    "updatedAt": "2025-01-01T10:00:00Z"
  }
}
```

**Error Response (404)**
```json
{
  "message": "User tidak ditemukan"
}
```

---

#### POST /user
Create user baru *(Requires Authentication - Admin only)*

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "username": "newusername",
  "password": "password123",
  "role": "User"
}
```

**Response (201)**
```json
{
  "message": "User berhasil dibuat",
  "data": {
    "id": "new_user_id",
    "email": "newuser@example.com",
    "username": "newusername",
    "role": "User"
  }
}
```

**Error Response (403)**
```json
{
  "message": "Akses ditolak. Admin only."
}
```

---

#### PATCH /user
Update profil user yang sedang login *(Requires Authentication)*

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "username": "new_username",
  "bio": "my bio",
  "avatar": "url_avatar",
  "degree": "S1",
  "role": "User"
}
```

**Response (200)**
```json
{
  "message": "User berhasil diupdate",
  "data": {
    "id": "user_id",
    "email": "user@example.com",
    "username": "new_username",
    "bio": "my bio",
    "avatar": "url_avatar",
    "degree": "S1"
  }
}
```

---

#### PATCH /user/:id
Update user berdasarkan ID *(Requires Authentication - Admin or Owner)*

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `id` (required): User ID

**Request Body:**
```json
{
  "username": "new_username",
  "bio": "my bio",
  "avatar": "url_avatar",
  "degree": "S1"
}
```

**Response (200)**
```json
{
  "message": "User berhasil diupdate",
  "data": {
    "id": "user_id",
    "username": "new_username",
    "bio": "my bio"
  }
}
```

**Error Response (403)**
```json
{
  "message": "Akses ditolak. ID hanya bisa dipakai admin."
}
```

---

#### DELETE /user/:id
Delete user *(Requires Authentication - Admin only)*

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `id` (required): User ID

**Response (200)**
```json
{
  "message": "User berhasil dihapus"
}
```

**Error Response (403)**
```json
{
  "message": "Akses ditolak. Admin only."
}
```

---

### Follow/Unfollow Endpoints

#### POST /user/follow
Follow user *(Requires Authentication)*

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "userId": "target_user_id"
}
```

**Response (201)**
```json
{
  "message": "Berhasil follow user",
  "data": {
    "followerId": "current_user_id",
    "followingId": "target_user_id",
    "createdAt": "2025-01-01T10:00:00Z"
  }
}
```

**Error Response (400)**
```json
{
  "message": "Tidak bisa follow diri sendiri"
}
```

---

#### POST /user/unfollow
Unfollow user *(Requires Authentication)*

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "userId": "target_user_id"
}
```

**Response (200)**
```json
{
  "message": "Berhasil unfollow user",
  "data": {
    "followerId": "current_user_id",
    "followingId": "target_user_id"
  }
}
```

**Error Response (400)**
```json
{
  "message": "User tidak diikuti"
}
```

---

#### GET /user/:id/is-following
Check apakah current user mengikuti user lain *(Requires Authentication)*

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `id` (required): Target User ID

**Response (200)**
```json
{
  "isFollowing": true
}
```

---

### Test Endpoints

#### GET /test
Test endpoint untuk memverifikasi API

**Response (200)**
```json
{
  "message": "Test berhasil"
}
```

---

## 🔐 Authentication

API menggunakan JWT (JSON Web Token) untuk authentication.

### How to Authenticate

1. **Register** - Gunakan endpoint `/register`
2. **Login** - Gunakan endpoint `/login` untuk mendapatkan token
3. **Include Token** - Tambahkan token di header untuk setiap request:

```
Authorization: Bearer <your_jwt_token>
```

### Token Payload

Token JWT berisi informasi:
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "role": "User",
  "iat": 1234567890,
  "exp": 1234571490
}
```

---

## ❌ Error Handling

### Common Error Responses

**401 - Unauthorized**
```json
{
  "message": "Token tidak valid atau sudah expired"
}
```

**403 - Forbidden**
```json
{
  "message": "Akses ditolak"
}
```

**404 - Not Found**
```json
{
  "success": false,
  "error": "Route not found"
}
```

**400 - Bad Request**
```json
{
  "message": "Validasi error: field tidak valid"
}
```

**500 - Internal Server Error**
```json
{
  "message": "Terjadi kesalahan di server"
}
```

---

## 📝 Testing

Untuk testing API, gunakan Postman collection yang disediakan di folder `postman/`.

### Import Collection ke Postman:
1. Buka Postman
2. Click `Import`
3. Pilih file `postman/salto-collection.json`
4. Collection akan tersimpan dan siap digunakan

### Atau Manual dengan cURL:

**Register**
```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "username": "username"
  }'
```

**Login**
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Get Users (dengan token)**
```bash
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📂 Project Structure

```
salto-be/
├── app.js                    # Main application file
├── package.json             # Dependencies
├── README.md               # Documentation
├── controllers/            # Request handlers
│   ├── auth.controller.js
│   ├── user.controller.js
│   └── test.controller.js
├── routes/                 # API routes
│   ├── auth.route.js
│   ├── user.route.js
│   └── test.route.js
├── services/              # Business logic
│   ├── auth.service.js
│   ├── user.service.js
│   └── test.service.js
├── middlewares/           # Custom middlewares
│   ├── auth.middleware.js
│   └── error.middleware.js
├── prisma/               # Database configuration
│   ├── schema.prisma
│   └── migrations/
├── utils/                # Utility functions
│   └── asyncHandler.js
└── postman/             # Postman collection
    └── salto-collection.json
```

---

## 📞 Support & Contact

- GitHub: [thoni08/salto-be](https://github.com/thoni08/salto-be)
- Author: Salto Team

---

## 📄 License

ISC - Lihat file LICENSE untuk detail

---

**Last Updated:** May 2026
