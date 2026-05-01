import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export async function registerService({
  Avatar, userName, fullName, email, nim, campusName, prodi, degree, angkatan, password, confirmPassword, role, fromYear, workPlace, isPhd, isMentor
}) {
  if (!userName || !fullName || !email || !password || !confirmPassword || !degree || !angkatan) {
    return { status: 400, error: 'Field wajib belum lengkap.' };
  }
  if (password !== confirmPassword) {
    return { status: 400, error: 'Password dan Konfirmasi Password tidak cocok!' };
  }
  if (typeof userName !== 'string' || userName.includes(' ') || userName.length > 30 || userName.length === 0) {
    return { status: 400, error: 'Format username salah! (maksimal 30 karakter dan tanpa spasi.)' };
  }
  const intakeYear = Number.parseInt(angkatan, 10);
  if (Number.isNaN(intakeYear)) {
    return { status: 400, error: 'Angkatan harus berupa angka tahun, misalnya 2022.' };
  }
  const normalizedRole = role || 'Student';
  const graduateYear = normalizedRole === 'Alumni' ? intakeYear + 4 : null;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existingUserName = await client.query(
      'SELECT id FROM "User" WHERE "userName" = $1 LIMIT 1',
      [userName]
    );
    if (existingUserName.rowCount > 0) {
      await client.query('ROLLBACK');
      return { status: 400, error: 'username sudah dipakai!' };
    }
    if (!isValidEmail(email)) {
      await client.query('ROLLBACK');
      return { status: 403, error: 'format input email salah!' };
    }
    const existingEmail = await client.query(
      'SELECT id FROM "User" WHERE email = $1 LIMIT 1',
      [email]
    );
    if (existingEmail.rowCount > 0) {
      await client.query('ROLLBACK');
      return { status: 400, error: 'Email sudah terdaftar!' };
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const now = new Date();
    const createdUserId = randomUUID();
    const AvatarImg = Avatar == "" ? "https://api.dicebear.com/7.x/pixel-art/svg?seed=default" : Avatar;
    const userResult = await client.query(
      `INSERT INTO "User" (id, "Avatar", "userName", "fullName", email, password, role, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, "userName", "fullName", email, role, field, "createdAt", "updatedAt", "deletedAt"`,
      [createdUserId, AvatarImg, userName, fullName, email, hashedPassword, normalizedRole, now, now]
    );
    const createdUser = userResult.rows[0];
    const schoolResult = await client.query(
      `INSERT INTO "UserSchool" (id, "userId", nim, "campusName", major, degree, "intakeDate", "graduateDate", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        randomUUID(),
        createdUser.id,
        nim || '001',
        campusName || 'Politeknik Elektronika Negeri Surabaya',
        prodi || 'Teknik Informatika',
        degree,
        new Date(`${intakeYear}-08-01`),
        graduateYear,
        now,
        now,
      ]
    );
    let workResult = null;
    if (normalizedRole === 'Alumni') {
      const parsedFromYear = Number.parseInt(fromYear ?? String(graduateYear ?? intakeYear), 10);
      if (Number.isNaN(parsedFromYear)) {
        await client.query('ROLLBACK');
        return { status: 400, error: 'fromYear harus berupa angka tahun, misalnya 2024.' };
      }
      workResult = await client.query(
        `INSERT INTO "UserWork" (id, "userId", "workPlace", "isPhd", "isMentor",  "fromYear", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [randomUUID(), createdUser.id, workPlace || 'Belum Bekerja', isPhd || false, isMentor || false, parsedFromYear, now, now]
      );
    }
    await client.query('COMMIT');
    return {
      status: 201,
      data: {
        ...createdUser,
        schools: schoolResult.rows,
        works: workResult?.rows ?? [],
      },
    };
  } catch (dbError) {
    await client.query('ROLLBACK');
    return { status: 500, error: dbError.message };
  } finally {
    client.release();
  }
}

export async function loginService({ email, password }) {
  try {
    const userResult = await pool.query(
      'SELECT id, "userName", "fullName", email, password, role, field, "deletedAt" FROM "User" WHERE email = $1 LIMIT 1',
      [email]
    );
    const user = userResult.rows[0];
    if (!user || user.deletedAt) return { status: 404, error: 'User tidak ditemukan' };
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return { status: 401, error: 'Password salah!' };
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    return {
      status: 200,
      data: { token, user: { id: user.id, role: user.role } },
    };
  } catch (error) {
    return { status: 500, error: error.message };
  }
}
