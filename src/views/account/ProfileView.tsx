"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { AccountUser } from "@/backend/orders/repo";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your full name"),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number"),
  marketing: z.boolean(),
});
type Values = z.infer<typeof schema>;

// ponytail: save is a stub toast until backend ships a profile endpoint
export function ProfileView({ user }: { user: AccountUser }) {
  const { register, handleSubmit, formState: { errors, isSubmitting, isDirty } } = useForm<Values>({
    resolver: zodResolver(schema), mode: "onTouched", defaultValues: { name: user.name, phone: user.phone, marketing: false },
  });
  return (
    <div className="grid max-w-xl gap-6">
      <h1 className="t-h1">Profile</h1>
      <form onSubmit={handleSubmit(() => { toast.success("Profile updated"); })} noValidate className="grid gap-4 rounded-md border border-line bg-surface p-5">
        <Input label="Full name" autoComplete="name" error={errors.name?.message} {...register("name")} />
        <Input label="Email" type="email" value={user.email} readOnly disabled hint="Contact support to change your email" />
        <Input label="Mobile number" type="tel" inputMode="numeric" maxLength={10} error={errors.phone?.message} {...register("phone")} />
        <label className="flex min-h-11 items-center gap-3 text-body">
          <input type="checkbox" className="size-4 accent-ink" {...register("marketing")} /> Email me about new drops and offers
        </label>
        <Button type="submit" className="justify-self-start" loading={isSubmitting} disabled={!isDirty}>Save changes</Button>
      </form>
    </div>
  );
}
