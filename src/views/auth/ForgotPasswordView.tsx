"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authCopy } from "@/data/account";
import { resetPassword } from "./actions";
import { AuthShell, FormAlert } from "./components/AuthShell";
import { resetSchema, type AuthResult, type ResetValues } from "./schema";

export function ForgotPasswordView() {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<AuthResult>({});
  const { register, handleSubmit, formState: { errors } } = useForm<ResetValues>({ resolver: zodResolver(resetSchema), mode: "onTouched" });
  const onSubmit = (v: ResetValues) => start(async () => setResult(await resetPassword(v)));

  return (
    <AuthShell title={authCopy.forgot.title} body={authCopy.forgot.body}
      footer={<Link href="/login" className="font-medium text-ink underline underline-offset-4">Back to log in</Link>}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
        <FormAlert {...result} />
        <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
        <Button type="submit" full loading={pending}>Send reset link</Button>
      </form>
    </AuthShell>
  );
}
