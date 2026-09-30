"use client";

import { useState } from "react";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/Panel";
import { formatDateTime, formatNumber } from "@/components/admin/format";
import type { Campaign } from "@/data/admin/types";
import { formatPrice } from "@/lib/format";
import { CAMPAIGN_STATUS, type CampaignStatus } from "@/types/domain";
import { mutate } from "../api";
import { CampaignDialog } from "./components/CampaignDialog";

const rate = (a: number, b: number) => (b ? `${((a / b) * 100).toFixed(1)}%` : "—");
const NEXT: Partial<Record<CampaignStatus, { label: string; to: CampaignStatus }>> = {
  draft: { label: "Schedule", to: "scheduled" }, scheduled: { label: "Pause", to: "paused" },
  live: { label: "Pause", to: "paused" }, paused: { label: "Resume", to: "live" },
};

export function CampaignsView({ campaigns }: { campaigns: Campaign[] }) {
  const [rows, setRows] = useState(campaigns);
  const [creating, setCreating] = useState(false);

  const transition = (c: Campaign, to: CampaignStatus) => {
    const before = rows;
    setRows(rows.map((x) => (x.id === c.id ? { ...x, status: to } : x)));
    // TODO(backend agent): call /api/admin/campaigns/<id>/status
    void mutate(`campaigns/${c.id}/status`, { status: to }, { success: `${c.name}: ${to}`, rollback: () => setRows(before) });
  };
  const create = (c: Campaign) => {
    const before = rows;
    setRows([c, ...rows]);
    setCreating(false);
    void mutate("campaigns", c, { success: `Campaign “${c.name}” created`, rollback: () => setRows(before) });
  };

  const columns: Column<Campaign>[] = [
    { key: "name", header: "Campaign", sort: (c) => c.name, cell: (c) => <><span className="block font-medium">{c.name}</span><span className="t-meta">{c.audience}</span></> },
    { key: "channel", header: "Channel", sort: (c) => c.channel, cell: (c) => <span className="capitalize">{c.channel}</span> },
    { key: "status", header: "Status", sort: (c) => c.status, cell: (c) => <span className="flex flex-col items-start gap-1"><StatusBadge status={c.status} />{c.scheduledFor && <span className="t-meta">{formatDateTime(c.scheduledFor)}</span>}</span> },
    { key: "sent", header: "Reach", align: "right", sort: (c) => c.sent, cell: (c) => formatNumber(c.sent) },
    { key: "open", header: "Open rate", align: "right", cell: (c) => rate(c.opened, c.sent) },
    { key: "ctr", header: "CTR", align: "right", cell: (c) => rate(c.clicked, c.sent) },
    { key: "rev", header: "Revenue", align: "right", sort: (c) => c.revenue, cell: (c) => formatPrice(c.revenue) },
    { key: "act", header: "Actions", cell: (c) => NEXT[c.status] && <Button size="sm" variant="secondary" onClick={() => transition(c, NEXT[c.status]!.to)}>{NEXT[c.status]!.label}</Button> },
  ];

  return (
    <>
      <PageHeader title="Campaigns" description="Email, SMS, WhatsApp, push and on-site campaigns with attributed revenue."
        actions={<Button size="sm" onClick={() => setCreating(true)}>New campaign</Button>} />
      <DataTable caption="Campaigns" rows={rows} columns={columns} getId={(c) => c.id} search={(c) => `${c.name} ${c.audience}`} searchPlaceholder="Search campaigns"
        filters={[
          { key: "status", label: "Status", options: CAMPAIGN_STATUS.map((s) => ({ value: s, label: s })), match: (c, v) => c.status === v },
          { key: "channel", label: "Channel", options: ["email", "sms", "whatsapp", "push", "onsite"].map((s) => ({ value: s, label: s })), match: (c, v) => c.channel === v },
        ]}
        empty={{ title: "No campaigns yet" }} />
      <CampaignDialog open={creating} onClose={() => setCreating(false)} onSave={create} />
    </>
  );
}
