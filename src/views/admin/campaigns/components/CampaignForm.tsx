"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Select, Textarea } from "@/components/admin/Fields";
import { FormSection } from "@/components/admin/Panel";
import { Input } from "@/components/ui/Input";
import { CampaignPatchSchema, CampaignSchema } from "@/backend/admin/schemas/marketing";
import { slugify } from "@/lib/format";
import type { AdminCampaign } from "@/types/admin";
import { CAMPAIGN_STATUS } from "@/types/domain";
import { mutate } from "../../api";
import { ConfirmDelete } from "../../orders/components/ConfirmDelete";
import { detailErrors, fieldErrors, fromLocalInput, toLocalInput, toPaise, toRupees } from "../../orders/components/fmt";
import { FormActions } from "../../orders/components/FormActions";

export interface Pick { id: string; label: string }
export const CHANNELS = ["site", "email", "instagram", "whatsapp", "sms", "paid_social", "google", "influencer"] as const;

export function CampaignForm({ campaign, coupons, offers }: { campaign?: AdminCampaign; coupons: Pick[]; offers: Pick[] }) {
  const router = useRouter();
  const [f, setF] = useState({
    name: campaign?.name ?? "", slug: campaign?.slug ?? "", status: campaign?.status ?? "draft", channel: (campaign?.channel ?? "site") as (typeof CHANNELS)[number],
    description: campaign?.description ?? "", heroImageUrl: campaign?.heroImageUrl ?? "", heroImageAlt: campaign?.heroImageAlt ?? "", utm: campaign?.utmCampaign ?? "",
    couponId: campaign?.couponId ?? "", offerId: campaign?.offerId ?? "", budget: toRupees(campaign?.budgetPaise),
    startsAt: toLocalInput(campaign?.startsAt), endsAt: toLocalInput(campaign?.endsAt), seoTitle: campaign?.seoTitle ?? "", seoDescription: campaign?.seoDescription ?? "",
  });
  const [slugTouched, setSlugTouched] = useState(!!campaign);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v, ...(k === "name" && !slugTouched ? { slug: slugify(String(v)) } : {}) }));
  const text = (k: keyof typeof f, err = k as string) => ({ value: String(f[k]), onChange: (e: { target: { value: string } }) => set(k, e.target.value as never), error: errors[err] });
  const nul = (s: string) => s.trim() || null;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = {
      name: f.name.trim(), slug: f.slug, status: f.status, channel: f.channel, description: nul(f.description), heroImageUrl: nul(f.heroImageUrl), heroImageAlt: nul(f.heroImageAlt),
      utmCampaign: nul(f.utm), couponId: f.couponId || null, offerId: f.offerId || null, budgetPaise: f.budget ? toPaise(f.budget) : null,
      startsAt: fromLocalInput(f.startsAt), endsAt: fromLocalInput(f.endsAt), seoTitle: nul(f.seoTitle), seoDescription: nul(f.seoDescription),
    };
    const parsed = (campaign ? CampaignPatchSchema : CampaignSchema).safeParse(body);
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    setSaving(true);
    const res = await mutate(campaign ? "PATCH" : "POST", campaign ? `campaigns/${campaign.id}` : "campaigns", parsed.data, { success: campaign ? "Campaign saved" : "Campaign created" });
    setSaving(false);
    if (res.ok) { router.push("/admin/campaigns"); router.refresh(); } else setErrors(detailErrors(res.details));
  };
  const remove = async () => {
    setSaving(true);
    const res = await mutate("DELETE", `campaigns/${campaign?.id}`, undefined, { success: "Campaign deleted" });
    setSaving(false);
    if (res.ok) { router.push("/admin/campaigns"); router.refresh(); }
  };
  const linked = (label: string, key: "couponId" | "offerId", list: Pick[]) => (
    <Select label={label} value={f[key]} onChange={(e) => set(key, e.target.value)} error={errors[key]}>
      <option value="">None</option>{list.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
    </Select>
  );

  return (
    <form onSubmit={save} noValidate>
      <FormSection title="Basics">
        <Input label="Name" {...text("name")} maxLength={120} />
        <Input label="Slug" value={f.slug} onChange={(e) => { setSlugTouched(true); set("slug", e.target.value); }} error={errors.slug} />
        <Select label="Status" value={f.status} onChange={(e) => set("status", e.target.value as typeof f.status)}>{CAMPAIGN_STATUS.map((s) => <option key={s}>{s}</option>)}</Select>
        <Select label="Channel" value={f.channel} onChange={(e) => set("channel", e.target.value as typeof f.channel)}>{CHANNELS.map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}</Select>
        <Textarea label="Description" value={f.description} onChange={(e) => set("description", e.target.value)} error={errors.description} wrapperClassName="sm:col-span-2" maxLength={1000} />
      </FormSection>
      <FormSection title="Offer and budget">
        {linked("Coupon", "couponId", coupons)}{linked("Offer", "offerId", offers)}
        <Input label="UTM campaign" {...text("utm", "utmCampaign")} hint="lowercase letters, numbers, - and _" />
        <Input label="Budget (INR)" type="number" min="0" step="0.01" {...text("budget", "budgetPaise")} />
        <Input label="Starts" type="datetime-local" {...text("startsAt")} /><Input label="Ends" type="datetime-local" {...text("endsAt")} />
      </FormSection>
      <FormSection title="Hero and SEO">
        <Input label="Hero image URL" {...text("heroImageUrl")} /><Input label="Hero image alt text" {...text("heroImageAlt")} />
        <Input label="SEO title" {...text("seoTitle")} maxLength={70} /><Input label="SEO description" {...text("seoDescription")} maxLength={170} />
      </FormSection>
      <FormActions saving={saving} backHref="/admin/campaigns" extra={campaign && <ConfirmDelete busy={saving} onConfirm={() => void remove()} />} />
    </form>
  );
}
