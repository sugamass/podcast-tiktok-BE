import express, { Request, Response, NextFunction } from "express";
import { Pool } from "pg";
import {
  postAudioController,
  getAudioController,
  postAudioTestController,
} from "@/interface/controller/AudioController";
import { postScriptController } from "@/interface/controller/ScriptController";
import path from "path";
import fs from "fs";

const app = express();
const port = process.env.PORT || 3000;

const postgre_pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: parseInt(process.env.PG_PORT || "5432"),
});

// JSON ボディのパースを有効化
app.use(express.json());

// ローカルストレージのファイルを公開
app.use("/stream", express.static(path.join(__dirname, "tmpStorage")));

// POST /audio エンドポイントの定義
app.post(
  "/audio",
  // ログ出力用ミドルウェア
  (req: Request, res: Response, next: NextFunction) => {
    console.log("POST /audio 受信:", req.body);
    next();
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await postAudioController(req.body, postgre_pool);
      res.status(200).json(result);
    } catch (error) {
      console.error("postAudioController error:", error);
      res.status(500).json({
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  }
);

// POST /audio/test エンドポイントの定義
app.post(
  "/audio/test",
  // ログ出力用ミドルウェア
  (req: Request, res: Response, next: NextFunction) => {
    console.log("POST /audio/test 受信:", req.body);
    next();
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await postAudioTestController(req.body);
      res.status(200).json(result);
    } catch (error) {
      console.error("postAudioTestController error:", error);
      res.status(500).json({
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  }
);

// GET / audio;
app.get("/audio", async (req: Request, res: Response) => {
  try {
    const type = req.query.type as string;
    const userId = req.query.user_id as string;

    // user_idの取得方法を変更
    const result = await getAudioController(postgre_pool, type, userId);
    res.status(200).json(result);
  } catch (error) {
    console.error("getAudioController error:", error);
    res.status(500).json({
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    });
  }
});

// POST /script/create;
app.post("/script/create", async (req: Request, res: Response) => {
  try {
    const result = await postScriptController(req.body);
    res.status(200).json(result);
  } catch (error) {
    console.error("postScriptController error:", error);
    res.status(500).json({
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    });
  }
});

// グローバルなエラーハンドリング用ミドルウェア
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Error encountered:", err);
  res.status(err.status || 500).json({
    message: err.message,
    errors: err.errors || [],
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
