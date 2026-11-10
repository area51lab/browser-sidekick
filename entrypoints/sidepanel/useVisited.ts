import { useEffect, useState } from 'preact/hooks';

/** Ids that were active at least once, in first-visit order, limited to ids that still exist. */
export function useVisited(activeId: string | null, existingIds: string[]): string[] {
  const [visited, setVisited] = useState<string[]>([]);

  useEffect(() => {
    if (activeId) setVisited((ids) => (ids.includes(activeId) ? ids : [...ids, activeId]));
  }, [activeId]);

  const withActive = activeId && !visited.includes(activeId) ? [...visited, activeId] : visited;
  return withActive.filter((id) => existingIds.includes(id));
}
