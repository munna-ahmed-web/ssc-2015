/* eslint-disable no-nested-ternary */
"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Banknote,
  DoorOpen,
  Loader2,
  Plus,
  Receipt,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { adminName } from "@/lib/utils";
import { formatPeriodLabel, getRecentPeriods } from "@/lib/periods";
import { getPeriodLabel } from "@/types";
import AddClubCollectionDialog from "@/features/club/AddClubCollectionDialog";
import AddClubExpenseDialog from "@/features/club/AddClubExpenseDialog";
import AddClubContributorDialog from "@/features/club/AddClubContributorDialog";
import ConfirmDeleteDialog from "@/features/club/ConfirmDeleteDialog";
import {
  useDeleteClubCollection,
  useDeleteClubExpense,
  useFetchClubCollections,
  useFetchClubContributors,
  useFetchClubExpenses,
  useUpdateClubContributor,
} from "@/features/club/hook/clubHooks";
import { getErrorMessage } from "@/lib/api/errors";

const TABS = [
  { label: "Collections", value: "collections" },
  { label: "Expenses", value: "expenses" },
  { label: "People", value: "people" },
] as const;

type TabValue = (typeof TABS)[number]["value"];

function SummaryTile({
  label,
  value,
  sub,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ElementType;
  tone?: "positive" | "negative";
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
          <Icon
            className={`size-4 ${
              tone === "positive"
                ? "text-green-600 dark:text-green-400"
                : tone === "negative"
                  ? "text-destructive"
                  : "text-primary"
            }`}
          />
        </div>
        <p
          className={`text-2xl font-bold font-heading mt-2 ${
            tone === "positive"
              ? "text-green-700 dark:text-green-400"
              : tone === "negative"
                ? "text-destructive"
                : ""
          }`}
        >
          {value}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}

export default function ClubPage() {
  const [periodLabel, setPeriodLabel] = useState(() => getPeriodLabel("monthly"));
  const [tab, setTab] = useState<TabValue>("collections");
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [personOpen, setPersonOpen] = useState(false);
  const [periodOptions] = useState(() => getRecentPeriods("monthly", 12));

  const {
    data: collectionData,
    isLoading: isCollLoading,
    isError: isCollError,
    error: collError,
  } = useFetchClubCollections(periodLabel);
  const { data: expenseData, isLoading: isExpLoading } = useFetchClubExpenses(periodLabel);
  const { data: contributors = [], isLoading: isPeopleLoading } = useFetchClubContributors(true);

  const { mutateAsync: deleteCollection } = useDeleteClubCollection();
  const { mutateAsync: deleteExpense } = useDeleteClubExpense();
  const { mutateAsync: updateContributor } = useUpdateClubContributor();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const collections = collectionData?.collections ?? [];
  const expenses = expenseData?.expenses ?? [];
  const summary = collectionData?.summary ?? expenseData?.summary ?? null;

  const [pendingDelete, setPendingDelete] = useState<{
    kind: "collection" | "expense";
    id: string;
    label: string;
    amount: number;
  } | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2">
            <DoorOpen className="size-6 text-primary" />
            Club Room
          </h2>
          <p className="text-muted-foreground mt-1">
            Monthly room costs and who chipped in — kept completely separate from the foundation
            fund
          </p>
        </div>
        <select
          value={periodLabel}
          onChange={(e) => setPeriodLabel(e.target.value)}
          className="h-9 rounded-lg border border-input bg-card px-3 text-sm outline-none focus:border-ring self-start"
        >
          {periodOptions.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryTile
            label="Collected"
            value={`৳${summary.monthCollected.toLocaleString()}`}
            sub={`${summary.contributorsThisMonth} ${summary.contributorsThisMonth === 1 ? "person" : "people"} in ${formatPeriodLabel(periodLabel)}`}
            icon={Banknote}
            tone="positive"
          />
          <SummaryTile
            label="Expenses"
            value={`৳${summary.monthExpenses.toLocaleString()}`}
            sub={`Room costs for ${formatPeriodLabel(periodLabel)}`}
            icon={Receipt}
          />
          <SummaryTile
            label="This Month"
            value={`${summary.monthBalance < 0 ? "−" : ""}৳${Math.abs(summary.monthBalance).toLocaleString()}`}
            sub={
              summary.monthBalance < 0
                ? "Short — more money needed"
                : summary.monthBalance === 0
                  ? "Exactly covered"
                  : "Surplus this month"
            }
            icon={Wallet}
            tone={summary.monthBalance < 0 ? "negative" : "positive"}
          />
          <SummaryTile
            label="Cash In Hand"
            value={`${summary.runningBalance < 0 ? "−" : ""}৳${Math.abs(summary.runningBalance).toLocaleString()}`}
            sub="All months together"
            icon={Wallet}
            tone={summary.runningBalance < 0 ? "negative" : undefined}
          />
        </div>
      )}

      {/* Tabs + action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex gap-1 bg-muted/50 p-1 rounded-lg w-fit">
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === t.value
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Button
          className="gap-2 self-start"
          onClick={() => {
            if (tab === "collections") setCollectionOpen(true);
            else if (tab === "expenses") setExpenseOpen(true);
            else setPersonOpen(true);
          }}
        >
          <Plus className="size-4" />
          {tab === "collections"
            ? "Record Collection"
            : tab === "expenses"
              ? "Add Expense"
              : "Add Person"}
        </Button>
      </div>

      {isCollError ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-5 py-6 text-center">
          <AlertCircle className="size-8 mx-auto text-destructive mb-2" />
          <p className="text-sm font-medium text-destructive">Failed to load club data</p>
          <p className="text-xs text-destructive/80 mt-1">
            {getErrorMessage(collError, "An error occurred.")}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            {/* ── Collections ── */}
            {tab === "collections" &&
              (isCollLoading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="size-6 text-primary animate-spin" />
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      {["Person", "Amount", "Date", "Notes", "Recorded By", ""].map((h) => (
                        <th
                          key={h}
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                    {collections.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                          <Banknote className="size-8 mx-auto mb-2 opacity-30" />
                          Nothing collected for {formatPeriodLabel(periodLabel)} yet
                        </td>
                      </tr>
                    ) : (
                      collections.map((c) => (
                        <tr key={c._id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-medium">{c.contributorName}</td>
                          <td className="px-4 py-3 font-semibold text-green-700 dark:text-green-400">
                            ৳{c.amount.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {mounted ? new Date(c.paidAt).toLocaleDateString("en-BD") : "…"}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground truncate max-w-40">
                            {c.notes ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {adminName(c.recordedBy) ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-muted-foreground hover:text-destructive"
                              onClick={() =>
                                setPendingDelete({
                                  kind: "collection",
                                  id: c._id,
                                  label: c.contributorName,
                                  amount: c.amount,
                                })
                              }
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              ))}

            {/* ── Expenses ── */}
            {tab === "expenses" &&
              (isExpLoading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="size-6 text-primary animate-spin" />
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      {["Cost", "Amount", "Date", "Notes", "Recorded By", ""].map((h) => (
                        <th
                          key={h}
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                    {expenses.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                          <Receipt className="size-8 mx-auto mb-2 opacity-30" />
                          No costs recorded for {formatPeriodLabel(periodLabel)} yet
                        </td>
                      </tr>
                    ) : (
                      expenses.map((e) => (
                        <tr key={e._id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-medium">{e.title}</td>
                          <td className="px-4 py-3 font-semibold">৳{e.amount.toLocaleString()}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {mounted ? new Date(e.spentAt).toLocaleDateString("en-BD") : "…"}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground truncate max-w-40">
                            {e.notes ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {adminName(e.recordedBy) ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-muted-foreground hover:text-destructive"
                              onClick={() =>
                                setPendingDelete({
                                  kind: "expense",
                                  id: e._id,
                                  label: e.title,
                                  amount: e.amount,
                                })
                              }
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              ))}

            {/* ── People ── */}
            {tab === "people" &&
              (isPeopleLoading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="size-6 text-primary animate-spin" />
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      {["Name", "Phone", "Status", ""].map((h) => (
                        <th
                          key={h}
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                    {contributors.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                          <Users className="size-8 mx-auto mb-2 opacity-30" />
                          No people added yet
                        </td>
                      </tr>
                    ) : (
                      contributors.map((p) => (
                        <tr key={p._id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-medium">{p.name}</td>
                          <td className="px-4 py-3 text-muted-foreground">{p.phone ?? "—"}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-xs">
                              {p.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                void updateContributor({ id: p._id, isActive: !p.isActive })
                              }
                            >
                              {p.isActive ? "Deactivate" : "Reactivate"}
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              ))}
          </div>
        </div>
      )}

      <ConfirmDeleteDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        title={pendingDelete?.kind === "expense" ? "Delete Expense" : "Delete Collection"}
        description={
          pendingDelete
            ? pendingDelete.kind === "expense"
              ? `Delete the expense "${pendingDelete.label}" of ৳${pendingDelete.amount.toLocaleString()}?`
              : `Delete the ৳${pendingDelete.amount.toLocaleString()} collection from ${pendingDelete.label}?`
            : ""
        }
        onConfirm={() =>
          pendingDelete?.kind === "expense"
            ? deleteExpense(pendingDelete.id)
            : deleteCollection(pendingDelete?.id ?? "")
        }
      />
      <AddClubCollectionDialog
        open={collectionOpen}
        onClose={() => setCollectionOpen(false)}
        periodLabel={periodLabel}
      />
      <AddClubExpenseDialog
        open={expenseOpen}
        onClose={() => setExpenseOpen(false)}
        periodLabel={periodLabel}
      />
      <AddClubContributorDialog open={personOpen} onClose={() => setPersonOpen(false)} />
    </div>
  );
}
