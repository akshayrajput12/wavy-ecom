"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authCopy } from "@/data/copy";
import { ac } from "@/views/account/copy";
import { signUp } from "./actions";
import { AuthShell, FormAlert } from "./components/AuthShell";
import { signupSchema, type AuthResult, type SignupValues } from "./schema";

export function SignupView({ next }: { next?: string }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<AuthResult>({});
  const { register, handleSubmit, formState: { errors } } = useForm<SignupValues>({ resolver: zodResolver(signupSchema), mode: "onTouched", defaultValues: { next } });
  const onSubmit = (v: SignupValues) => start(async () => setResult((await signUp(v)) ?? {}));

  return (
    <AuthShell {...authCopy.signup} footer={<>{ac.auth.haveAccount} <Link href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"} className="font-medium text-ink underline underline-offset-4">{ac.auth.login}</Link></>}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
        <FormAlert {...result} />
        <Input label={ac.auth.name} autoComplete="name" error={errors.name?.message} {...register("name")} />
        <Input label={ac.auth.email} type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
        <Input label={ac.auth.phone} type="tel" inputMode="numeric" maxLength={10} autoComplete="tel-national" error={errors.phone?.message} {...register("phone")} />
        <Input label={ac.auth.password} type="password" autoComplete="new-password" hint={ac.auth.passwordHint} error={errors.password?.message} {...register("password")} />
        <div className="grid gap-1">
          <label className="flex min-h-11 items-start gap-3 text-body">
            <input type="checkbox" className="mt-1 size-4 accent-ink" aria-invalid={!!errors.terms} aria-describedby="terms-msg" {...register("terms")} />
            <span>{authCopy.terms}</span>
          </label>
          {errors.terms && <p id="terms-msg" className="text-meta text-danger">⚠ {errors.terms.message}</p>}
        </div>
        <Button type="submit" full loading={pending}>{ac.auth.signup}</Button>
      </form>
    </AuthShell>
  );
}
