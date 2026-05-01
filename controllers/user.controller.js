import {
  getUsersService,
  getUserService,
  createUserService,
  updateUserService,
  deleteUserService,
  followUserService,
  unfollowUserService,
  isFollowingService,
  parseUserId,
  parseBooleanQuery,
  ROLE_VALUES,
  DEGREE_VALUES,
  isValidEmail
} from '../services/user.service.js';

const ensureTargetUserId = (req, res) => {
  const authUserId = parseUserId(req.user?.id);
  if (!authUserId) {
    res.status(401).json({ message: 'Token user tidak valid' });
    return null;
  }
  const requestedId = req.params.id;
  if (!requestedId) return authUserId;
  const targetUserId = parseUserId(requestedId);
  if (!targetUserId) {
    res.status(400).json({ message: 'Format id user tidak valid' });
    return null;
  }
  const isAdmin = req.user?.role === 'Admin';
  if (!isAdmin && targetUserId !== authUserId) {
    res.status(403).json({ message: 'Akses ditolak. ID hanya bisa dipakai admin.' });
    return null;
  }
  return targetUserId;
};

export const GetUsers = async (req, res) => {
  const result = await getUsersService(req.query);
  if (result.error) {
    return res.status(result.status || 500).json({ message: result.error });
  }
  return res.status(result.status || 200).json({
    message: 'Data users berhasil diambil',
    data: result.data,
    pagination: result.pagination,
  });
};

export const GetUser = async (req, res) => {
  const targetUserId = ensureTargetUserId(req, res);
  if (!targetUserId) return;
  const result = await getUserService(targetUserId);
  if (result.error) {
    return res.status(result.status || 500).json({ message: result.error });
  }
  return res.status(result.status || 200).json({ message: 'Data user berhasil diambil', data: result.data });
};

export const CreateUser = async (req, res) => {
  if (req.user?.role !== 'Admin') {
    return res.status(403).json({ message: 'Akses ditolak. Admin only.' });
  }
  const result = await createUserService(req.body);
  if (result.error) {
    return res.status(result.status || 500).json({ message: result.error });
  }
  return res.status(result.status || 201).json({ message: 'User berhasil dibuat', data: result.data });
};

export const UpdateUser = async (req, res) => {
  const targetUserId = ensureTargetUserId(req, res);
  if (!targetUserId) return;
  const result = await updateUserService(targetUserId, req.body);
  if (result.error) {
    return res.status(result.status || 500).json({ message: result.error });
  }
  return res.status(result.status || 200).json({ message: 'User berhasil diupdate', data: result.data });
};

export const DeleteUser = async (req, res) => {
  if (req.user?.role !== 'Admin') {
    return res.status(403).json({ message: 'Akses ditolak. Admin only.' });
  }
  const targetUserId = parseUserId(req.params.id);
  if (!targetUserId) {
    return res.status(400).json({ message: 'Format id user tidak valid' });
  }
  const result = await deleteUserService(targetUserId);
  if (result.error) {
    return res.status(result.status || 500).json({ message: result.error });
  }
  return res.status(result.status || 200).json({ message: 'User berhasil dihapus' });
};

export const FollowUser = async (req, res) => {
  const authUserId = parseUserId(req.user?.id);
  if (!authUserId) {
    return res.status(401).json({ message: 'Token user tidak valid' });
  }

  const { userId } = req.body;
  const targetUserId = parseUserId(userId);
  if (!targetUserId) {
    return res.status(400).json({ message: 'Format userId tidak valid' });
  }

  const result = await followUserService(authUserId, targetUserId);
  if (result.error) {
    return res.status(result.status || 500).json({ message: result.error });
  }
  return res.status(result.status || 201).json({
    message: 'Berhasil follow user',
    data: result.data,
  });
};

export const UnfollowUser = async (req, res) => {
  const authUserId = parseUserId(req.user?.id);
  if (!authUserId) {
    return res.status(401).json({ message: 'Token user tidak valid' });
  }

  const { userId } = req.body;
  const targetUserId = parseUserId(userId);
  if (!targetUserId) {
    return res.status(400).json({ message: 'Format userId tidak valid' });
  }

  const result = await unfollowUserService(authUserId, targetUserId);
  if (result.error) {
    return res.status(result.status || 500).json({ message: result.error });
  }
  return res.status(result.status || 200).json({
    message: 'Berhasil unfollow user',
    data: result.data,
  });
};

export const IsFollowing = async (req, res) => {
  const authUserId = parseUserId(req.user?.id);
  if (!authUserId) {
    return res.status(401).json({ message: 'Token user tidak valid' });
  }

  const { userId } = req.params;
  const targetUserId = parseUserId(userId);
  if (!targetUserId) {
    return res.status(400).json({ message: 'Format userId tidak valid' });
  }

  const result = await isFollowingService(authUserId, targetUserId);
  if (result.error) {
    return res.status(result.status || 500).json({ message: result.error });
  }
  return res.status(result.status || 200).json({
    message: 'Status follow berhasil diambil',
    data: result.data,
  });
};
