import { Pool } from "pg";
import { addLike, removeLike, countLikes } from "@/infrastructure/dao/LikeDao";

/**
 * PodcastにLikeを追加
 */
export const postLike = async (
  podcastId: string,
  userId: string,
  pool: Pool
): Promise<void> => {
  try {
    await addLike(pool, podcastId, userId);
  }
  catch (error) {
    console.error('Error adding like:', error);
    throw new Error('Failed to add like');
  }
};

/**
 * PodcastのLikeを削除
 */
export const deleteLike = async (
  podcastId: string,
  userId: string,
  pool: Pool
): Promise<void> => {
  try {
    await removeLike(pool, podcastId, userId);
  }
  catch (error) {
    console.error('Error removing like:', error);
    throw new Error('Failed to remove like');
  }
};

// /**
//  * PodcastのLike数を取得
//  */
// export const getLikeCount = async (
//   podcastId: string,
//   pool: Pool
// ): Promise<number> => {
//   return await countLikes(pool, podcastId);
// };
