"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import type { AccountUser } from "@/backend/account/repo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api } from "@/stores/http";
import { ac } from "./copy";

const schema = z.object({
  fullName: z.string().trim().min(1, "Enter your full name").max(120),
  phone: z.string().trim().regex(/^(\+91)?[6-9]\d{9}$/, "Enter a valid 10-digit mobile number").or(z.literal("")),
  marketingOptIn: z.boolean(),
});
type Values = z.infer<typeof schema>;

/** PATCH /api/account/profile. Email changes go through support (auth identity). */
export function ProfileView({ user }: { user: AccountUser }) {
  const router = useRouter();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } = useForm<Values>({
    resolver: zodResolver(schema), mode: "onTouched",
    defaultValues: { fullName: user.name, phone: user.phone, marketingOptIn: user.marketingOptIn },
  });

  const onSubmit = async (v: Values) => {
    const r = await api<AccountUser>("/api/account/profile", { method: "PATCH", body: { ...v, phone: v.phone || undefined } });
    if (!r.ok) return void toast.error(r.error.message);
    reset({ fullName: r.data.name, phone: r.data.phone, marketingOptIn: r.data.marketingOptIn });
    toast.success(ac.profileSaved);
    router.refresh();
  };

  return (
    <div className="grid max-w-xl gap-8">
      <header className="grid gap-3"><p className="t-overline">{ac.overline}</p><h1 className="t-h1">{ac.profile}</h1></header>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5 rounded-xl border border-line bg-surface p-5 sm:p-8">
        <Input label={ac.name} autoComplete="name" error={errors.fullName?.message} {...register("fullName")} />
        <Input label={ac.email} type="email" value={user.email} readOnly disabled hint={ac.emailHint} />
        <Input label={ac.phone} type="tel" inputMode="tel" maxLength={13} autoComplete="tel-national" error={errors.phone?.message} {...register("phone")} />
        <label className="flex min-h-11 items-center gap-3 text-body">
          <input type="checkbox" className="size-5 accent-ink" {...register("marketingOptIn")} /> {ac.marketing}
        </label>
        <Button type="submit" className="sm:justify-self-start" loading={isSubmitting} disabled={!isDirty}>{ac.saveChanges}</Button>
      </form>
    </div>
  );
}
