import { Pool } from "pg";
import {
  addBookmark,
  removeBookmark,
  checkBookmark,
} from "@/infrastructure/dao/BookmarkDao";

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

/**
 * ブックマーク状態を取得
 */
export const getBookmarkStatus = async (
  podcastId: string,
  userId: string,
  pool: Pool
): Promise<boolean> => {
  try {
    return await checkBookmark(pool, podcastId, userId);
  } catch (error) {
    console.error("Error checking bookmark status:", error);
    throw new Error("Failed to get bookmark status");
  }
};
