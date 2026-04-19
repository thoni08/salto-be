import { getTestData } from "../services/test.service.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getTest = asyncHandler(async (req, res) => {
  const data = await getTestData();
  res.status(200).json({ success: true, data });
});