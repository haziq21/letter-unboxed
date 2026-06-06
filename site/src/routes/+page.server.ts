import { getPaginatedPuzzlesPage } from '$lib/server/pagination';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const startTime = Date.now();
  const { puzzles, definitions, page, totalPages, hasMore } = await getPaginatedPuzzlesPage();

  console.log(
    `Loaded ${puzzles.length} puzzles page ${page}/${totalPages} (${definitions.size} defs) in ${Date.now() - startTime}ms`
  );

  return { puzzles, definitions, page, hasMore };
};
