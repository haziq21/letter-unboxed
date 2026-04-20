import { getDefinitions, getPuzzleCount, getPuzzles } from '$lib/server/database';
import { PUZZLES_PAGE_SIZE } from '$lib/server/pagination';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const now = new Date();
  const maxDate = new Date(now.getTime() - (now.getUTCHours() < 7 ? 2 : 1) * 24 * 60 * 60 * 1000);
  const page = 1;

  const totalPuzzles = await getPuzzleCount({ maxDate });
  const totalPages = Math.max(1, Math.ceil(totalPuzzles / PUZZLES_PAGE_SIZE));
  const puzzles = await getPuzzles({
    maxDate,
    limit: PUZZLES_PAGE_SIZE,
    offset: (page - 1) * PUZZLES_PAGE_SIZE
  });
  const words = [...new Set(puzzles.flatMap(({ solutions }) => solutions.flat()))];
  const definitions = await getDefinitions(words);

  console.log(
    `Loaded ${puzzles.length} puzzles page ${page}/${totalPages} (${definitions.size} defs) in ${Date.now() - +now}ms`
  );

  return { puzzles, definitions, page, hasMore: page < totalPages };
};
