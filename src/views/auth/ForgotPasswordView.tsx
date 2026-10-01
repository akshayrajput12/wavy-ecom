"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authCopy } from "@/data/copy";
import { ac } from "@/views/account/copy";
import { resetPassword } from "./actions";
import { AuthShell, FormAlert } from "./components/AuthShell";
import { resetSchema, type AuthResult, type ResetValues } from "./schema";

export function ForgotPasswordView() {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<AuthResult>({});
  const { register, handleSubmit, formState: { errors } } = useForm<ResetValues>({ resolver: zodResolver(resetSchema), mode: "onTouched" });
  const onSubmit = (v: ResetValues) => start(async () => setResult(await resetPassword(v)));

  return (
    <AuthShell overline={authCopy.forgot.overline} title={authCopy.forgot.title} body={authCopy.forgot.body}
      footer={<Link href="/login" className="font-medium text-ink underline underline-offset-4">{ac.auth.backToLogin}</Link>}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
        <FormAlert {...result} />
        <Input label={ac.auth.email} type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
        <Button type="submit" size="lg" full loading={pending}>{ac.auth.sendLink}</Button>
      </form>
    </AuthShell>
  );
}
