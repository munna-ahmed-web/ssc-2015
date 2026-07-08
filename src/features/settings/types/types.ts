export interface SerializedAuditLog {
  id: string;
  type: "application" | "contribution";
  action: string;
  targetName: string;
  performedBy: string;
  timestamp: string;
  details?: string;
}

export interface SerializedAdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}
