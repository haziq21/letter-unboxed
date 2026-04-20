import { getDefinitions, getPuzzleCount, getPuzzles } from '$lib/server/database';
import { PUZZLES_PAGE_SIZE } from '$lib/server/pagination';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
  const now = new Date();
  const maxDate = new Date(now.getTime() - (now.getUTCHours() < 7 ? 2 : 1) * 24 * 60 * 60 * 1000);
  const requestedPage = Number.parseInt(url.searchParams.get('page') ?? '1', 10) || 1;
  const totalPuzzles = await getPuzzleCount({ maxDate });
  const totalPages = Math.max(1, Math.ceil(totalPuzzles / PUZZLES_PAGE_SIZE));
  const page = Math.max(1, Math.min(requestedPage, totalPages));

  const puzzles = await getPuzzles({
    maxDate,
    limit: PUZZLES_PAGE_SIZE,
    offset: (page - 1) * PUZZLES_PAGE_SIZE
  });
  const words = [...new Set(puzzles.flatMap(({ solutions }) => solutions.flat()))];
  const definitions = Object.fromEntries(await getDefinitions(words));

  return json({
    puzzles,
    definitions,
    page,
    hasMore: page < totalPages
  });
};
