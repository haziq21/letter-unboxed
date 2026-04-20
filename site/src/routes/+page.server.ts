import { getDefinitions, getPuzzleCount, getPuzzles } from '$lib/server/database';
import type { PageServerLoad } from './$types';

const PAGE_SIZE = 31;

export const load: PageServerLoad = async ({ url }) => {
  const now = new Date();
  const maxDate = new Date(now.getTime() - (now.getUTCHours() < 7 ? 2 : 1) * 24 * 60 * 60 * 1000);
  const requestedPage = Math.max(1, Number.parseInt(url.searchParams.get('page') ?? '1', 10) || 1);

  const totalPuzzles = await getPuzzleCount({ maxDate });
  const totalPages = Math.max(1, Math.ceil(totalPuzzles / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  const puzzles = await getPuzzles({
    maxDate,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE
  });
  const words = [...new Set(puzzles.flatMap(({ solutions }) => solutions.flat()))];
  const definitions = await getDefinitions(words);

  console.log(
    `Loaded ${puzzles.length} puzzles page ${page}/${totalPages} (${definitions.size} defs) in ${Date.now() - +now}ms`
  );

  return { puzzles, definitions, page, totalPages };
};
