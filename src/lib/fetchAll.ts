/**
 * Supabase/PostgREST returns at most 1000 rows per request.
 * fetchAllRows pages through a query until every matching row is retrieved,
 * so client-side aggregations cover the full filtered dataset.
 */
export async function fetchAllRows<T>(
  buildQuery: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
  pageSize = 1000
): Promise<T[]> {
  const all: T[] = [];
  let from = 0;

  // Hard safety cap: 100 pages (100k rows)
  for (let page = 0; page < 100; page++) {
    const { data, error } = await buildQuery(from, from + pageSize - 1);
    if (error) throw error;
    const rows = data || [];
    all.push(...rows);
    if (rows.length < pageSize) break;
    from += pageSize;
  }

  return all;
}
