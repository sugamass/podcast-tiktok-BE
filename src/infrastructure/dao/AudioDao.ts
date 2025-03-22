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

export const postAudioDao = async (
  pool: Pool,
  audioData: AudioData
): Promise<AudioData> => {
  const scriptJson = JSON.stringify(audioData.script);

  const query =
    "INSERT INTO audio (id, title, padding, description, script, created_by, created_at, reference, tts, voices, speakers, url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *";
  const res = await pool.query(query, [
    audioData.id,
    audioData.title,
    undefined, // TODO padding
    audioData.description,
    scriptJson,
    audioData.created_by,
    audioData.created_at,
    audioData.reference,
    audioData.tts,
    audioData.voices,
    audioData.speakers,
    audioData.url,
  ]);

  return {
    id: res.rows[0].id,
    url: res.rows[0].url,
    title: res.rows[0].title,
    description: res.rows[0].description,
    reference: res.rows[0].reference,
    tts: res.rows[0].tts,
    voices: res.rows[0].voices,
    speakers: res.rows[0].speakers,
    script: res.rows[0].script,
    created_by: res.rows[0].created_by,
    created_at: res.rows[0].created_at,
  };
};
