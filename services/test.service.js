import prisma from "../prisma/client.js";

export const getTestData = async () => {
  try {
    const data = await prisma.test.findMany();
    return data;
  } catch (error) {
    throw error;
  }
};