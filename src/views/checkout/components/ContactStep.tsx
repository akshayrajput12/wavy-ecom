"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { checkoutCopy } from "@/data/copy";
import { co } from "../copy";
import { contactSchema, type ContactValues } from "../schema";

export function ContactStep({ defaultValues, signedIn, onChange, onDone }: {
  defaultValues: Partial<ContactValues>; signedIn: boolean;
  onChange: (v: Partial<ContactValues>) => void; onDone: (v: ContactValues) => void;
}) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema), mode: "onTouched", defaultValues,
  });
  useEffect(() => { const s = watch((v) => onChange(v)); return () => s.unsubscribe(); }, [watch, onChange]);

  return (
    <form onSubmit={handleSubmit(onDone)} noValidate className="grid gap-4">
      {!signedIn && (
        <p className="rounded-md bg-surface-warm px-4 py-3 text-body text-ink-soft">
          {checkoutCopy.loginPrompt}{" "}
          <Link href="/login?next=/checkout" className="font-medium text-ink underline underline-offset-4">{checkoutCopy.loginCta}</Link>
        </p>
      )}
      <Input label={co.contact.email} type="email" autoComplete="email" inputMode="email" hint={co.contact.emailHint} error={errors.email?.message} {...register("email")} />
      <Input label={co.contact.phone} type="tel" inputMode="tel" maxLength={13} autoComplete="tel-national" hint={co.contact.phoneHint} error={errors.phone?.message} {...register("phone")} />
      <Button type="submit" size="lg" className="sm:justify-self-start">{co.contact.cta}</Button>
    </form>
  );
}
