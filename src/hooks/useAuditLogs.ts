import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AuditLog {
  id: string;
  created_at: string;
  actor_user_id: string | null;
  actor_name: string | null;
  actor_role: string | null;
  action: "INSERT" | "UPDATE" | "DELETE" | string;
  entity_type: string;
  entity_id: string | null;
  summary: string | null;
  changes: any;
}

export interface AuditLogFilters {
  startDate?: string;
  endDate?: string;
  entityType?: string;
  action?: string;
  actorUserId?: string;
  search?: string;
}

export function useAuditLogs(filters: AuditLogFilters = {}) {
  return useQuery({
    queryKey: ["audit-logs", filters],
    queryFn: async (): Promise<AuditLog[]> => {
      let q = supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);

      if (filters.startDate) q = q.gte("created_at", filters.startDate);
      if (filters.endDate) q = q.lte("created_at", filters.endDate);
      if (filters.entityType && filters.entityType !== "all")
        q = q.eq("entity_type", filters.entityType);
      if (filters.action && filters.action !== "all")
        q = q.eq("action", filters.action);
      if (filters.actorUserId && filters.actorUserId !== "all")
        q = q.eq("actor_user_id", filters.actorUserId);
      if (filters.search) q = q.ilike("summary", `%${filters.search}%`);

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as AuditLog[];
    },
  });
}

export function useAuditActors() {
  return useQuery({
    queryKey: ["audit-actors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("actor_user_id, actor_name")
        .not("actor_user_id", "is", null)
        .limit(1000);
      if (error) throw error;
      const seen = new Map<string, string>();
      (data ?? []).forEach((r: any) => {
        if (r.actor_user_id && !seen.has(r.actor_user_id))
          seen.set(r.actor_user_id, r.actor_name ?? "Unknown");
      });
      return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
    },
  });
}