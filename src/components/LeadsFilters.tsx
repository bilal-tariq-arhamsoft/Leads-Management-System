"use client";

import { LeadSource } from "@prisma/client";
import { useCallback, useEffect, useRef, useState } from "react";
import LeadDisplayCard from "@/components/DisplayCard";
import LeadsPagination from "@/components/LeadsPagination";
import {
  formatEnumLabel,
  LEADS_PER_PAGE,
  type LeadListItem,
} from "@/lib/lead-filters";

const DEBOUNCE_MS = 200;

type LeadsFiltersProps = {
  initialLeads: LeadListItem[];
  initialTotal: number;
  /** API path for fetching leads (admin panel uses authenticated route). */
  apiPath?: string;
  canManage?: boolean;
};

type LeadsResponse = {
  leads: LeadListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

function buildLeadsUrl(
  apiPath: string,
  search: string,
  source: string,
  page: number,
): string {
  const params = new URLSearchParams();
  const trimmed = search.trim();
  if (trimmed) params.set("q", trimmed);
  if (source) params.set("source", source);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `${apiPath}?${query}` : apiPath;
}

const selectClassName =
  "rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500";

export default function LeadsFilters({
  initialLeads,
  initialTotal,
  apiPath = "/api/lead",
  canManage = false,
}: LeadsFiltersProps) {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [source, setSource] = useState("");
  const [page, setPage] = useState(1);
  const [leads, setLeads] = useState<LeadListItem[]>(initialLeads);
  const [total, setTotal] = useState(initialTotal);
  const [totalPages, setTotalPages] = useState(
    Math.max(1, Math.ceil(initialTotal / LEADS_PER_PAGE)),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const filtersRef = useRef({ debouncedSearch, source });
  const pendingFilterReset = useRef(false);

  useEffect(() => {
    const prev = filtersRef.current;
    const filtersChanged =
      prev.debouncedSearch !== debouncedSearch || prev.source !== source;
    filtersRef.current = { debouncedSearch, source };
    if (filtersChanged) {
      pendingFilterReset.current = true;
      setPage(1);
    }
  }, [debouncedSearch, source]);

  const fetchLeads = useCallback(
    async (signal: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          buildLeadsUrl(apiPath, debouncedSearch, source, page),
          { signal, credentials: "same-origin" },
        );
        if (!res.ok) {
          throw new Error("Failed to load leads");
        }
        const data: LeadsResponse = await res.json();
        setLeads(data.leads);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        if (data.page !== page) {
          setPage(data.page);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    },
    [apiPath, debouncedSearch, source, page],
  );

  const skipInitialFetch = useRef(true);

  useEffect(() => {
    const hasFilters = debouncedSearch.trim() !== "" || source !== "";

    if (skipInitialFetch.current && !hasFilters && page === 1) {
      skipInitialFetch.current = false;
      return;
    }
    skipInitialFetch.current = false;

    if (pendingFilterReset.current && page !== 1) return;
    pendingFilterReset.current = false;

    const controller = new AbortController();
    fetchLeads(controller.signal);
    return () => controller.abort();
  }, [fetchLeads, debouncedSearch, source, page, refreshKey]);

  const triggerRefresh = useCallback(() => {
    setRefreshKey((value) => value + 1);
  }, []);

  const hasFilters = debouncedSearch.trim() !== "" || source !== "";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-[200px] flex-1 sm:max-w-md">
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search leads (name, email, company, phone…)"
            autoComplete="off"
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 pr-9 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
            aria-label="Search leads"
          />
          {loading && (
            <span
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400"
              aria-hidden
            >
              …
            </span>
          )}
        </div>

        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className={selectClassName}
          aria-label="Filter by source"
        >
          <option value="">All sources</option>
          {Object.values(LeadSource).map((value) => (
            <option key={value} value={value}>
              {formatEnumLabel(value)}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <LeadDisplayCard
        leads={leads}
        page={page}
        pageSize={LEADS_PER_PAGE}
        emptyMessage={hasFilters ? "No leads match your filters" : "No leads yet"}
        canManage={canManage}
        onChanged={triggerRefresh}
      />

      <LeadsPagination
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={LEADS_PER_PAGE}
        loading={loading}
        onPageChange={setPage}
      />
    </div>
  );
}
