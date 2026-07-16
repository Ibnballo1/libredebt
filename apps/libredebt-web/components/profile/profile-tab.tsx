/**
 * components/profile/profile-tab.tsx
 *
 * Three sections: profile info (name + currency), change password,
 * and a dangerous "delete account" zone at the bottom — visually
 * separated and de-emphasized until the user scrolls to it.
 */

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import {
  updateProfileAction,
  changePasswordAction,
  deleteAccountAction,
} from "@/server/actions/profile.actions";
import {
  updateProfileSchema,
  changePasswordSchema,
  type UpdateProfileInput,
  type ChangePasswordInput,
} from "@/server/validators/profile.schema";
import { SUPPORTED_CURRENCIES } from "@/server/validators/debt.schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ProfileTabProps = {
  user: { name: string; email: string; currency: string };
};

const labelClass =
  "block text-[10px] font-bold tracking-widest uppercase text-[#374151] mb-1.5";
const fieldClass = (hasError: boolean) =>
  cn(
    "w-full rounded-lg border px-3 py-2.5 text-sm text-[#0F172A] outline-none transition-colors",
    "focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20",
    hasError
      ? "border-red-300 bg-red-50/50"
      : "border-[#E2E8F0] bg-white hover:border-[#CBD5E1]",
  );

// ─── Profile info section ──────────────────────────────────────────────────────

function ProfileInfoSection({ user }: ProfileTabProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name: user.name, currency: user.currency },
  });

  const { execute, isPending } = useAction(updateProfileAction, {
    onSuccess: ({ data }) => {
      if (data?.success) toast.success("Profile updated");
      else toast.error("Failed to update profile");
    },
  });

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold text-[#0F172A] mb-4">Profile</p>
      <form
        onSubmit={handleSubmit((data) => execute(data))}
        className="space-y-4"
        noValidate
      >
        <div>
          <label className={labelClass}>Full name</label>
          <input {...register("name")} className={fieldClass(!!errors.name)} />
          {errors.name && (
            <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className={labelClass}>Email</label>
          <div className="flex items-center rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2.5 text-sm text-[#94A3B8]">
            {user.email}
          </div>
          <p className="mt-1 text-[10px] text-[#94A3B8]">
            Contact support to change your email address
          </p>
        </div>

        <div className="max-w-[240px]">
          <label className={labelClass}>Preferred currency</label>
          <select {...register("currency")} className={fieldClass(false)}>
            {SUPPORTED_CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[10px] text-[#94A3B8]">
            Affects display formatting only — existing debts keep their own
            currency
          </p>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isPending || !isDirty}
            className="rounded-lg bg-[#0F172A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1E293B] transition-colors disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Change password section ───────────────────────────────────────────────────

function PasswordField({
  id,
  label,
  registerKey,
  register,
  visible,
  onToggle,
  error,
}: {
  id: string;
  label: string;
  registerKey: "currentPassword" | "newPassword" | "confirmPassword";
  register: ReturnType<typeof useForm<ChangePasswordInput>>["register"];
  visible: boolean;
  onToggle: () => void;
  error?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          {...register(registerKey)}
          className={cn(fieldClass(!!error), "pr-10")}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B]"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function ChangePasswordSection() {
  const [show, setShow] = useState({
    current: false,
    next: false,
    confirm: false,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  const { execute, isPending } = useAction(changePasswordAction, {
    onSuccess: ({ data }) => {
      if (data?.success) {
        toast.success("Password changed", {
          description: "You've been signed out of other devices.",
        });
        reset();
      } else {
        toast.error(data?.error ?? "Failed to change password");
      }
    },
  });

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold text-[#0F172A] mb-4">
        Change password
      </p>
      <form
        onSubmit={handleSubmit((data) => execute(data))}
        className="space-y-4"
        noValidate
      >
        <PasswordField
          id="currentPassword"
          label="Current password"
          registerKey="currentPassword"
          register={register}
          visible={show.current}
          onToggle={() => setShow((s) => ({ ...s, current: !s.current }))}
          error={errors.currentPassword?.message}
        />
        <PasswordField
          id="newPassword"
          label="New password"
          registerKey="newPassword"
          register={register}
          visible={show.next}
          onToggle={() => setShow((s) => ({ ...s, next: !s.next }))}
          error={errors.newPassword?.message}
        />
        <PasswordField
          id="confirmPassword"
          label="Confirm new password"
          registerKey="confirmPassword"
          register={register}
          visible={show.confirm}
          onToggle={() => setShow((s) => ({ ...s, confirm: !s.confirm }))}
          error={errors.confirmPassword?.message}
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-[#0F172A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1E293B] transition-colors disabled:opacity-50"
        >
          {isPending ? "Changing…" : "Change password"}
        </button>
      </form>
    </div>
  );
}

// ─── Danger zone ────────────────────────────────────────────────────────────────

function DangerZoneSection() {
  const [showDialog, setShowDialog] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const { execute, isPending } = useAction(deleteAccountAction, {
    onError: () =>
      toast.error("Failed to delete account. Please contact support."),
  });

  return (
    <div className="rounded-xl border border-red-200 bg-red-50/30 p-6">
      <p className="text-sm font-semibold text-red-700 mb-1">Delete account</p>
      <p className="text-xs text-red-600/80 leading-relaxed mb-4">
        This permanently deletes your profile and signs you out everywhere. Your
        debts are archived and payment history is preserved for financial
        record-keeping, but you will lose access to them. This cannot be undone.
      </p>
      <button
        onClick={() => setShowDialog(true)}
        className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
      >
        Delete my account
      </button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              This is permanent. Type <strong>DELETE</strong> below to confirm.
            </DialogDescription>
          </DialogHeader>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            className={fieldClass(false)}
          />
          <DialogFooter>
            <button
              onClick={() => setShowDialog(false)}
              disabled={isPending}
              className="rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm font-medium text-[#0F172A] hover:bg-[#F8FAFC] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => execute({ confirmText: confirmText as "DELETE" })}
              disabled={isPending || confirmText !== "DELETE"}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isPending ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Deleting…
                </>
              ) : (
                "Delete permanently"
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Main export ────────────────────────────────────────────────────────────────

export function ProfileTab({ user }: ProfileTabProps) {
  return (
    <div className="space-y-5">
      <ProfileInfoSection user={user} />
      <ChangePasswordSection />
      <DangerZoneSection />
    </div>
  );
}
