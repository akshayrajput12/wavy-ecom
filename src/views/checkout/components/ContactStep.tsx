"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { checkoutCopy } from "@/data/checkout";
import { contactSchema, type ContactValues } from "../schema";

export function ContactStep({ defaultValues, signedIn, onDone }: {
  defaultValues?: Partial<ContactValues>; signedIn: boolean; onDone: (v: ContactValues) => void;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    mode: "onTouched",
    defaultValues: { marketing: false, ...defaultValues },
  });

  return (
    <form onSubmit={handleSubmit(onDone)} noValidate className="grid gap-4">
      {!signedIn && (
        <p className="text-body text-ink-soft">
          {checkoutCopy.loginPrompt}{" "}
          <Link href="/login?next=/checkout" className="font-medium text-ink underline underline-offset-4">{checkoutCopy.loginCta}</Link>
        </p>
      )}
      <Input label="Email" type="email" autoComplete="email" hint="Order confirmation goes here" error={errors.email?.message} {...register("email")} />
      <Input label="Mobile number" type="tel" inputMode="numeric" maxLength={10} autoComplete="tel-national"
        hint="10 digits, for delivery and OTP updates" error={errors.phone?.message} {...register("phone")} />
      <label className="flex min-h-11 items-center gap-3 text-body">
        <input type="checkbox" className="size-4 accent-ink" {...register("marketing")} /> Email me about new drops and offers
      </label>
      <Button type="submit" className="justify-self-start">Continue to address</Button>
    </form>
  );
}
