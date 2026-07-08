"use client";

import { forwardRef } from "react";
import { User } from "lucide-react";

import type { SerializedMember } from "./types/types";

// ─── Print-only member profile layout ─────────────────────────────────────────
// Uses the project's design token palette (brand-*) for consistent branding.
// Rendered hidden on screen; only visible during react-to-print.

const MemberPrintView = forwardRef<HTMLDivElement, { member: SerializedMember }>(
  ({ member }, ref) => {
    const formatDate = (dateStr?: string) => {
      if (!dateStr) return "—";
      return new Date(dateStr).toLocaleDateString("en-BD", { dateStyle: "medium" });
    };

    return (
      <div
        ref={ref}
        style={{
          padding: "40px",
          fontFamily: "Arial, Helvetica, sans-serif",
          color: "var(--color-brand-950)",
          backgroundColor: "#ffffff",
          maxWidth: "210mm",
        }}
      >
        <div
          style={{
            backgroundColor: "var(--color-brand-500)",
            color: "#ffffff",
            padding: "16px 24px",
            borderRadius: "8px",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "20px",
                fontWeight: 700,
                margin: 0,
                color: "#ffffff",
                letterSpacing: "-0.02em",
              }}
            >
              Member Profile
            </h1>
            <p style={{ fontSize: "12px", margin: "4px 0 0 0", opacity: 0.85, color: "#ffffff" }}>
              SSC Batch-15
            </p>
          </div>
          {/* Logo placeholder — replace with real logo later */}
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "50%",
              backgroundColor: "rgba(255, 255, 255, 0.15)",
              border: "2px solid rgba(255, 255, 255, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#ffffff",
                lineHeight: 1.2,
                textAlign: "center",
              }}
            >
              অদম্য
              <br />
              ১৫
            </span>
          </div>
        </div>

        {/* ── Identity Section ─────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            gap: "20px",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            backgroundColor: "var(--color-brand-50)",
            borderRadius: "8px",
            border: "1px solid var(--color-brand-200)",
            marginBottom: "20px",
          }}
        >
          {/* Name + Code + Status */}
          <div style={{ flex: 1 }}>
            <h2
              style={{
                fontSize: "18px",
                fontWeight: 700,
                margin: 0,
                color: "var(--color-brand-950)",
              }}
            >
              {member.fullName}
            </h2>
            <div style={{ display: "flex", gap: "12px", marginTop: "6px", alignItems: "center" }}>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  padding: "2px 10px",
                  borderRadius: "4px",
                  backgroundColor: "var(--color-brand-100)",
                  border: "1px solid var(--color-brand-200)",
                  color: "var(--color-brand-700)",
                }}
              >
                {member.memberCode}
              </span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "2px 10px",
                  borderRadius: "4px",
                  backgroundColor: "var(--color-brand-500)",
                  color: "#ffffff",
                  textTransform: "capitalize",
                }}
              >
                {member.status}
              </span>
            </div>
          </div>

          {/* Photo — right corner, square with radius */}
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "8px",
              border: "2px solid var(--color-brand-300)",
              overflow: "hidden",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "var(--color-brand-100)",
            }}
          >
            {member.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={member.photoUrl}
                alt={member.fullName}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <User size={32} color="var(--color-brand-400)" />
            )}
          </div>
        </div>

        {/* ── Personal Information ─────────────────────────────── */}
        <SectionTitle title="Personal Information" />
        <div
          style={{
            border: "1px solid var(--color-brand-200)",
            borderRadius: "8px",
            overflow: "hidden",
            marginBottom: "20px",
          }}
        >
          <table style={{ width: "100%", fontSize: "13px", borderCollapse: "collapse" }}>
            <tbody>
              <PrintRow label="Guardian / Father" value={member.guardianName} />
              <PrintRow label="Phone" value={member.phone} even />
              <PrintRow label="Email" value={member.email} />
              <PrintRow label="National ID (NID)" value={member.nid} even />
              <PrintRow
                label="Date of Birth"
                value={member.dateOfBirth ? formatDate(member.dateOfBirth) : undefined}
              />
              <PrintRow label="Occupation" value={member.occupation} even />
              <PrintRow label="Address" value={member.address} />
            </tbody>
          </table>
        </div>

        {/* ── Contribution Settings ────────────────────────────── */}
        <SectionTitle title="Contribution Settings" />
        <div
          style={{
            border: "1px solid var(--color-brand-200)",
            borderRadius: "8px",
            overflow: "hidden",
            marginBottom: "20px",
          }}
        >
          <table style={{ width: "100%", fontSize: "13px", borderCollapse: "collapse" }}>
            <tbody>
              <PrintRow label="Frequency" value={member.contributionType} />
              <PrintRow
                label="Standard Amount"
                value={`৳${member.contributionAmount.toLocaleString()}`}
                even
              />
            </tbody>
          </table>
        </div>

        {/* ── Membership Timeline ──────────────────────────────── */}
        <SectionTitle title="Membership Timeline" />
        <div
          style={{
            border: "1px solid var(--color-brand-200)",
            borderRadius: "8px",
            overflow: "hidden",
            marginBottom: "32px",
          }}
        >
          <table style={{ width: "100%", fontSize: "13px", borderCollapse: "collapse" }}>
            <tbody>
              <PrintRow label="Joined At" value={formatDate(member.joinedAt)} />
              <PrintRow label="Suspended At" value={formatDate(member.suspendedAt)} even />
              <PrintRow label="Exited At" value={formatDate(member.exitedAt)} />
            </tbody>
          </table>
        </div>

        {/* ── Footer ──────────────────────────────────────────── */}
        <div
          style={{
            borderTop: "2px solid var(--color-brand-200)",
            paddingTop: "12px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <p style={{ fontSize: "10px", color: "var(--color-brand-600)", margin: 0 }}>
            This is a system-generated document.
          </p>
          <p style={{ fontSize: "10px", color: "var(--color-brand-600)", margin: 0 }}>
            Printed on {new Date().toLocaleString("en-BD")}
          </p>
        </div>
      </div>
    );
  },
);

MemberPrintView.displayName = "MemberPrintView";

export default MemberPrintView;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionTitle({ title }: { title: string }) {
  return (
    <h3
      style={{
        fontSize: "12px",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        color: "var(--color-brand-600)",
        margin: "0 0 8px 0",
        paddingLeft: "4px",
      }}
    >
      {title}
    </h3>
  );
}

function PrintRow({
  label,
  value,
  even,
}: {
  label: string;
  value?: string | number | null;
  even?: boolean;
}) {
  return (
    <tr style={{ backgroundColor: even ? "var(--color-brand-50)" : "#ffffff" }}>
      <td
        style={{
          padding: "10px 16px",
          color: "var(--color-brand-600)",
          width: "180px",
          verticalAlign: "top",
          borderBottom: "1px solid var(--color-brand-100)",
          fontSize: "12px",
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        {label}
      </td>
      <td
        style={{
          padding: "10px 16px",
          fontWeight: 500,
          color: "var(--color-brand-950)",
          borderBottom: "1px solid var(--color-brand-100)",
        }}
      >
        {value ?? "—"}
      </td>
    </tr>
  );
}
