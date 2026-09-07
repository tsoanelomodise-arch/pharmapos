CREATE OR REPLACE FUNCTION public.sales_summary(
  _start_date timestamptz DEFAULT NULL,
  _end_date timestamptz DEFAULT NULL,
  _payment_method text DEFAULT NULL
)
RETURNS TABLE(total_count bigint, total_amount numeric, avg_amount numeric)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    count(*)::bigint AS total_count,
    COALESCE(sum(total_amount), 0) AS total_amount,
    COALESCE(avg(total_amount), 0) AS avg_amount
  FROM public.sales
  WHERE (_start_date IS NULL OR created_at >= _start_date)
    AND (_end_date IS NULL OR created_at <= _end_date)
    AND (_payment_method IS NULL OR _payment_method = 'all' OR payment_method::text = _payment_method);
$$;

GRANT EXECUTE ON FUNCTION public.sales_summary(timestamptz, timestamptz, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sales_summary(timestamptz, timestamptz, text) TO service_role;