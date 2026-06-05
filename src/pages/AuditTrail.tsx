import { useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ArrowLeft, ShieldCheck, Search, Download, ChevronDown, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuditLogs, useAuditActors, AuditLog } from "@/hooks/useAuditLogs";
import { cn } from "@/lib/utils";

type DatePreset = "today" | "7days" | "30days" | "all" | "custom";

const ENTITY_TYPES = [
  "sales", "sale_items", "prescriptions", "products", "customers",
  "doctors", "suppliers", "user_roles", "user_module_permissions",
  "business_settings", "profiles",
];

const roleLabel = (r?: string | null) => {
  if (!r) return "—";
  if (r === "manager") return "Cashier";
  return r.charAt(0).toUpperCase() + r.slice(1);
};

const actionBadge = (a: string) => {
  const variants: Record<string, string> = {
    INSERT: "bg-emerald-600 hover:bg-emerald-700",
    UPDATE: "bg-blue-600 hover:bg-blue-700",
    DELETE: "bg-destructive hover:bg-destructive/90",
  };
  return <Badge className={variants[a] ?? ""}>{a}</Badge>;
};

function LogRow({ log }: { log: AuditLog }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TableRow>
        <TableCell className="whitespace-nowrap font-mono text-xs">
          {format(new Date(log.created_at), "MMM d, yyyy HH:mm:ss")}
        </TableCell>
        <TableCell>
          <div className="flex flex-col">
            <span className="font-medium">{log.actor_name || "System"}</span>
            <span className="text-xs text-muted-foreground">{roleLabel(log.actor_role)}</span>
          </div>
        </TableCell>
        <TableCell>{actionBadge(log.action)}</TableCell>
        <TableCell><Badge variant="outline">{log.entity_type}</Badge></TableCell>
        <TableCell className="max-w-md">{log.summary || "—"}</TableCell>
        <TableCell>
          <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger asChild>
              <Button size="sm" variant="ghost">
                {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </TableCell>
      </TableRow>
      {open && (
        <TableRow>
          <TableCell colSpan={6} className="bg-muted/40">
            <pre className="text-xs overflow-x-auto p-2 rounded bg-background border max-h-80">
              {JSON.stringify(log.changes, null, 2)}
            </pre>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export default function AuditTrail() {
  const { data: role, isLoading: roleLoading } = useUserRole();
  const [datePreset, setDatePreset] = useState<DatePreset>("7days");
  const [customStart, setCustomStart] = useState<Date | undefined>();
  const [customEnd, setCustomEnd] = useState<Date | undefined>();
  const [entityType, setEntityType] = useState<string>("all");
  const [action, setAction] = useState<string>("all");
  const [actorId, setActorId] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const dateFilter = useMemo(() => {
    const now = new Date();
    switch (datePreset) {
      case "today": return { startDate: startOfDay(now).toISOString(), endDate: endOfDay(now).toISOString() };
      case "7days": return { startDate: startOfDay(subDays(now, 7)).toISOString(), endDate: endOfDay(now).toISOString() };
      case "30days": return { startDate: startOfDay(subDays(now, 30)).toISOString(), endDate: endOfDay(now).toISOString() };
      case "custom":
        if (customStart && customEnd)
          return { startDate: startOfDay(customStart).toISOString(), endDate: endOfDay(customEnd).toISOString() };
        return {};
      default: return {};
    }
  }, [datePreset, customStart, customEnd]);

  const { data: logs = [], isLoading } = useAuditLogs({
    ...dateFilter,
    entityType,
    action,
    actorUserId: actorId,
    search: search || undefined,
  });
  const { data: actors = [] } = useAuditActors();

  if (roleLoading) return null;
  if (role !== "admin" && role !== "owner") return <Navigate to="/reports" replace />;

  const totalPages = Math.max(1, Math.ceil(logs.length / pageSize));
  const paged = logs.slice((page - 1) * pageSize, page * pageSize);

  const exportCsv = () => {
    const headers = ["When", "Who", "Role", "Action", "Entity", "Entity ID", "Summary"];
    const rows = logs.map((l) => [
      format(new Date(l.created_at), "yyyy-MM-dd HH:mm:ss"),
      l.actor_name ?? "System",
      roleLabel(l.actor_role),
      l.action,
      l.entity_type,
      l.entity_id ?? "",
      (l.summary ?? "").replace(/"/g, '""'),
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c)}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-trail-${format(new Date(), "yyyy-MM-dd-HHmm")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/reports">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Reports
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold">Audit Trail</h1>
          </div>
        </div>
        <Button onClick={exportCsv} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="py-3 text-sm text-muted-foreground">
          A tamper-resistant, timestamped record of every change made in the system. Entries cannot be edited or deleted.
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Filters</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-3">
              <Select value={datePreset} onValueChange={(v) => { setDatePreset(v as DatePreset); setPage(1); }}>
                <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="7days">Last 7 Days</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>

              <Select value={entityType} onValueChange={(v) => { setEntityType(v); setPage(1); }}>
                <SelectTrigger className="w-[170px]"><SelectValue placeholder="Entity" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  {ENTITY_TYPES.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={action} onValueChange={(v) => { setAction(v); setPage(1); }}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Action" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="INSERT">Created</SelectItem>
                  <SelectItem value="UPDATE">Updated</SelectItem>
                  <SelectItem value="DELETE">Deleted</SelectItem>
                </SelectContent>
              </Select>

              <Select value={actorId} onValueChange={(v) => { setActorId(v); setPage(1); }}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Actor" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {actors.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>

              <div className="flex-1 flex items-center gap-2 min-w-[200px]">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search summary..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
            </div>

            {datePreset === "custom" && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-[160px] justify-start text-left font-normal", !customStart && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customStart ? format(customStart, "MMM d, yyyy") : "Start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={customStart} onSelect={(d) => { setCustomStart(d); setPage(1); }} initialFocus className="pointer-events-auto" />
                  </PopoverContent>
                </Popover>
                <span className="text-muted-foreground">to</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-[160px] justify-start text-left font-normal", !customEnd && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customEnd ? format(customEnd, "MMM d, yyyy") : "End date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={customEnd} onSelect={(d) => { setCustomEnd(d); setPage(1); }} initialFocus className="pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <span>{logs.length} {logs.length === 1 ? "entry" : "entries"}</span>
            {totalPages > 1 && (
              <span className="text-sm font-normal text-muted-foreground">
                Page {page} of {totalPages}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading audit trail...</div>
          ) : paged.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No audit entries match your filters.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Who</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Summary</TableHead>
                    <TableHead className="w-12">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((log) => <LogRow key={log.id} log={log} />)}
                </TableBody>
              </Table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
              <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}