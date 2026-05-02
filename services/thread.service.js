import prisma from '../prisma/client.js';

const SORT_BY_VALUES = new Set(['newest', 'trending', 'popular']);
const COMMENT_SORT_BY_VALUES = new Set(['newest', 'popular']);
const AUTHOR_TYPE_VALUES = {
  alumni: 'Alumni',
  alumnimentor: 'AlumniMentor',
  student: 'Student',
};

const parseBooleanQuery = (value) => {
  if (value === undefined) return undefined;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  return null;
};

const parseTagsQuery = (value) => {
  if (value === undefined || value === null) return [];
  const parts = Array.isArray(value) ? value : [value];
  const tags = [];

  parts.forEach((entry) => {
    if (typeof entry !== 'string') return;
    entry.split(',').forEach((item) => {
      const tag = item.trim();
      if (tag.length > 0) tags.push(tag);
    });
  });

  return Array.from(new Set(tags));
};

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

export const getThreads = async (query) => {
  const {
    sortBy = 'newest',
    sortDesc = 'false',
    searchTerm,
    isMentor,
    tags,
    authorType,
    page = 1,
    limit = 10,
  } = query;

  const normalizedSortBy = String(sortBy).trim().toLowerCase();
  if (!SORT_BY_VALUES.has(normalizedSortBy)) {
    throw createHttpError(400, 'Parameter sortBy harus newest, trending, atau popular.');
  }

  const parsedSortDesc = parseBooleanQuery(sortDesc);
  if (parsedSortDesc === null) {
    throw createHttpError(400, 'Parameter sortDesc harus true/false.');
  }

  const parsedPage = Number.parseInt(String(page), 10);
  const parsedLimit = Number.parseInt(String(limit), 10);
  if (Number.isNaN(parsedPage) || parsedPage < 1) {
    throw createHttpError(400, 'Parameter page tidak valid.');
  }
  if (Number.isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
    throw createHttpError(400, 'Parameter limit tidak valid. Gunakan 1-100.');
  }

  const parsedIsMentor = parseBooleanQuery(isMentor);
  if (isMentor !== undefined && parsedIsMentor === null) {
    throw createHttpError(400, 'Parameter isMentor harus true/false.');
  }

  const normalizedAuthorType = authorType
    ? AUTHOR_TYPE_VALUES[String(authorType).trim().toLowerCase()]
    : null;
  if (authorType !== undefined && !normalizedAuthorType) {
    throw createHttpError(400, 'Parameter authorType harus ALUMNI, ALUMNIMENTOR, atau STUDENT.');
  }

  const tagList = parseTagsQuery(tags);
  const orderDirection = parsedSortDesc ? 'desc' : 'asc';
  const skip = (parsedPage - 1) * parsedLimit;

  const where = { deletedAt: null };

  if (searchTerm) {
    const term = String(searchTerm).trim();
    if (term.length > 0) {
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { content: { contains: term, mode: 'insensitive' } },
      ];
    }
  }

  if (tagList.length > 0) {
    where.tags = {
      some: {
        tag: {
          name: { in: tagList },
        },
      },
    };
  }

  if (parsedIsMentor !== undefined) {
    where.author = parsedIsMentor
      ? { role: 'AlumniMentor' }
      : { role: { not: 'AlumniMentor' } };
  }

  if (normalizedAuthorType) {
    where.comments = {
      some: {
        deletedAt: null,
        author: { role: normalizedAuthorType },
      },
    };
  }

  if (normalizedSortBy === 'trending') {
    const trendingStart = new Date(Date.now() - 72 * 60 * 60 * 1000);
    const threadIdRows = await prisma.thread.findMany({
      where,
      select: { id: true },
    });
    const threadIds = threadIdRows.map((row) => row.id);

    if (threadIds.length === 0) {
      return {
        meta: {
          currentPage: parsedPage,
          limit: parsedLimit,
          totalItems: 0,
          totalPages: 0,
        },
        data: [],
      };
    }

    const actionWhere = {
      threadId: { in: threadIds },
      createdAt: { gte: trendingStart },
    };

    const totalItems = await prisma.threadAction.count({
      where: actionWhere,
      distinct: ['threadId'],
    });

    const actionCounts = await prisma.threadAction.groupBy({
      by: ['threadId'],
      where: actionWhere,
      _count: { _all: true },
      orderBy: { _count: { _all: orderDirection } },
      skip,
      take: parsedLimit,
    });

    const orderedThreadIds = actionCounts.map((item) => item.threadId);
    const threads = await prisma.thread.findMany({
      where: { id: { in: orderedThreadIds } },
      include: {
        author: true,
        tags: { include: { tag: true } },
      },
    });
    const threadMap = new Map(threads.map((thread) => [thread.id, thread]));

    return {
      meta: {
        currentPage: parsedPage,
        limit: parsedLimit,
        totalItems,
        totalPages: Math.ceil(totalItems / parsedLimit),
      },
      data: orderedThreadIds.map((id) => threadMap.get(id)).filter(Boolean),
    };
  }

  const orderBy =
    normalizedSortBy === 'popular'
      ? [
          { actions: { _count: orderDirection } },
          { createdAt: 'desc' },
          { id: 'asc' },
        ]
      : [
          { createdAt: orderDirection },
          { id: 'asc' },
        ];

  const [items, totalItems] = await Promise.all([
    prisma.thread.findMany({
      skip,
      take: parsedLimit,
      where,
      orderBy,
      include: {
        author: true,
        tags: { include: { tag: true } },
      },
    }),
    prisma.thread.count({ where })
  ]);

  return {
    meta: {
      currentPage: parsedPage,
      limit: parsedLimit,
      totalItems,
      totalPages: Math.ceil(totalItems / parsedLimit)
    },
    data: items
  };
};

export const getThreadById = async (id, userId) => {
  return await prisma.thread.findUnique({
    where: { id: Number(id) },
    include: {
      author: true,
      tags: { include: { tag: true } },
    }
  });
};

export const createThread = async (userId, data) => {
  return await prisma.thread.create({
    data: {
      ...data,
      authorId: userId,
    }
  });
};

export const updateThread = async (id, userId, data) => {
  return await prisma.thread.update({
    where: { id: Number(id) },
    data
  });
};

export const deleteThread = async (id, userId) => {
  return await prisma.thread.update({
    where: { id: Number(id) },
    data: { deletedAt: new Date() }
  });
};

export const saveThread = async (id, userId) => {
  return await prisma.threadAction.create({
    data: {
      threadId: Number(id),
      userId,
      action: 'SAVE'
    }
  });
};

export const unsaveThread = async (id, userId) => {
  return await prisma.threadAction.deleteMany({
    where: { threadId: Number(id), userId, action: 'SAVE' }
  });
};

export const getThreadComments = async (id, query, userId) => {
  const { page = 1, limit = 10, sortBy = 'newest' } = query;
  const normalizedSortBy = String(sortBy).trim().toLowerCase();

  if (!COMMENT_SORT_BY_VALUES.has(normalizedSortBy)) {
    throw createHttpError(400, 'Parameter sortBy harus popular atau newest.');
  }

  const parsedPage = Number.parseInt(String(page), 10);
  const parsedLimit = Number.parseInt(String(limit), 10);
  if (Number.isNaN(parsedPage) || parsedPage < 1) {
    throw createHttpError(400, 'Parameter page tidak valid.');
  }
  if (Number.isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
    throw createHttpError(400, 'Parameter limit tidak valid. Gunakan 1-100.');
  }

  const skip = (parsedPage - 1) * parsedLimit;
  const baseWhere = { threadId: Number(id), deletedAt: null };

  if (normalizedSortBy === 'popular') {
    const commentMeta = await prisma.threadComment.findMany({
      where: baseWhere,
      select: { id: true, createdAt: true },
    });

    if (commentMeta.length === 0) {
      return {
        meta: {
          currentPage: parsedPage,
          limit: parsedLimit,
          totalItems: 0,
          totalPages: 0,
        },
        data: [],
      };
    }

    const likeCounts = await prisma.commentLike.groupBy({
      by: ['commentId'],
      where: {
        comment: { threadId: Number(id), deletedAt: null },
      },
      _count: { _all: true },
    });

    const likeMap = new Map(
      likeCounts.map((row) => [row.commentId, row._count._all])
    );

    const sortedIds = commentMeta
      .slice()
      .sort((a, b) => {
        const countA = likeMap.get(a.id) ?? 0;
        const countB = likeMap.get(b.id) ?? 0;
        if (countA !== countB) return countB - countA;
        if (a.createdAt.getTime() !== b.createdAt.getTime()) {
          return b.createdAt.getTime() - a.createdAt.getTime();
        }
        return a.id - b.id;
      })
      .map((item) => item.id);

    const totalItems = sortedIds.length;
    const pagedIds = sortedIds.slice(skip, skip + parsedLimit);

    if (pagedIds.length === 0) {
      return {
        meta: {
          currentPage: parsedPage,
          limit: parsedLimit,
          totalItems,
          totalPages: Math.ceil(totalItems / parsedLimit),
        },
        data: [],
      };
    }

    const comments = await prisma.threadComment.findMany({
      where: { id: { in: pagedIds } },
      include: { author: true },
    });

    const commentMap = new Map(comments.map((comment) => [comment.id, comment]));

    return {
      meta: {
        currentPage: parsedPage,
        limit: parsedLimit,
        totalItems,
        totalPages: Math.ceil(totalItems / parsedLimit),
      },
      data: pagedIds.map((commentId) => commentMap.get(commentId)).filter(Boolean),
    };
  }

  const [items, totalItems] = await Promise.all([
    prisma.threadComment.findMany({
      where: baseWhere,
      skip,
      take: parsedLimit,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      include: { author: true }
    }),
    prisma.threadComment.count({ where: baseWhere })
  ]);

  return {
    meta: {
      currentPage: parsedPage,
      limit: parsedLimit,
      totalItems,
      totalPages: Math.ceil(totalItems / parsedLimit)
    },
    data: items
  };
};

export const createThreadComment = async (id, userId, data) => {
  return await prisma.threadComment.create({
    data: {
      ...data,
      threadId: Number(id),
      authorId: userId
    }
  });
};

export const getRelatedThreads = async (id) => {
  const threadId = Number(id);
  if (Number.isNaN(threadId)) return [];

  const currentThread = await prisma.thread.findUnique({
    where: { id: threadId },
    include: { tags: { include: { tag: true } } },
  });

  if (!currentThread) return [];

  const tagNames = currentThread.tags
    .map((item) => item.tag?.name)
    .filter((name) => typeof name === 'string' && name.trim().length > 0);

  const titleKeywords = String(currentThread.title || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map((word) => word.trim())
    .filter((word) => word.length >= 3);

  const keywordSet = new Set(titleKeywords);
  const keywords = Array.from(keywordSet).slice(0, 10);

  const orConditions = [];
  if (tagNames.length > 0) {
    orConditions.push({
      tags: {
        some: {
          tag: { name: { in: tagNames } },
        },
      },
    });
  }
  if (keywords.length > 0) {
    orConditions.push({
      OR: keywords.map((word) => ({
        title: { contains: word, mode: 'insensitive' },
      })),
    });
  }

  if (orConditions.length === 0) return [];

  const relatedMeta = await prisma.thread.findMany({
    where: {
      deletedAt: null,
      id: { not: threadId },
      OR: orConditions,
    },
    select: { id: true, createdAt: true },
  });

  if (relatedMeta.length === 0) return [];

  const relatedIds = relatedMeta.map((item) => item.id);
  const viewCounts = await prisma.threadAction.groupBy({
    by: ['threadId'],
    where: {
      threadId: { in: relatedIds },
      action: 'VIEW',
    },
    _count: { _all: true },
  });

  const viewMap = new Map(viewCounts.map((row) => [row.threadId, row._count._all]));
  const metaMap = new Map(relatedMeta.map((row) => [row.id, row]));

  const sortedIds = relatedIds
    .slice()
    .sort((a, b) => {
      const countA = viewMap.get(a) ?? 0;
      const countB = viewMap.get(b) ?? 0;
      if (countA !== countB) return countB - countA;
      const createdA = metaMap.get(a)?.createdAt?.getTime() ?? 0;
      const createdB = metaMap.get(b)?.createdAt?.getTime() ?? 0;
      if (createdA !== createdB) return createdB - createdA;
      return a - b;
    })
    .slice(0, 5);

  if (sortedIds.length === 0) return [];

  const threads = await prisma.thread.findMany({
    where: { id: { in: sortedIds } },
    include: {
      author: true,
      tags: { include: { tag: true } },
    },
  });

  const threadMap = new Map(threads.map((thread) => [thread.id, thread]));
  return sortedIds.map((relatedId) => threadMap.get(relatedId)).filter(Boolean);
};

export const setBestAnswer = async (commentId, userId) => {
  return await prisma.threadComment.update({
    where: { id: Number(commentId) },
    data: { isBestAnswer: true }
  });
};

export const likeComment = async (commentId, userId) => {
  return await prisma.commentLike.create({
    data: {
      commentId: Number(commentId),
      userId
    }
  });
};

export const unlikeComment = async (commentId, userId) => {
  return await prisma.commentLike.delete({
    where: {
      userId_commentId: {
        userId,
        commentId: Number(commentId)
      }
    }
  });
};

export const deleteComment = async (commentId, userId) => {
  return await prisma.threadComment.update({
    where: { id: Number(commentId) },
    data: { deletedAt: new Date() }
  });
};
