import { getPaginatedPuzzlesPage } from '$lib/server/pagination';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const now = new Date();
  const { puzzles, definitions, page, totalPages, hasMore } = await getPaginatedPuzzlesPage({
    requestedPage: 1,
    now
  });

  console.log(
    `Loaded ${puzzles.length} puzzles page ${page}/${totalPages} (${definitions.size} defs) in ${Date.now() - +now}ms`
  );

  return { puzzles, definitions, page, hasMore };
};
