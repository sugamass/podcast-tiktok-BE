import { Pool } from "pg";
import {
  addComment,
  getComments,
  deleteComment,
  Comment,
} from "@/infrastructure/dao/CommentDao";

/**
 * コメントを追加
 */
export const postComment = async (
  podcastId: string,
  userId: string,
  comment: string,
  pool: Pool
): Promise<void> => {
  try {
    await addComment(pool, podcastId, userId, comment);
  } catch (error) {
    console.error("Error posting comment:", error);
    throw new Error("Failed to post comment");
  }
};

/**
 * コメント一覧を取得
 */
export const getCommentsUsecase = async (
  podcastId: string,
  pool: Pool
): Promise<Comment[]> => {
  try {
    return await getComments(pool, podcastId);
  } catch (error) {
    console.error("Error getting comments:", error);
    throw new Error("Failed to get comments");
  }
};

/**
 * コメントを削除
 */
export const deleteCommentUsecase = async (
  commentId: string,
  userId: string,
  pool: Pool
): Promise<void> => {
  try {
    await deleteComment(pool, commentId, userId);
  } catch (error) {
    console.error("Error deleting comment:", error);
    throw new Error("Failed to delete comment");
  }
};
