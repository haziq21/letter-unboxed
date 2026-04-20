<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { arrEq, debounce } from '$lib/utils';
  import { refMap } from '$lib/actions';

  interface Props {
    puzzles: { date: Date; solutions: string[][] }[];
    selected?: { solution: string[]; date: Date };
    hasMore?: boolean;
    loading?: boolean;
    class: string | undefined;
  }

  let {
    puzzles,
    selected = $bindable(),
    hasMore = false,
    loading = false,
    class: cls = ''
  }: Props = $props();
  const dispatch = createEventDispatcher<{ loadmore: void }>();

  /** The scrollable element containing the solutions. */
  let solScrollerElem: HTMLElement;
  /** The element that indicates the selected solution on mobile. */
  let solSelectorElem: HTMLElement;
  /** The solutions that are fully visible in `solScroller`. */
  const visibleSolElems = new Set<HTMLElement>();
  /** The currently selected solution. */
  let selectedSolElem: HTMLElement | undefined = $state();
  let hoveredSolElem: HTMLElement | undefined = $state();
  /** A map of solution elements to their corresponding data values. */
  const solElemData = new Map<HTMLElement, { solution: string[]; date: Date }>();
  /** The result of the `(pointer: fine)` media query. */
  let hasFinePointer = $state(true);
  /** Bottom sentinel used to auto-load more puzzles. */
  let loadMoreSentinelElem: HTMLElement | undefined = $state();
  /** Observer used to update visible solution elements. */
  let visibleSolutionsObserver: IntersectionObserver | undefined;

  function observeSolution(node: HTMLElement) {
    visibleSolutionsObserver?.observe(node);
    return {
      destroy() {
        visibleSolElems.delete(node);
        visibleSolutionsObserver?.unobserve(node);
      }
    };
  }

  function getFirstSolutionElement(): HTMLElement | undefined {
    const first = solElemData.keys().next();
    return first.done ? undefined : first.value;
  }

  onMount(() => {
    // Update `hasFinePointer` based on the media query
    const pointerMediaQuery = window.matchMedia('(pointer: fine)');
    hasFinePointer = pointerMediaQuery.matches;
    pointerMediaQuery.addEventListener('change', (e) => (hasFinePointer = e.matches));

    // IntersectionObserver to maintain `visibleSolElems` for efficient updating of `selectedSolElem`
    visibleSolutionsObserver = new IntersectionObserver(
      (entries) => hasFinePointer || updateVisibleSolutions(entries, visibleSolElems),
      { root: solScrollerElem, rootMargin: '0px', threshold: 1 }
    );
    for (const el of solElemData.keys()) visibleSolutionsObserver.observe(el);

    const loadMoreObserver = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting) || !hasMore || loading) return;
        dispatch('loadmore');
      },
      { root: solScrollerElem, rootMargin: '0px', threshold: 0.1 }
    );
    if (loadMoreSentinelElem) loadMoreObserver.observe(loadMoreSentinelElem);

    selectedSolElem = hasFinePointer
      ? // If the user is on desktop, default to the first solution
        getFirstSolutionElement()
      : // If the user is on mobile, select the solution selected by the solution selector
        getSelectedSolution(visibleSolElems, solSelectorElem) || getFirstSolutionElement();
    if (selectedSolElem) selected = solElemData.get(selectedSolElem)!;

    return () => {
      visibleSolutionsObserver?.disconnect();
      loadMoreObserver.disconnect();
    };
  });

  const debouncedSnapSolScroller = debounce(
    () => snapSolScroller(solScrollerElem, solSelectorElem, selectedSolElem!),
    200
  );

  /** Scroll handler for `solScrollerElem`. */
  const onscroll = () => {
    if (hasFinePointer) return;

    requestIdleCallback(() => {
      selectedSolElem = getSelectedSolution(visibleSolElems, solSelectorElem) || selectedSolElem;
      selected = solElemData.get(selectedSolElem!)!;
    });
    debouncedSnapSolScroller();
  };

  /** Mouseenter handler for `visibleSolElems`. */
  const onmouseenter = (e: MouseEvent) => {
    if (!hasFinePointer) return;
    hoveredSolElem = e.target as HTMLElement;
    selected = solElemData.get(hoveredSolElem)!;
  };

  /** Mouseleave handler for `visibleSolElems`. */
  const onmouseleave = () => {
    if (!hasFinePointer) return;
    hoveredSolElem = undefined;
    selected = solElemData.get(selectedSolElem!)!;
  };

  /** Click handler for `visibleSolElems`. */
  const onclick = (e: MouseEvent) => {
    selectedSolElem = e.target as HTMLElement;
    selected = solElemData.get(selectedSolElem)!;
    if (!hasFinePointer) snapSolScroller(solScrollerElem, solSelectorElem, selectedSolElem);
  };

  /** Scroll the `solScroller` such that the `selectedSol` directly overlaps with `solSelector`. */
  function snapSolScroller(
    solScroller: HTMLElement,
    solSelector: HTMLElement,
    selectedSol: HTMLElement
  ) {
    const scrollY =
      selectedSol.offsetTop +
      solScroller.getBoundingClientRect().top -
      solSelector.getBoundingClientRect().top;
    solScroller.scroll({ top: scrollY, behavior: 'smooth' });
  }

  /** Update the set of visible solutions based on the entries provided by an `IntersectionObserver`. */
  function updateVisibleSolutions(
    entries: IntersectionObserverEntry[],
    visibleSolutions: Set<HTMLElement>
  ) {
    for (const entry of entries) {
      if (entry.isIntersecting) visibleSolutions.add(entry.target as HTMLElement);
      else visibleSolutions.delete(entry.target as HTMLElement);
    }
  }

  /** Return the solution element the closest to `solSelector`, or `null` if `visibleSolutions` is empty. */
  function getSelectedSolution(
    visibleSolutions: Set<HTMLElement>,
    solSelector: HTMLElement
  ): HTMLElement | null {
    let minDistance = Infinity;
    let selectedSol: HTMLElement | null = null;

    for (const sol of visibleSolutions) {
      const { top: solTop } = sol.getBoundingClientRect();
      const { top: selectorTop } = solSelector.getBoundingClientRect();
      const dist = Math.abs(solTop - selectorTop);

      if (dist < minDistance) {
        selectedSol = sol;
        minDistance = dist;
      }
    }

    return selectedSol;
  }
</script>

<div class={['relative', cls]}>
  <div
    bind:this={solSelectorElem}
    class="absolute top-14 right-4 left-4 -z-1 h-9 bg-rose-100 md:hidden pointer-fine:hidden"
  ></div>

  <div bind:this={solScrollerElem} {onscroll} class="overflow-y-scroll">
    <!-- ...rest to retain any other properties (e.g. `sides`). Maybe this is messy and hacky. -->
    {#each puzzles as { date, solutions, ...rest }}
      <div class="pt-6 last:pb-[calc(100%-3.5rem)]">
        <span class="mb-2 block px-8 font-bold md:px-10">
          {date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </span>

        <ul class="flex flex-col px-4 md:px-6">
          {#each solutions as solution}
            <li class="not-first:-mt-1.5">
              <button
                use:observeSolution
                use:refMap={{ map: solElemData, value: { solution, date, ...rest } }}
                {onmouseenter}
                {onmouseleave}
                {onclick}
                class={[
                  'block w-full px-4 py-1.5 text-left tracking-wide',
                  hasFinePointer &&
                  selectedSolElem &&
                  // "if this <button> is the selected solution"
                  arrEq(solution, solElemData.get(selectedSolElem)!.solution)
                    ? 'relative z-1 bg-rose-100'
                    : 'pointer-fine:hover:bg-rose-50'
                ]}
              >
                {solution.join(' – ')}
              </button>
            </li>
          {/each}
        </ul>
      </div>
    {/each}
    {#if hasMore}
      <div bind:this={loadMoreSentinelElem} class="h-8"></div>
    {/if}
  </div>
</div>
