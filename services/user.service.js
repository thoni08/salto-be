import bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const ROLE_VALUES = new Set(['Admin', 'Student', 'Alumni', 'AlumniMentor']);
const DEGREE_VALUES = new Set(['D3', 'D4', 'S1', 'S2', 'S3']);

const isValidEmail = (email) => {
  if (typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const parseUserId = (value) => {
  if (value === undefined || value === null) return null;
  const userId = String(value).trim();
  return userId.length === 0 ? null : userId;
};

const parseBooleanQuery = (value) => {
  if (value === undefined) return undefined;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  return null;
};

const TOP_ALUMNI_TIMEFRAMES = new Set(['day', 'week', 'month', 'year']);

const resolveTopAlumniTimeframe = (timeframe) => {
  const normalized = String(timeframe ?? 'month').trim().toLowerCase();
  if (!TOP_ALUMNI_TIMEFRAMES.has(normalized)) {
    return { error: 'Parameter timeframe harus day, week, month, atau year.' };
  }

  const now = new Date();
  const start = new Date(now);
  switch (normalized) {
    case 'day':
      start.setDate(now.getDate() - 1);
      break;
    case 'week':
      start.setDate(now.getDate() - 7);
      break;
    case 'month':
      start.setMonth(now.getMonth() - 1);
      break;
    case 'year':
      start.setFullYear(now.getFullYear() - 1);
      break;
    default:
      break;
  }

  return { normalized, start };
};

export async function getUserWithRelations(client, userId) {
  const userResult = await client.query(
    `SELECT id, "Avatar", "userName", "fullName", email, role, field, "createdAt", "updatedAt", "deletedAt"
     FROM "User"
     WHERE id = $1 AND "deletedAt" IS NULL
     LIMIT 1`,
    [userId]
  );
  if (userResult.rowCount === 0) return null;
  
  const schoolsResult = await client.query(
    `SELECT * FROM "UserSchool"
     WHERE "userId" = $1 AND "deletedAt" IS NULL
     ORDER BY id ASC`,
    [userId]
  );
  
  const worksResult = await client.query(
    `SELECT * FROM "UserWork"
     WHERE "userId" = $1 AND "deletedAt" IS NULL
     ORDER BY id ASC`,
    [userId]
  );

  const followersResult = await client.query(
    `SELECT u.id, u."Avatar", u."userName", u."fullName", u.role, u.field, u."createdAt"
     FROM "Follows" f
     JOIN "User" u ON f."followerId" = u.id
     WHERE f."followingId" = $1 AND u."deletedAt" IS NULL
     ORDER BY f."createdAt" DESC`,
    [userId]
  );

  const followingResult = await client.query(
    `SELECT u.id, u."Avatar", u."userName", u."fullName", u.role, u.field, u."createdAt"
     FROM "Follows" f
     JOIN "User" u ON f."followingId" = u.id
     WHERE f."followerId" = $1 AND u."deletedAt" IS NULL
     ORDER BY f."createdAt" DESC`,
    [userId]
  );

  return {
    ...userResult.rows[0],
    schools: schoolsResult.rows,
    works: worksResult.rows,
    followersCount: followersResult.rowCount,
    followingCount: followingResult.rowCount,
    followers: followersResult.rows,
    following: followingResult.rows,
  };
}

export async function getUsersService(query) {
  try {
    const {
      page = '1',
      limit = '10',
      sortBy = 'fullName',
      sortDesc = 'false',
      searchTerm,
      field,
      campus,
      major,
      degree,
      workPlace,
      batch,
      graduateYear,
      isPhd,
      isMentor,
    } = query;

    const parsedPage = Number.parseInt(String(page), 10);
    const parsedLimit = Number.parseInt(String(limit), 10);

    if (Number.isNaN(parsedPage) || parsedPage < 1) {
      return { status: 400, error: 'Parameter page tidak valid.' };
    }
    if (Number.isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      return { status: 400, error: 'Parameter limit tidak valid. Gunakan 1-100.' };
    }
    if (sortBy !== 'fullName') {
      return { status: 400, error: 'sortBy yang didukung hanya fullName.' };
    }

    const parsedSortDesc = parseBooleanQuery(sortDesc);
    if (parsedSortDesc === null) {
      return { status: 400, error: 'Parameter sortDesc harus true/false.' };
    }
    if (degree !== undefined && !DEGREE_VALUES.has(String(degree))) {
      return { status: 400, error: 'Parameter degree tidak valid.' };
    }

    const parsedBatch = batch === undefined ? undefined : Number.parseInt(String(batch), 10);
    if (batch !== undefined && Number.isNaN(parsedBatch)) {
      return { status: 400, error: 'Parameter batch harus angka tahun.' };
    }

    const parsedGraduateYear = graduateYear === undefined ? undefined : Number.parseInt(String(graduateYear), 10);
    if (graduateYear !== undefined && Number.isNaN(parsedGraduateYear)) {
      return { status: 400, error: 'Parameter graduateYear harus angka tahun.' };
    }

    const parsedIsPhd = parseBooleanQuery(isPhd);
    if (isPhd !== undefined && parsedIsPhd === null) {
      return { status: 400, error: 'Parameter isPhd harus true/false.' };
    }

    const parsedIsMentor = parseBooleanQuery(isMentor);
    if (isMentor !== undefined && parsedIsMentor === null) {
      return { status: 400, error: 'Parameter isMentor harus true/false.' };
    }

    const whereClauses = ['u."deletedAt" IS NULL'];
    const queryParams = [];

    if (searchTerm) {
      queryParams.push(`%${String(searchTerm).trim()}%`);
      whereClauses.push(`u."userName" ILIKE $${queryParams.length}`);
    }
    if (field) {
      queryParams.push(`%${String(field).trim()}%`);
      whereClauses.push(`(u.field ILIKE $${queryParams.length} OR us.major ILIKE $${queryParams.length} OR uw."workPlace" ILIKE $${queryParams.length})`);
    }
    if (campus) {
      queryParams.push(`%${String(campus).trim()}%`);
      whereClauses.push(`us."campusName" ILIKE $${queryParams.length}`);
    }
    if (major) {
      queryParams.push(`%${String(major).trim()}%`);
      whereClauses.push(`us.major ILIKE $${queryParams.length}`);
    }
    if (degree) {
      queryParams.push(String(degree));
      whereClauses.push(`us.degree = $${queryParams.length}`);
    }
    if (workPlace) {
      queryParams.push(`%${String(workPlace).trim()}%`);
      whereClauses.push(`uw."workPlace" ILIKE $${queryParams.length}`);
    }
    if (parsedBatch !== undefined) {
      queryParams.push(parsedBatch);
      whereClauses.push(`EXTRACT(YEAR FROM us."intakeDate")::int = $${queryParams.length}`);
    }
    if (parsedGraduateYear !== undefined) {
      queryParams.push(parsedGraduateYear);
      whereClauses.push(`us."graduateDate" = $${queryParams.length}`);
    }
    if (parsedIsPhd !== undefined) {
      if (parsedIsPhd) {
        whereClauses.push(`us.degree = 'S3'`);
      } else {
        whereClauses.push(`(us.degree IS NULL OR us.degree <> 'S3')`);
      }
    }
    if (parsedIsMentor !== undefined) {
      if (parsedIsMentor) {
        whereClauses.push(`u.role = 'AlumniMentor'`);
      } else {
        whereClauses.push(`u.role <> 'AlumniMentor'`);
      }
    }

    const whereSql = `WHERE ${whereClauses.join(' AND ')}`;
    const fromSql = `
      FROM "User" u
      LEFT JOIN LATERAL (
        SELECT us.id, us."userId", us.nim, us."campusName", us.major, us.degree, us."intakeDate", us."graduateDate", us."createdAt", us."updatedAt"
        FROM "UserSchool" us
        WHERE us."userId" = u.id AND us."deletedAt" IS NULL
        ORDER BY us."updatedAt" DESC, us.id DESC
        LIMIT 1
      ) us ON true
      LEFT JOIN LATERAL (
        SELECT uw.id, uw."userId", uw."workPlace", uw."fromYear", uw."toYear", uw."createdAt", uw."updatedAt", uw."isMentor", uw."isPhd"
        FROM "UserWork" uw
        WHERE uw."userId" = u.id AND uw."deletedAt" IS NULL
        ORDER BY uw."updatedAt" DESC, uw.id DESC
        LIMIT 1
      ) uw ON true
    `;

    const orderSql = `ORDER BY u."fullName" ${parsedSortDesc ? 'DESC' : 'ASC'}, u.id ASC`;
    const offset = (parsedPage - 1) * parsedLimit;

    const client = await pool.connect();
    try {
      const countQuery = `SELECT COUNT(*)::int AS total ${fromSql} ${whereSql}`;
      const countResult = await client.query(countQuery, queryParams);
      const total = countResult.rows[0]?.total ?? 0;

      const dataParams = [...queryParams, parsedLimit, offset];
      const dataQuery = `
        SELECT
          u.id,
          u."Avatar",
          u."userName",
          u."fullName",
          u.email,
          u.role,
          u.field,
          u."createdAt",
          u."updatedAt",
          us.id AS "schoolId",
          us.nim,
          us."campusName",
          us.major,
          us.degree,
          us."intakeDate",
          us."graduateDate",
          uw.id AS "workId",
          uw."workPlace",
          uw."isPhd",
          uw."isMentor",
          uw."fromYear",
          uw."toYear"
        ${fromSql}
        ${whereSql}
        ${orderSql}
        LIMIT $${dataParams.length - 1}
        OFFSET $${dataParams.length}
      `;

      const dataResult = await client.query(dataQuery, dataParams);
      const users = dataResult.rows.map((row) => ({
        id: row.id,
        avatar: row.Avatar,
        userName: row.userName,
        fullName: row.fullName,
        email: row.email,
        role: row.role,
        field: row.field,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        school: row.schoolId
          ? {
              id: row.schoolId,
              nim: row.nim,
              campusName: row.campusName,
              major: row.major,
              degree: row.degree,
              intakeDate: row.intakeDate,
              graduateDate: row.graduateDate,
            }
          : null,
        work: row.workId
          ? {
              id: row.workId,
              workPlace: row.workPlace,
              isMentor: row.isMentor,
              isPhd: row.isPhd,
              fromYear: row.fromYear,
              toYear: row.toYear,
            }
          : null,
      }));

      return {
        status: 200,
        data: users,
        pagination: {
          page: parsedPage,
          limit: parsedLimit,
          total,
          totalPages: Math.ceil(total / parsedLimit),
        },
      };
    } finally {
      client.release();
    }
  } catch (error) {
    return { status: 500, error: error.message };
  }
}

export async function getTopAlumniService(timeframe) {
  const resolved = resolveTopAlumniTimeframe(timeframe);
  if (resolved.error) {
    return { status: 400, error: resolved.error };
  }

  const { normalized, start } = resolved;
  const client = await pool.connect();
  try {
    const query = `
      WITH points AS (
        SELECT "authorId" AS "userId", COUNT(*)::int * 1 AS points
        FROM "ThreadComment"
        WHERE "deletedAt" IS NULL
          AND "parentId" IS NOT NULL
          AND "createdAt" >= $1
        GROUP BY "authorId"
        UNION ALL
        SELECT "authorId" AS "userId", COUNT(*)::int * 2 AS points
        FROM "ThreadComment"
        WHERE "deletedAt" IS NULL
          AND "parentId" IS NULL
          AND "createdAt" >= $1
        GROUP BY "authorId"
        UNION ALL
        SELECT "authorId" AS "userId", COUNT(*)::int * 5 AS points
        FROM "ThreadComment"
        WHERE "deletedAt" IS NULL
          AND "isBestAnswer" = true
          AND "updatedAt" >= $1
        GROUP BY "authorId"
      ),
      agg AS (
        SELECT "userId", SUM(points)::int AS points
        FROM points
        WHERE "userId" IS NOT NULL
        GROUP BY "userId"
      )
      SELECT
        u.id,
        u."Avatar",
        u."userName",
        u."fullName",
        u.role,
        u.field,
        u."createdAt",
        agg.points
      FROM agg
      JOIN "User" u ON u.id = agg."userId"
      WHERE u."deletedAt" IS NULL
        AND u.role IN ('Alumni', 'AlumniMentor')
      ORDER BY agg.points DESC, u."fullName" ASC, u.id ASC
      LIMIT 10
    `;

    const result = await client.query(query, [start]);
    const alumni = result.rows.map((row) => ({
      id: row.id,
      avatar: row.Avatar,
      userName: row.userName,
      fullName: row.fullName,
      role: row.role,
      field: row.field,
      createdAt: row.createdAt,
      points: row.points,
    }));

    return {
      status: 200,
      data: alumni,
      timeframe: normalized,
      startDate: start,
    };
  } catch (error) {
    return { status: 500, error: error.message };
  } finally {
    client.release();
  }
}

export async function getUserService(targetUserId) {
  try {
    const client = await pool.connect();
    try {
      const user = await getUserWithRelations(client, targetUserId);
      if (!user) return { status: 404, error: 'User tidak ditemukan' };
      return { status: 200, data: user };
    } finally {
      client.release();
    }
  } catch (error) {
    return { status: 500, error: error.message };
  }
}

export async function createUserService(body) {
  try {
    const {
      userName,
      fullName,
      email,
      password,
      role,
      field,
      nim,
      campusName,
      prodi,
      degree,
      angkatan,
      workPlace,
      fromYear,
      toYear,
    } = body ?? {};

    if (!userName || !fullName || !email || !password || !degree || !angkatan) {
      return { status: 400, error: 'Field wajib belum lengkap.' };
    }
    if (typeof userName !== 'string' || userName.includes(' ') || userName.length > 30 || userName.length === 0) {
      return { status: 400, error: 'Format username salah! (maksimal 30 karakter dan tanpa spasi.)' };
    }
    if (!isValidEmail(email)) {
      return { status: 400, error: 'Format input email salah!' };
    }

    const normalizedRole = role || 'Student';
    if (!ROLE_VALUES.has(normalizedRole)) {
      return { status: 400, error: 'Role tidak valid.' };
    }
    if (!DEGREE_VALUES.has(degree)) {
      return { status: 400, error: 'Degree tidak valid.' };
    }

    const intakeYear = Number.parseInt(String(angkatan), 10);
    if (Number.isNaN(intakeYear)) {
      return { status: 400, error: 'Angkatan harus berupa angka tahun.' };
    }

    const graduateYear = normalizedRole === 'Alumni' ? intakeYear + 4 : null;
    const now = new Date();

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

      const existingEmail = await client.query(
        'SELECT id FROM "User" WHERE email = $1 LIMIT 1',
        [email]
      );
      if (existingEmail.rowCount > 0) {
        await client.query('ROLLBACK');
        return { status: 400, error: 'Email sudah terdaftar!' };
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const createdUserId = randomUUID();

      const userResult = await client.query(
        `INSERT INTO "User" (id, "userName", "fullName", email, password, role, field, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [createdUserId, userName, fullName, email, hashedPassword, normalizedRole, field || null, now, now]
      );
      const createdUserIdFromDb = userResult.rows[0].id;

      await client.query(
        `INSERT INTO "UserSchool" (id, "userId", nim, "campusName", major, degree, "intakeDate", "graduateDate", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          randomUUID(),
          createdUserIdFromDb,
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

      if (normalizedRole === 'Alumni') {
        const normalizedFromYear = Number.parseInt(String(fromYear ?? graduateYear ?? intakeYear), 10);
        const normalizedToYear = toYear === undefined || toYear === null || toYear === ''
          ? null
          : Number.parseInt(String(toYear), 10);

        if (Number.isNaN(normalizedFromYear) || (normalizedToYear !== null && Number.isNaN(normalizedToYear))) {
          await client.query('ROLLBACK');
          return { status: 400, error: 'Format fromYear/toYear tidak valid.' };
        }

        await client.query(
          `INSERT INTO "UserWork" (id, "userId", "workPlace", "fromYear", "toYear", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [randomUUID(), createdUserIdFromDb, workPlace || 'Belum Bekerja', normalizedFromYear, normalizedToYear, now, now]
        );
      }

      await client.query('COMMIT');

      const createdUser = await getUserWithRelations(client, createdUserIdFromDb);
      return { status: 201, data: createdUser };
    } catch (dbError) {
      await client.query('ROLLBACK');
      throw dbError;
    } finally {
      client.release();
    }
  } catch (error) {
    return { status: 500, error: error.message };
  }
}

export async function updateUserService(targetUserId, body) {
  try {
    const {
      userName,
      fullName,
      email,
      password,
      role,
      field,
      nim,
      campusName,
      prodi,
      degree,
      angkatan,
      workPlace,
      fromYear,
      toYear,
    } = body ?? {};

    const userFieldProvided = [userName, fullName, email, password, role, field].some((item) => item !== undefined);
    const schoolFieldProvided = [nim, campusName, prodi, degree, angkatan].some((item) => item !== undefined);
    const workFieldProvided = [workPlace, fromYear, toYear].some((item) => item !== undefined);

    if (!userFieldProvided && !schoolFieldProvided && !workFieldProvided) {
      return { status: 400, error: 'Tidak ada data yang diupdate.' };
    }

    if (userName !== undefined && (typeof userName !== 'string' || userName.includes(' ') || userName.length > 30 || userName.length === 0)) {
      return { status: 400, error: 'Format username salah! (maksimal 30 karakter dan tanpa spasi.)' };
    }
    if (email !== undefined && !isValidEmail(email)) {
      return { status: 400, error: 'Format input email salah!' };
    }
    if (role !== undefined && !ROLE_VALUES.has(role)) {
      return { status: 400, error: 'Role tidak valid.' };
    }
    if (degree !== undefined && !DEGREE_VALUES.has(degree)) {
      return { status: 400, error: 'Degree tidak valid.' };
    }

    const parsedIntakeYear = angkatan === undefined ? null : Number.parseInt(String(angkatan), 10);
    if (angkatan !== undefined && Number.isNaN(parsedIntakeYear)) {
      return { status: 400, error: 'Angkatan harus berupa angka tahun.' };
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const existingUserResult = await client.query(
        `SELECT id, role FROM "User"
         WHERE id = $1 AND "deletedAt" IS NULL
         LIMIT 1`,
        [targetUserId]
      );
      if (existingUserResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return { status: 404, error: 'User tidak ditemukan' };
      }

      if (userName !== undefined) {
        const userNameResult = await client.query(
          'SELECT id FROM "User" WHERE "userName" = $1 AND id <> $2 LIMIT 1',
          [userName, targetUserId]
        );
        if (userNameResult.rowCount > 0) {
          await client.query('ROLLBACK');
          return { status: 400, error: 'username sudah dipakai!' };
        }
      }

      if (email !== undefined) {
        const emailResult = await client.query(
          'SELECT id FROM "User" WHERE email = $1 AND id <> $2 LIMIT 1',
          [email, targetUserId]
        );
        if (emailResult.rowCount > 0) {
          await client.query('ROLLBACK');
          return { status: 400, error: 'Email sudah terdaftar!' };
        }
      }

      const updateClauses = [];
      const updateParams = [];

      if (userName !== undefined) {
        updateParams.push(userName);
        updateClauses.push(`"userName" = $${updateParams.length}`);
      }
      if (fullName !== undefined) {
        updateParams.push(fullName);
        updateClauses.push(`"fullName" = $${updateParams.length}`);
      }
      if (email !== undefined) {
        updateParams.push(email);
        updateClauses.push(`email = $${updateParams.length}`);
      }
      if (field !== undefined) {
        updateParams.push(field);
        updateClauses.push(`field = $${updateParams.length}`);
      }
      if (role !== undefined) {
        updateParams.push(role);
        updateClauses.push(`role = $${updateParams.length}`);
      }
      if (password !== undefined) {
        const hashedPassword = await bcrypt.hash(password, 10);
        updateParams.push(hashedPassword);
        updateClauses.push(`password = $${updateParams.length}`);
      }

      if (updateClauses.length > 0) {
        updateParams.push(new Date());
        updateClauses.push(`"updatedAt" = $${updateParams.length}`);
        updateParams.push(targetUserId);

        await client.query(
          `UPDATE "User"
           SET ${updateClauses.join(', ')}
           WHERE id = $${updateParams.length} AND "deletedAt" IS NULL`,
          updateParams
        );
      }

      if (schoolFieldProvided) {
        const schoolResult = await client.query(
          `SELECT id FROM "UserSchool"
           WHERE "userId" = $1 AND "deletedAt" IS NULL
           ORDER BY id DESC
           LIMIT 1`,
          [targetUserId]
        );

        const schoolClauses = [];
        const schoolParams = [];

        if (nim !== undefined) {
          schoolParams.push(nim);
          schoolClauses.push(`nim = $${schoolParams.length}`);
        }
        if (campusName !== undefined) {
          schoolParams.push(campusName);
          schoolClauses.push(`"campusName" = $${schoolParams.length}`);
        }
        if (prodi !== undefined) {
          schoolParams.push(prodi);
          schoolClauses.push(`major = $${schoolParams.length}`);
        }
        if (degree !== undefined) {
          schoolParams.push(degree);
          schoolClauses.push(`degree = $${schoolParams.length}`);
        }
        if (parsedIntakeYear !== null) {
          schoolParams.push(new Date(`${parsedIntakeYear}-08-01`));
          schoolClauses.push(`"intakeDate" = $${schoolParams.length}`);
        }

        const effectiveRole = role ?? existingUserResult.rows[0].role;
        if (parsedIntakeYear !== null && effectiveRole === 'Alumni') {
          schoolParams.push(parsedIntakeYear + 4);
          schoolClauses.push(`"graduateDate" = $${schoolParams.length}`);
        }

        if (schoolResult.rowCount > 0) {
          schoolParams.push(new Date());
          schoolClauses.push(`"updatedAt" = $${schoolParams.length}`);
          schoolParams.push(schoolResult.rows[0].id);

          await client.query(
            `UPDATE "UserSchool"
             SET ${schoolClauses.join(', ')}
             WHERE id = $${schoolParams.length}`,
            schoolParams
          );
        } else {
          const fallbackIntakeYear = parsedIntakeYear ?? new Date().getFullYear();
          await client.query(
            `INSERT INTO "UserSchool" (id, "userId", nim, "campusName", major, degree, "intakeDate", "graduateDate", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              randomUUID(),
              targetUserId,
              nim ?? '001',
              campusName ?? 'Politeknik Elektronika Negeri Surabaya',
              prodi ?? 'Teknik Informatika',
              degree ?? 'D4',
              new Date(`${fallbackIntakeYear}-08-01`),
              (role ?? existingUserResult.rows[0].role) === 'Alumni' ? fallbackIntakeYear + 4 : null,
              new Date(),
              new Date(),
            ]
          );
        }
      }

      if (workFieldProvided) {
        const workResult = await client.query(
          `SELECT id FROM "UserWork"
           WHERE "userId" = $1 AND "deletedAt" IS NULL
           ORDER BY id DESC
           LIMIT 1`,
          [targetUserId]
        );

        const workClauses = [];
        const workParams = [];

        if (workPlace !== undefined) {
          workParams.push(workPlace);
          workClauses.push(`"workPlace" = $${workParams.length}`);
        }
        if (fromYear !== undefined) {
          const normalizedFromYear = Number.parseInt(String(fromYear), 10);
          if (Number.isNaN(normalizedFromYear)) {
            await client.query('ROLLBACK');
            return { status: 400, error: 'fromYear harus berupa angka tahun.' };
          }
          workParams.push(normalizedFromYear);
          workClauses.push(`"fromYear" = $${workParams.length}`);
        }
        if (toYear !== undefined) {
          if (toYear === null || toYear === '') {
            workParams.push(null);
          } else {
            const normalizedToYear = Number.parseInt(String(toYear), 10);
            if (Number.isNaN(normalizedToYear)) {
              await client.query('ROLLBACK');
              return { status: 400, error: 'toYear harus berupa angka tahun.' };
            }
            workParams.push(normalizedToYear);
          }
          workClauses.push(`"toYear" = $${workParams.length}`);
        }

        if (workResult.rowCount > 0) {
          workParams.push(new Date());
          workClauses.push(`"updatedAt" = $${workParams.length}`);
          workParams.push(workResult.rows[0].id);

          await client.query(
            `UPDATE "UserWork"
             SET ${workClauses.join(', ')}
             WHERE id = $${workParams.length}`,
            workParams
          );
        } else {
          const normalizedFromYear = fromYear === undefined
            ? new Date().getFullYear()
            : Number.parseInt(String(fromYear), 10);

          if (Number.isNaN(normalizedFromYear)) {
            await client.query('ROLLBACK');
            return { status: 400, error: 'fromYear harus berupa angka tahun.' };
          }

          const normalizedToYear = toYear === undefined || toYear === null || toYear === ''
            ? null
            : Number.parseInt(String(toYear), 10);

          if (normalizedToYear !== null && Number.isNaN(normalizedToYear)) {
            await client.query('ROLLBACK');
            return { status: 400, error: 'toYear harus berupa angka tahun.' };
          }

          await client.query(
            `INSERT INTO "UserWork" (id, "userId", "workPlace", "fromYear", "toYear", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              randomUUID(),
              targetUserId,
              workPlace ?? 'Belum Bekerja',
              normalizedFromYear,
              normalizedToYear,
              new Date(),
              new Date(),
            ]
          );
        }
      }

      await client.query('COMMIT');

      const updatedUser = await getUserWithRelations(client, targetUserId);
      return { status: 200, data: updatedUser };
    } catch (dbError) {
      await client.query('ROLLBACK');
      throw dbError;
    } finally {
      client.release();
    }
  } catch (error) {
    return { status: 500, error: error.message };
  }
}

export async function deleteUserService(targetUserId) {
  try {
    const deleteResult = await pool.query(
      `UPDATE "User"
       SET "deletedAt" = $1, "updatedAt" = $2
       WHERE id = $3 AND "deletedAt" IS NULL
       RETURNING id`,
      [new Date(), new Date(), targetUserId]
    );

    if (deleteResult.rowCount === 0) {
      return { status: 404, error: 'User tidak ditemukan atau sudah dihapus' };
    }

    return { status: 200 };
  } catch (error) {
    return { status: 500, error: error.message };
  }
}

export async function followUserService(followerId, followingId) {
  try {
    if (!followerId || !followingId) {
      return { status: 400, error: 'followerId dan followingId harus disediakan.' };
    }

    if (followerId === followingId) {
      return { status: 400, error: 'Tidak bisa follow diri sendiri.' };
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const followerExists = await client.query(
        `SELECT id FROM "User" WHERE id = $1 AND "deletedAt" IS NULL LIMIT 1`,
        [followerId]
      );
      if (followerExists.rowCount === 0) {
        await client.query('ROLLBACK');
        return { status: 404, error: 'User yang follow tidak ditemukan.' };
      }

      const followingExists = await client.query(
        `SELECT id FROM "User" WHERE id = $1 AND "deletedAt" IS NULL LIMIT 1`,
        [followingId]
      );
      if (followingExists.rowCount === 0) {
        await client.query('ROLLBACK');
        return { status: 404, error: 'User yang akan difollow tidak ditemukan.' };
      }

      const alreadyFollowing = await client.query(
        `SELECT 1 FROM "Follows" WHERE "followerId" = $1 AND "followingId" = $2 LIMIT 1`,
        [followerId, followingId]
      );
      if (alreadyFollowing.rowCount > 0) {
        await client.query('ROLLBACK');
        return { status: 400, error: 'Sudah follow user ini sebelumnya.' };
      }

      await client.query(
        `INSERT INTO "Follows" ("followerId", "followingId", "createdAt")
         VALUES ($1, $2, $3)`,
        [followerId, followingId, new Date()]
      );

      await client.query('COMMIT');

      return { status: 201, data: { message: 'Berhasil follow user' } };
    } catch (dbError) {
      await client.query('ROLLBACK');
      throw dbError;
    } finally {
      client.release();
    }
  } catch (error) {
    return { status: 500, error: error.message };
  }
}

export async function unfollowUserService(followerId, followingId) {
  try {
    if (!followerId || !followingId) {
      return { status: 400, error: 'followerId dan followingId harus disediakan.' };
    }

    const result = await pool.query(
      `DELETE FROM "Follows"
       WHERE "followerId" = $1 AND "followingId" = $2`,
      [followerId, followingId]
    );

    if (result.rowCount === 0) {
      return { status: 404, error: 'Tidak sedang follow user ini.' };
    }

    return { status: 200, data: { message: 'Berhasil unfollow user' } };
  } catch (error) {
    return { status: 500, error: error.message };
  }
}

export async function isFollowingService(followerId, followingId) {
  try {
    const result = await pool.query(
      `SELECT 1 FROM "Follows" WHERE "followerId" = $1 AND "followingId" = $2 LIMIT 1`,
      [followerId, followingId]
    );

    return {
      status: 200,
      data: { isFollowing: result.rowCount > 0 },
    };
  } catch (error) {
    return { status: 500, error: error.message };
  }
}

export {
  isValidEmail,
  parseUserId,
  parseBooleanQuery,
  ROLE_VALUES,
  DEGREE_VALUES,
};
