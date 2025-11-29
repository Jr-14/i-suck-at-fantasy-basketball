import { z } from "zod";

const envSchema = z.object({
  DB_PATH: z.string(),
});

export const env = envSchema.parse({
  DB_PATH: process.env.DB_PATH,
});
