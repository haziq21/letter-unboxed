<script lang="ts">
  import GithubIcon from './GithubIcon.svelte';
  import BoxDiagram from './BoxDiagram.svelte';
  import SolutionList from './SolutionList.svelte';
  import type { PageProps } from './$types';

  const { data }: PageProps = $props();
  let puzzles = $state(data.puzzles);
  let definitions = $state<Map<string, string>>(data.definitions);
  let page = $state(data.page);
  let hasMore = $state(data.hasMore);
  let loadingMore = $state(false);
  let selected: { date: Date; sides: string[]; solution: string[] } | undefined = $state();

  async function loadMore() {
    if (loadingMore || !hasMore) return;
    loadingMore = true;

    try {
      const res = await fetch(`/puzzles?page=${page + 1}`);
      if (!res.ok) {
        console.error(`Failed to load more puzzles: HTTP ${res.status}`);
        return;
      }

      const next: {
        puzzles: { date: string; sides: string[]; solutions: string[][] }[];
        definitions: Record<string, string>;
        page: number;
        hasMore: boolean;
      } = await res.json();

      puzzles = [
        ...puzzles,
        ...next.puzzles.map((puzzle) => ({ ...puzzle, date: new Date(puzzle.date) }))
      ];
      for (const [word, definition] of Object.entries(next.definitions)) {
        definitions.set(word, definition);
      }
      page = next.page;
      hasMore = next.hasMore;
    } catch (error) {
      console.error('Failed to load more puzzles', error);
    } finally {
      loadingMore = false;
    }
  }
</script>

<svelte:head>
  <title>Letter unBoxed</title>
  <meta
    name="description"
    content="A generated archive of every accepted 2-word solution for the New York Times' Letter Boxed."
  />
</svelte:head>

<div
  class="flex h-[100vh] flex-col md:grid md:grid-cols-[27rem_1fr] md:grid-rows-[min-content_1fr]"
>
  <header class="h-min px-8 py-6 md:px-10 md:py-8">
    <div class="mb-2 flex items-baseline justify-between">
      <h1 class="font-roboto-slab text-2xl font-black tracking-tight md:text-2xl">
        Letter unBoxed
      </h1>
      <a href="https://github.com/haziq21/letter-unboxed"><GithubIcon /></a>
    </div>
    <p class="text-sm md:text-base">
      A generated archive of every accepted 2-word solution for the New York Times'
      <a href="https://www.nytimes.com/puzzles/letter-boxed" class="underline">Letter Boxed</a>.
    </p>
  </header>

  <div
    class="flex min-h-90 flex-col items-center justify-center bg-rose-300 px-8 md:row-span-2 md:h-full"
  >
    <BoxDiagram
      sides={selected?.sides ?? Array(4).fill('')}
      letterSeq={selected?.solution.join('')}
      class="mt-4"
    />

    <div
      class="text-2xs mt-2 mb-3 flex h-8 w-full flex-col justify-end md:w-75 lg:w-100 lg:text-xs"
    >
      {#each selected?.solution ?? [] as word}
        {#if definitions.has(word)}
          <p>
            <span class="mr-3 font-semibold">{word}</span>
            <span>{definitions.get(word)}</span>
          </p>
        {/if}
      {/each}
    </div>
  </div>

  <main class="min-h-0 flex-1">
    <SolutionList
      {puzzles}
      {hasMore}
      loading={loadingMore}
      on:loadmore={loadMore}
      bind:selected
      class="flex max-h-full flex-col"
    />
  </main>
</div>
