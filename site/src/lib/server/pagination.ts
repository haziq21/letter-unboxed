import { getDefinitions, getPuzzleCount, getPuzzles } from '$lib/server/database';

export const PUZZLES_PAGE_SIZE = 31;

export async function getPaginatedPuzzlesPage(requestedPage = 1) {
  const now = new Date();
  const maxDate = new Date(now.getTime() - (now.getUTCHours() < 7 ? 2 : 1) * 24 * 60 * 60 * 1000);

  const totalPuzzles = await getPuzzleCount({ maxDate });
  const totalPages = Math.max(1, Math.ceil(totalPuzzles / PUZZLES_PAGE_SIZE));
  const page = Math.max(1, Math.min(requestedPage, totalPages));
  const puzzles = await getPuzzles({
    maxDate,
    limit: PUZZLES_PAGE_SIZE,
    offset: (page - 1) * PUZZLES_PAGE_SIZE
  });
  const words = [...new Set(puzzles.flatMap(({ solutions }) => solutions.flat()))];
  const definitions = await getDefinitions(words);

  return {
    puzzles,
    definitions,
    page,
    totalPages,
    hasMore: page < totalPages
  };
}
