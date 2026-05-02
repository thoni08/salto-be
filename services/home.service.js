import prisma from '../prisma/client.js';

export async function getHomeStatsService() {
  try {
    const [studentCount, alumniCount, threadCount, tagCounts] = await Promise.all([
      prisma.user.count({
        where: { deletedAt: null, role: 'Student' },
      }),
      prisma.user.count({
        where: { deletedAt: null, role: { in: ['Alumni', 'AlumniMentor'] } },
      }),
      prisma.thread.count({
        where: { deletedAt: null },
      }),
      prisma.threadTag.groupBy({
        by: ['tagId'],
        where: {
          thread: { deletedAt: null },
          tag: { deletedAt: null },
        },
        _count: { _all: true },
        orderBy: { _count: { _all: 'desc' } },
        take: 5,
      }),
    ]);

    const tagIds = tagCounts.map((row) => row.tagId);
    const tags = tagIds.length
      ? await prisma.tag.findMany({
          where: { id: { in: tagIds } },
          select: { id: true, name: true },
        })
      : [];

    const tagMap = new Map(tags.map((tag) => [tag.id, tag]));
    const topTags = tagCounts
      .map((row) => {
        const tag = tagMap.get(row.tagId);
        if (!tag) return null;
        return {
          id: tag.id,
          name: tag.name,
          threadCount: row._count._all,
        };
      })
      .filter(Boolean);

    return {
      status: 200,
      data: {
        totalStudents: studentCount,
        totalAlumni: alumniCount,
        totalThreads: threadCount,
        topTags,
      },
    };
  } catch (error) {
    return { status: 500, error: error.message };
  }
}
