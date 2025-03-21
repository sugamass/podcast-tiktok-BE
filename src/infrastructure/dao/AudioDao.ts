import { AudioData } from "@/domain/Audio";
import { Pool } from "pg";

export const getAudioDao = async (pool: Pool): Promise<AudioData[]> => {
  const query = "SELECT * FROM audio ORDER BY RANDOM() LIMIT 10";
  const res = await pool.query(query);

  const audioData: AudioData[] = res.rows.map((row) => {
    return {
      id: row.id,
      url: row.url,
      title: row.title,
      description: row.description,
      reference: row.reference,
      tts: row.tts,
      voices: row.voices,
      speakers: row.speakers,
      script: row.script,
      created_by: row.created_by,
      created_at: row.created_at,
    };
  });

  return audioData;
};

export const getMypostDao = async (
  pool: Pool,
  userId: string
): Promise<AudioData[]> => {
  const query =
    "SELECT * FROM audio WHERE created_by = $1 ORDER BY created_at DESC;";
  const res = await pool.query(query, [userId]);

  const audioData: AudioData[] = res.rows.map((row) => {
    return {
      id: row.id,
      url: row.url,
      title: row.title,
      description: row.description,
      reference: row.reference,
      tts: row.tts,
      voices: row.voices,
      speakers: row.speakers,
      script: row.script,
      created_by: row.created_by,
      created_at: row.created_at,
    };
  });

  return audioData;
};
