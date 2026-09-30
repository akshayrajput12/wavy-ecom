"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authCopy } from "@/data/account";
import { signUp } from "./actions";
import { AuthShell, FormAlert } from "./components/AuthShell";
import { signupSchema, type AuthResult, type SignupValues } from "./schema";

export function SignupView() {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<AuthResult>({});
  const { register, handleSubmit, formState: { errors } } = useForm<SignupValues>({ resolver: zodResolver(signupSchema), mode: "onTouched" });
  const onSubmit = (v: SignupValues) => start(async () => setResult((await signUp(v)) ?? {}));

  return (
    <AuthShell {...authCopy.signup} footer={<>Already have an account? <Link href="/login" className="font-medium text-ink underline underline-offset-4">Log in</Link></>}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
        <FormAlert {...result} />
        <Input label="Full name" autoComplete="name" error={errors.name?.message} {...register("name")} />
        <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
        <Input label="Mobile number" type="tel" inputMode="numeric" maxLength={10} autoComplete="tel-national" error={errors.phone?.message} {...register("phone")} />
        <Input label="Password" type="password" autoComplete="new-password" hint="At least 8 characters" error={errors.password?.message} {...register("password")} />
        <div className="grid gap-1">
          <label className="flex min-h-11 items-start gap-3 text-body">
            <input type="checkbox" className="mt-1 size-4 accent-ink" aria-invalid={!!errors.terms} aria-describedby="terms-msg" {...register("terms")} />
            <span>{authCopy.terms}</span>
          </label>
          {errors.terms && <p id="terms-msg" className="text-meta text-danger">⚠ {errors.terms.message}</p>}
        </div>
        <Button type="submit" full loading={pending}>Create account</Button>
      </form>
    </AuthShell>
  );
}
