import { drizzle } from 'drizzle-orm/d1';
import { sql } from 'drizzle-orm';
import { text, integer, sqliteTable } from 'drizzle-orm/sqlite-core';

export const videoTasks = sqliteTable('video_tasks', {
  id: text('id').primaryKey(),
  status: text('status').notNull().default('uploading'),
  inputUrls: text('input_urls').notNull(),
  outputUrl: text('output_url'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export type VideoTask = typeof videoTasks.$inferSelect;
export type NewVideoTask = typeof videoTasks.$inferInsert;

export function getD1() {
  // @ts-ignore - Cloudflare 环境变量
  const env = (globalThis as any).env;
  
  if (process.env.DATABASE_ID && env?.DB) {
    return drizzle(env.DB);
  }
  
  throw new Error('D1 database not available');
}

export async function createTask(db: ReturnType<typeof drizzle>, taskId: string, inputUrls: string[]) {
  await db.insert(videoTasks).values({
    id: taskId,
    status: 'processing',
    inputUrls: JSON.stringify(inputUrls),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
}

export async function updateTaskStatus(db: ReturnType<typeof drizzle>, taskId: string, status: string, outputUrl?: string) {
  await db.update(videoTasks)
    .set({
      status,
      outputUrl,
      updatedAt: Date.now(),
    })
    .where(sql`${videoTasks.id} = ${taskId}`);
}

export async function getTask(db: ReturnType<typeof drizzle>, taskId: string): Promise<VideoTask | undefined> {
  const result = await db.select().from(videoTasks).where(sql`${videoTasks.id} = ${taskId}`);
  return result[0];
}
