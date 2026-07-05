"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Column<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  className?: string;
  render?: (row: T) => React.ReactNode;
}

export interface FilterOption {
  label: string;
  value: string;
}

export interface DataTableProps<T extends Record<string, unknown>> {
  data: T[];
  columns: Column<T>[];
  /** Key of the field to search across (uses string matching) */
  searchKey?: keyof T;
  searchPlaceholder?: string;
  filterKey?: keyof T;
  filterOptions?: FilterOption[];
  filterLabel?: string;
  pageSize?: number;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

type SortDirection = "asc" | "desc" | null;

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function TableSkeleton({ cols, rows = 5 }: { cols: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-border">
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <Skeleton className="h-4 w-full rounded" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  searchKey,
  searchPlaceholder = "Search…",
  filterKey,
  filterOptions,
  filterLabel = "Filter",
  pageSize: defaultPageSize = 10,
  isLoading = false,
  emptyMessage = "No records found.",
  className,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [filterValue, setFilterValue] = useState("all");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // ── Filter & search ────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let rows = [...data];

    if (search && searchKey) {
      const q = search.toLowerCase();
      rows = rows.filter((row) =>
        String(row[searchKey] ?? "")
          .toLowerCase()
          .includes(q)
      );
    }

    if (filterValue !== "all" && filterKey) {
      rows = rows.filter((row) => String(row[filterKey]) === filterValue);
    }

    return rows;
  }, [data, search, searchKey, filterValue, filterKey]);

  // ── Sort ───────────────────────────────────────────────────────────────────

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return filtered;
    return [...filtered].sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  // ── Pagination ─────────────────────────────────────────────────────────────

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = useCallback(
    (key: string) => {
      if (sortKey !== key) {
        setSortKey(key);
        setSortDir("asc");
      } else if (sortDir === "asc") {
        setSortDir("desc");
      } else {
        setSortKey(null);
        setSortDir(null);
      }
      setPage(1);
    },
    [sortKey, sortDir]
  );

  const SortIcon = ({ col }: { col: string }) => {
    if (sortKey !== col) return <ArrowUpDown className="size-3 text-muted-foreground/50" />;
    return sortDir === "asc" ? (
      <ArrowUp className="size-3 text-primary" />
    ) : (
      <ArrowDown className="size-3 text-primary" />
    );
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {searchKey && (
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={searchPlaceholder}
              className="pl-9"
              id="table-search"
            />
          </div>
        )}
        {filterKey && filterOptions && (
          <Select value={filterValue} onValueChange={(v) => { setFilterValue(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-44" id="table-filter">
              <SelectValue placeholder={filterLabel} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {filterOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {(search || filterValue !== "all") && (
          <Badge variant="secondary" className="self-center text-xs shrink-0">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {columns.map((col) => (
                  <th
                    key={String(col.key)}
                    scope="col"
                    className={cn(
                      "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                      col.sortable && "cursor-pointer select-none hover:text-foreground",
                      col.className
                    )}
                    onClick={col.sortable ? () => handleSort(String(col.key)) : undefined}
                  >
                    <span className="flex items-center gap-1.5">
                      {col.header}
                      {col.sortable && <SortIcon col={String(col.key)} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {isLoading ? (
                <TableSkeleton cols={columns.length} />
              ) : paginated.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-12 text-center text-sm text-muted-foreground"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paginated.map((row, i) => (
                  <tr
                    key={i}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    {columns.map((col) => (
                      <td
                        key={String(col.key)}
                        className={cn("px-4 py-3", col.className)}
                      >
                        {col.render
                          ? col.render(row)
                          : String(row[col.key as keyof T] ?? "—")}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Rows per page:</span>
          <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
            <SelectTrigger className="h-7 w-16 text-xs" id="rows-per-page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>
            {sorted.length === 0 ? "0" : (currentPage - 1) * pageSize + 1}–
            {Math.min(currentPage * pageSize, sorted.length)} of {sorted.length}
          </span>
          <div className="flex items-center gap-0.5 ml-2">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setPage(1)}
              disabled={currentPage === 1}
              aria-label="First page"
            >
              <ChevronsLeft className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setPage((p) => p - 1)}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <span className="px-2">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setPage((p) => p + 1)}
              disabled={currentPage === totalPages}
              aria-label="Next page"
            >
              <ChevronRight className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setPage(totalPages)}
              disabled={currentPage === totalPages}
              aria-label="Last page"
            >
              <ChevronsRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
