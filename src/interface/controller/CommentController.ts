import { Pool } from "pg";
import {
  postComment,
  getCommentsUsecase,
  deleteCommentUsecase,
} from "@/application/usecase/CommentUsecase";
import type { Comment } from "@/infrastructure/dao/CommentDao";

/**
 * Podcastにコメントを投稿
 */
export const postCommentController = async (
  podcastId: string,
  userId: string,
  comment: string,
  pool: Pool
): Promise<void> => {
  try {
    await postComment(podcastId, userId, comment, pool);
  } catch (error) {
    console.error("Error posting comment:", error);
    throw new Error("Failed to post comment");
  }
};

/**
 * Podcastのコメント一覧を取得
 */
export const getCommentsController = async (
  podcastId: string,
  pool: Pool
): Promise<Comment[]> => {
  try {
    return await getCommentsUsecase(podcastId, pool);
  } catch (error) {
    console.error("Error getting comments:", error);
    throw new Error("Failed to get comments");
  }
};

/**
 * コメントを削除
 */
export const deleteCommentController = async (
  commentId: string,
  userId: string,
  pool: Pool
): Promise<void> => {
  try {
    await deleteCommentUsecase(commentId, userId, pool);
  } catch (error) {
    console.error("Error deleting comment:", error);
    throw new Error("Failed to delete comment");
  }
};
