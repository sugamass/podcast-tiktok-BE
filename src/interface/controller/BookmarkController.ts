import { Pool } from "pg";
import {
  postBookmark,
  deleteBookmark,
} from "@/application/usecase/BookmarkUsecase";

/**
 * ブックマークを追加
 */
export const postBookmarkController = async (
  podcastId: string,
  userId: string,
  pool: Pool
): Promise<void> => {
  try {
    await postBookmark(podcastId, userId, pool);
  } catch (error) {
    console.error("Error adding bookmark:", error);
    throw new Error("Failed to add bookmark");
  }
};

/**
 * ブックマークを削除
 */
export const deleteBookmarkController = async (
  podcastId: string,
  userId: string,
  pool: Pool
): Promise<void> => {
  try {
    await deleteBookmark(podcastId, userId, pool);
  } catch (error) {
    console.error("ブックマーク削除エラー:", error);
    throw new Error("ブックマークの削除に失敗");
  }
};
