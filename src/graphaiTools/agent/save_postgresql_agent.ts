import { AgentFunction, AgentFunctionInfo } from "graphai";
import { Pool } from "pg";

const savePostgresqlAgent: AgentFunction = async ({ params, namedInputs }) => {
  const pool = params.pool;
  const {
    id,
    title,
    padding,
    description,
    script,
    created_by,
    created_at,
    reference,
    tts,
    voices,
    speakers,
  } = namedInputs.meta;

  const url = namedInputs.url;

  const scriptJson = JSON.stringify(script);

  try {
    const result = await pool.query(
      "INSERT INTO audio (id, title, padding, description, script, created_by, created_at, reference, tts, voices, speakers, url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *",
      [
        id,
        title,
        padding,
        description,
        scriptJson,
        created_by,
        created_at,
        reference,
        tts,
        voices,
        speakers,
        url,
      ]
    );
    return { result: result.rows[0] };
  } catch (e) {
    console.error(e);
    throw e;
  }
};

const sampleScript = [
  {
    speaker: "Host",
    text: "Hello.This is a test podcast.",
  },
  {
    speaker: "Host",
    text: "Bye.",
  },
];

const createdAt = new Date("2000-01-01T00:00:00Z"); // UTC

const sampleInput = {
  meta: {
    id: "test_id",
    title: "test_title",
    padding: 0,
    description: "test_description",
    script: sampleScript,
    created_by: "created_by",
    created_at: createdAt,
    reference: ["reference"],
    tts: "tts",
    voices: ["voice_test"],
    speakers: ["host_test"],
  },
};
const postgre_pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: parseInt(process.env.PG_PORT || "5432"),
});
const sampleParams = {
  pool: postgre_pool,
};
const sampleResult = {
  error: null,
  message: {
    id: "test_id",
    title: "test_title",
    padding: 0,
    description: "test_description",
    script: sampleScript,
    created_by: "created_by",
    created_at: createdAt,
    reference: ["reference"],
    tts: "tts",
    voices: ["voice_test"],
    speakers: ["host_test"],
  },
};

const savePostgresqlAgentInfo: AgentFunctionInfo = {
  name: "savePostgresqlAgent",
  agent: savePostgresqlAgent,
  mock: savePostgresqlAgent,
  samples: [
    {
      inputs: sampleInput,
      params: sampleParams,
      result: sampleResult,
    },
  ],
  description: "Save audio to PostgreSQL",
  category: ["db"],
  author: "Kazumasa Sugawara",
  repository: "",
  license: "",
};

export default savePostgresqlAgentInfo;
