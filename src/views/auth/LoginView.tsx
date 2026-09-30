"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authCopy } from "@/data/account";
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
    <AuthShell {...authCopy.login} footer={<>New here? <Link href="/signup" className="font-medium text-ink underline underline-offset-4">Create an account</Link></>}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
        <FormAlert {...result} />
        <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
        <Input label="Password" type="password" autoComplete="current-password" error={errors.password?.message} {...register("password")} />
        <Link href="/forgot-password" className="justify-self-end text-meta underline underline-offset-4">Forgot password?</Link>
        <Button type="submit" full loading={pending}>Log in</Button>
        <Link href="/checkout" className="text-center text-meta text-ink-soft underline underline-offset-4">Continue as guest</Link>
      </form>
    </AuthShell>
  );
}
