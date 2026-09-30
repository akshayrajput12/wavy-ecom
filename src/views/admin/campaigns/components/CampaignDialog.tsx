"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dialog } from "@/components/admin/Dialog";
import { Select } from "@/components/admin/Fields";
import type { Campaign } from "@/data/admin/types";

const CHANNELS: Campaign["channel"][] = ["email", "sms", "whatsapp", "push", "onsite"];

export function CampaignDialog({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (c: Campaign) => void }) {
  const [name, setName] = useState("");
  const [channel, setChannel] = useState<Campaign["channel"]>("email");
  const [audience, setAudience] = useState("");
  const [when, setWhen] = useState("");
  const valid = name.trim().length > 2 && audience.trim().length > 1;
  const submit = () => {
    if (!valid) return;
    onSave({
      id: crypto.randomUUID(), name: name.trim(), channel, audience: audience.trim(),
      status: when ? "scheduled" : "draft", scheduledFor: when ? new Date(`${when}:00+05:30`).toISOString() : undefined,
      sent: 0, opened: 0, clicked: 0, revenue: 0,
    });
    setName(""); setAudience(""); setWhen("");
  };
  return (
    <Dialog open={open} onClose={onClose} title="New campaign"
      footer={<><Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" disabled={!valid} onClick={submit}>{when ? "Schedule" : "Save draft"}</Button></>}>
      <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        <Select label="Channel" value={channel} onChange={(e) => setChannel(e.target.value as Campaign["channel"])}>
          {CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Input label="Audience segment" value={audience} onChange={(e) => setAudience(e.target.value)} hint="e.g. VIP, Abandoned carts, Mumbai" />
        <Input label="Send at (optional, IST)" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
      </form>
    </Dialog>
  );
}
