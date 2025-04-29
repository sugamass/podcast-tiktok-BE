import { Pool } from "pg";

/**
 * ブックマークを追加
 */
export const addBookmark = async (
  pool: Pool,
  podcastId: string,
  userId: string
): Promise<void> => {
  try {
    await pool.query(
      "INSERT INTO bookmarks (user_id, post_id) VALUES ($1, $2)",
      [userId, podcastId]
    );
  } catch (error) {
    console.error("Error adding bookmark:", error);
    throw error;
  }
};

/**
 * ブックマークを削除
 */
export const removeBookmark = async (
  pool: Pool,
  podcastId: string,
  userId: string
): Promise<void> => {
  try {
    await pool.query(
      "DELETE FROM bookmarks WHERE user_id = $1 AND post_id = $2",
      [userId, podcastId]
    );
  } catch (error) {
    console.error("Error removing bookmark:", error);
    throw error;
  }
};

/**
 * ブックマーク状態を確認
 */
export const checkBookmark = async (
  pool: Pool,
  podcastId: string,
  userId: string
): Promise<boolean> => {
  try {
    const result = await pool.query(
      "SELECT 1 FROM bookmarks WHERE user_id = $1 AND post_id = $2",
      [userId, podcastId]
    );
    return (result.rowCount || 0) > 0;
  } catch (error) {
    console.error("Error checking bookmark:", error);
    throw error;
  }
};
