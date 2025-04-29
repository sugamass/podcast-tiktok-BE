import { Pool } from "pg";
import { v4 as uuidv4 } from "uuid";

export interface Comment {
  id: string;
  podcast_id: string;
  comment: string;
  created_by: string;
  created_at: string;
}

/**
 * コメントを追加
 */
export const addComment = async (
  pool: Pool,
  postId: string,
  userId: string,
  comment: string
): Promise<void> => {
  try {
    const id = uuidv4();
    const createdAt = new Date().toISOString();
    const res = await pool.query(
      `INSERT INTO comments (id, post_id, comment, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, postId, comment, userId, createdAt]
    );
    return;
  } catch (error) {
    console.error("Error adding comment:", error);
    throw new Error("Failed to add comment");
  }
};

/**
 * コメント一覧を取得
 */
export const getComments = async (
  pool: Pool,
  podcastId: string
): Promise<Comment[]> => {
  try {
    const res = await pool.query(
      `SELECT *
       FROM comments
       WHERE post_id = $1
       ORDER BY created_at ASC`,
      [podcastId]
    );
    return res.rows;
  } catch (error) {
    console.error("Error getting comments:", error);
    throw new Error("Failed to get comments");
  }
};

/**
 * コメントを削除
 */
export const deleteComment = async (
  pool: Pool,
  commentId: string,
  userId: string
): Promise<void> => {
  // TODO
  if (userId !== "test_user") {
    throw new Error("Unauthorized user");
  }
  try {
    // created_byが一致する場合のみ削除
    await pool.query(`DELETE FROM comments WHERE id = $1 AND created_by = $2`, [
      commentId,
      userId,
    ]);
  } catch (error) {
    console.error("Error deleting comment:", error);
    throw new Error("Failed to delete comment");
  }
};
