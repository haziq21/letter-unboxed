import { getPaginatedPuzzlesPage } from '$lib/server/pagination';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
  const requestedPage = Number.parseInt(url.searchParams.get('page') ?? '1', 10) || 1;
  const { puzzles, definitions, page, hasMore } = await getPaginatedPuzzlesPage({
    requestedPage
  });

  return json({
    puzzles,
    definitions: Object.fromEntries(definitions),
    page,
    hasMore
  });
};
