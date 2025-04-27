import { Pool } from "pg";
import { v4 as uuidv4 } from "uuid";

export const addLike = async (
  pool: Pool,
  postId: string,
  userId: string
): Promise<void> => {
  try {
    await pool.query(
      `INSERT INTO likes (post_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (post_id, user_id) DO NOTHING`,
      [postId, userId]
    );
  } catch (error) {
    console.error("Error adding like:", error);
    throw new Error("Failed to add like");
  }
};

export const removeLike = async (
  pool: Pool,
  postId: string,
  userId: string
): Promise<void> => {
  try {
    await pool.query(`DELETE FROM likes WHERE post_id = $1 AND user_id = $2`, [
      postId,
      userId,
    ]);
  } catch (error) {
    console.error("Error removing like:", error);
    throw new Error("Failed to remove like");
  }
};

export const countLikes = async (
  pool: Pool,
  postId: string
): Promise<number> => {
  try {
    const res = await pool.query(
      `SELECT COUNT(*) FROM likes WHERE post_id = $1`,
      [postId]
    );
    return parseInt(res.rows[0].count, 10);
  } catch (error) {
    console.error("Error counting likes:", error);
    throw new Error("Failed to count likes");
  }
};
