import asyncHandler from '../utils/asyncHandler.js';
import * as threadService from '../services/thread.service.js';

export const getThreads = asyncHandler(async (req, res) => {
  const result = await threadService.getThreads(req.query);
  res.json({ success: true, ...result });
});

export const getThreadById = asyncHandler(async (req, res) => {
  const result = await threadService.getThreadById(req.params.id, req.user?.id);
  res.json({ success: true, data: result });
});

export const createThread = asyncHandler(async (req, res) => {
  const result = await threadService.createThread(req.user.id, req.body);
  res.status(201).json({ success: true, data: result });
});

export const updateThread = asyncHandler(async (req, res) => {
  const result = await threadService.updateThread(req.params.id, req.user.id, req.body);
  res.json({ success: true, data: result });
});

export const deleteThread = asyncHandler(async (req, res) => {
  await threadService.deleteThread(req.params.id, req.user.id);
  res.json({ success: true, message: 'Thread deleted successfully' });
});

export const saveThread = asyncHandler(async (req, res) => {
  await threadService.saveThread(req.params.id, req.user.id);
  res.json({ success: true, message: 'Thread saved successfully' });
});

export const unsaveThread = asyncHandler(async (req, res) => {
  await threadService.unsaveThread(req.params.id, req.user.id);
  res.json({ success: true, message: 'Thread unsaved successfully' });
});

export const getThreadComments = asyncHandler(async (req, res) => {
  const result = await threadService.getThreadComments(req.params.id, req.query, req.user?.id);
  res.json({ success: true, ...result });
});

export const createThreadComment = asyncHandler(async (req, res) => {
  const result = await threadService.createThreadComment(req.params.id, req.user.id, req.body);
  res.status(201).json({ success: true, data: result });
});

export const getRelatedThreads = asyncHandler(async (req, res) => {
  const result = await threadService.getRelatedThreads(req.params.id);
  res.json({ success: true, data: result });
});

export const setBestAnswer = asyncHandler(async (req, res) => {
  const result = await threadService.setBestAnswer(req.params.commentId, req.user.id);
  res.json({ success: true, data: result });
});

export const likeComment = asyncHandler(async (req, res) => {
  await threadService.likeComment(req.params.commentId, req.user.id);
  res.json({ success: true, message: 'Comment liked successfully' });
});

export const unlikeComment = asyncHandler(async (req, res) => {
  await threadService.unlikeComment(req.params.commentId, req.user.id);
  res.json({ success: true, message: 'Comment unliked successfully' });
});

export const deleteComment = asyncHandler(async (req, res) => {
  await threadService.deleteComment(req.params.commentId, req.user.id);
  res.json({ success: true, message: 'Comment deleted successfully' });
});
