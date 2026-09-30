"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authCopy } from "@/data/copy";
import { ac } from "@/views/account/copy";
import { signIn } from "./actions";
import { AuthShell, FormAlert } from "./components/AuthShell";
import { loginSchema, type AuthResult, type LoginValues } from "./schema";

export function LoginView({ next }: { next?: string }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<AuthResult>({});
  const { register, handleSubmit, formState: { errors } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema), mode: "onTouched", defaultValues: { next },
  });
  const onSubmit = (v: LoginValues) => start(async () => setResult((await signIn(v)) ?? {}));

  return (
    <AuthShell {...authCopy.login} footer={<>{ac.auth.newHere} <Link href={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"} className="font-medium text-ink underline underline-offset-4">{ac.auth.create}</Link></>}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
        <FormAlert {...result} />
        <Input label={ac.auth.email} type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
        <Input label={ac.auth.password} type="password" autoComplete="current-password" error={errors.password?.message} {...register("password")} />
        <Link href="/forgot-password" className="justify-self-end text-meta underline underline-offset-4">{ac.auth.forgot}</Link>
        <Button type="submit" full loading={pending}>{ac.auth.login}</Button>
        {next?.startsWith("/checkout") && <Link href="/checkout" className="inline-flex min-h-11 items-center justify-center text-meta text-ink-soft underline underline-offset-4">{ac.auth.guest}</Link>}
      </form>
    </AuthShell>
  );
}
