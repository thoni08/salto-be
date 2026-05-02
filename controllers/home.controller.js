import asyncHandler from '../utils/asyncHandler.js';
import { getHomeStatsService } from '../services/home.service.js';

export const getHomeStats = asyncHandler(async (req, res) => {
	const result = await getHomeStatsService();
	if (result.error) {
		return res.status(result.status || 500).json({ message: result.error });
	}

	return res.status(result.status || 200).json({
		message: 'Home stats berhasil diambil',
		data: result.data,
	});
});
