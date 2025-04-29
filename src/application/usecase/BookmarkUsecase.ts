import { Pool } from "pg";
import { addBookmark, removeBookmark } from "@/infrastructure/dao/BookmarkDao";

/**
 * ブックマークを追加
 */
export const postBookmark = async (
  podcastId: string,
  userId: string,
  pool: Pool
): Promise<void> => {
  try {
    await addBookmark(pool, podcastId, userId);
  } catch (error) {
    console.error("Error adding bookmark:", error);
    throw new Error("Failed to add bookmark");
  }
};

/**
 * ブックマークを削除
 */
export const deleteBookmark = async (
  podcastId: string,
  userId: string,
  pool: Pool
): Promise<void> => {
  try {
    await removeBookmark(pool, podcastId, userId);
  } catch (error) {
    console.error("Error removing bookmark:", error);
    throw new Error("Failed to remove bookmark");
  }
};
