import { drizzle } from 'drizzle-orm/neon-http';
import { DATABASE_URL } from '$env/static/private';
import { dictionary, puzzles } from './schema';
import { desc, inArray, lte, sql } from 'drizzle-orm';

const db = drizzle(DATABASE_URL);

export async function upsertPuzzle(puzzle: { date: Date; sides: string[]; solutions: string[][] }) {
  const { date, sides, solutions } = puzzle;
  await db.insert(puzzles).values({ date, sides, solutions }).onConflictDoUpdate({
    target: puzzles.date,
    set: { sides, solutions }
  });
}

export async function upsertDefinitions(definitions: Record<string, string>) {
  await db
    .insert(dictionary)
    .values(Object.entries(definitions).map(([word, definition]) => ({ word, definition })))
    .onConflictDoUpdate({
      target: dictionary.word,
      set: { definition: sql.raw(`excluded.${dictionary.definition.name}`) }
    });
}

export async function getPuzzles(options?: {
  maxDate?: Date;
  limit?: number;
  offset?: number;
}): Promise<{ date: Date; sides: string[]; solutions: string[][] }[]> {
  const query = db.select().from(puzzles).$dynamic();

  if (options?.maxDate) {
    query.where(lte(puzzles.date, options.maxDate));
  }
  query.orderBy(desc(puzzles.date));

  if (options?.offset !== undefined) {
    query.offset(options.offset);
  }
  if (options?.limit !== undefined) {
    query.limit(options.limit);
  }

  return await query;
}

export async function getPuzzleCount(options?: { maxDate?: Date }): Promise<number> {
  const [{ count }] = options?.maxDate
    ? await db
        .select({ count: sql<number>`count(*)` })
        .from(puzzles)
        .where(lte(puzzles.date, options.maxDate))
    : await db.select({ count: sql<number>`count(*)` }).from(puzzles);

  return Number(count);
}

export async function getDefinitions(words: string[]): Promise<Map<string, string>> {
  if (words.length === 0) return new Map();

  const defs = await db
    .select({ word: dictionary.word, definition: dictionary.definition })
    .from(dictionary)
    .where(inArray(dictionary.word, words));
  return new Map(defs.map(({ word, definition }) => [word, definition]));
}
