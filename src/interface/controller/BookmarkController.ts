import { Pool } from "pg";
import {
  postBookmark,
  deleteBookmark,
  getBookmarkStatus,
} from "@/application/usecase/BookmarkUsecase";
import type { BookmarkResponse } from "@/interface/type/bookmark";

/**
 * ブックマークを追加
 */
export const postBookmarkController = async (
  podcastId: string,
  userId: string,
  pool: Pool
): Promise<BookmarkResponse> => {
  try {
    await postBookmark(podcastId, userId, pool);
    return { bookmarked: true };
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
): Promise<BookmarkResponse> => {
  try {
    await deleteBookmark(podcastId, userId, pool);
    return { bookmarked: false };
  } catch (error) {
    console.error("ブックマーク削除エラー:", error);
    throw new Error("ブックマークの削除に失敗");
  }
};

/**
 * ブックマーク状態を取得
 */
export const getBookmarkStatusController = async (
  podcastId: string,
  userId: string,
  pool: Pool
): Promise<BookmarkResponse> => {
  try {
    const bookmarked = await getBookmarkStatus(podcastId, userId, pool);
    return { bookmarked };
  } catch (error) {
    console.error("ブックマーク状態取得エラー:", error);
    throw new Error("ブックマーク状態の取得に失敗");
  }
};
