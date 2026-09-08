/** Club room money — entirely separate from foundation members and contributions. */

export type AdminRef = string | { _id: string; name?: string };

export interface SerializedClubContributor {
  _id: string;
  name: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SerializedClubCollection {
  _id: string;
  contributorId: string;
  contributorName: string;
  amount: number;
  periodLabel: string;
  paidAt: string;
  notes?: string;
  recordedBy: AdminRef;
  createdAt: string;
}

export interface SerializedClubExpense {
  _id: string;
  title: string;
  amount: number;
  periodLabel: string;
  spentAt: string;
  notes?: string;
  recordedBy: AdminRef;
  createdAt: string;
}

export interface ClubSummary {
  periodLabel: string;
  monthCollected: number;
  monthExpenses: number;
  monthBalance: number;
  totalCollected: number;
  totalExpenses: number;
  runningBalance: number;
  contributorsThisMonth: number;
}
