import { Pool } from "pg";
import { postLike, deleteLike } from "@/application/usecase/LikeUsecase";
import type { components } from "../type/like";

/**
 * PodcastにLikeを追加
 */
export const postLikeController = async (
  podcastId: string,
  userId: string,
  pool: Pool
): Promise<void> => {
  try {
    await postLike(podcastId, userId, pool);
  } catch (error) {
    console.error("Error adding like:", error);
    throw new Error("Failed to add like");
  }
};

/**
 * PodcastのLikeを削除
 */
export const deleteLikeController = async (
  podcastId: string,
  userId: string,
  pool: Pool
): Promise<void> => {
  try {
    await deleteLike(podcastId, userId, pool);
  } catch (error) {
    console.error("Error removing like:", error);
    throw new Error("Failed to remove like");
  }
};

// /**
//  * PodcastのLike数を取得
//  */
// export const getLikeCountController = async (
//   podcastId: string,
//   pool: Pool
// ): Promise<LikeCountResponse> => {
//   const count = await getLikeCount(podcastId, pool);
//   return { count };
// };
