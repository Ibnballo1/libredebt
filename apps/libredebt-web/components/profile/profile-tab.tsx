/**
 * components/profile/profile-tab.tsx — UPDATED
 *
 * Four sections:
 *   1. Profile info (name, email, currency)
 *   2. Messaging & Reminders (phone, SMS toggle, WhatsApp toggle)
 *   3. Change password
 *   4. Danger zone (delete account)
 *
 * Uses schemaResolver from lib/zod-resolver.ts instead of zodResolver
 * from @hookform/resolvers — compatible with Zod v4.
 */

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { schemaResolver } from "@/lib/zod-resolver";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import {
  Eye,
  EyeOff,
  Phone,
  MessageSquare,
  MessageCircle,
  Info,
} from "lucide-react";
import {
  updateProfileAction,
  changePasswordAction,
  deleteAccountAction,
} from "@/server/actions/profile.actions";
import {
  updateProfileSchema,
  changePasswordSchema,
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

// Plain form values type — matches the schema input shape.
type ProfileFormValues = {
  name: string;
  currency: string;
  phone?: string;
  smsEnabled?: boolean;
  whatsappEnabled?: boolean;
};

type ProfileTabProps = {
  user: {
    name: string;
    email: string;
    currency: string;
    phone?: string | null;
    smsEnabled?: boolean;
    whatsappEnabled?: boolean;
  };
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

// ─── Toggle ────────────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={cn(
        "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent",
        "transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:ring-offset-2",
        checked ? "bg-[#10B981]" : "bg-[#E2E8F0]",
        disabled && "opacity-40 cursor-not-allowed",
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
          checked ? "translate-x-4" : "translate-x-0",
        )}
      />
    </button>
  );
}

// ─── 1 + 2. Profile info + Messaging — one shared form ────────────────────────

function ProfileInfoSection({ user }: ProfileTabProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: schemaResolver(updateProfileSchema),
    defaultValues: {
      name: user.name,
      currency: user.currency,
      // Phone: null/undefined → "" so the input is always a controlled string
      phone: user.phone ?? "",
      smsEnabled: user.smsEnabled ?? false,
      whatsappEnabled: user.whatsappEnabled ?? false,
    },
  });

  const { execute, isPending } = useAction(updateProfileAction, {
    onSuccess: ({ data }) => {
      if (data?.success) toast.success("Profile updated");
      else toast.error("Failed to update profile");
    },
  });

  const phoneValue = watch("phone");
  const smsValue = watch("smsEnabled");
  const whatsappValue = watch("whatsappEnabled");
  const hasPhone = !!phoneValue?.trim();

  return (
    <form
      onSubmit={handleSubmit((data) => execute(data))}
      className="space-y-5"
      noValidate
    >
      {/* ── Section 1: Profile info ────────────────────────────────────── */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-[#0F172A] mb-4">Profile</p>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className={labelClass}>Full name</label>
            <input
              {...register("name")}
              autoComplete="name"
              className={fieldClass(!!errors.name)}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Email — read-only */}
          <div>
            <label className={labelClass}>Email</label>
            <div className="flex items-center rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2.5 text-sm text-[#94A3B8]">
              {user.email}
            </div>
            <p className="mt-1 text-[10px] text-[#94A3B8]">
              Contact support to change your email address
            </p>
          </div>

          {/* Currency */}
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
        </div>
      </div>

      {/* ── Section 2: Messaging & Reminders ──────────────────────────── */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3 mb-5">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#10B981]/10">
            <Phone className="h-4 w-4 text-[#10B981]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#0F172A]">
              Messaging & Reminders
            </p>
            <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">
              Add your phone number to receive payment reminders via SMS or
              WhatsApp in addition to email. Completely optional.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Phone number */}
          <div>
            <label className={labelClass}>Phone number (optional)</label>
            <input
              {...register("phone")}
              type="tel"
              placeholder="e.g. 08031234567 or +2348031234567"
              autoComplete="tel"
              className={fieldClass(!!errors.phone)}
            />
            {errors.phone ? (
              <p className="mt-1 text-xs text-red-500">
                {errors.phone.message}
              </p>
            ) : (
              <p className="mt-1 text-[10px] text-[#94A3B8]">
                Nigerian numbers accepted in any format. International numbers
                need the country code.
              </p>
            )}
          </div>

          {/* SMS toggle */}
          <div
            className={cn(
              "flex items-center justify-between rounded-lg border px-4 py-3.5 transition-colors",
              "border-[#E2E8F0] bg-[#F8FAFC]",
              !hasPhone && "opacity-50",
            )}
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="h-4 w-4 text-[#64748B] flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-[#0F172A]">
                  SMS reminders
                </p>
                <p className="text-[10px] text-[#94A3B8]">
                  Due-soon alerts and overdue notices via text message
                </p>
              </div>
            </div>
            <Toggle
              checked={smsValue ?? false}
              onChange={(v) => setValue("smsEnabled", v, { shouldDirty: true })}
              disabled={!hasPhone}
            />
          </div>

          {/* WhatsApp toggle */}
          <div
            className={cn(
              "flex items-center justify-between rounded-lg border px-4 py-3.5 transition-colors",
              "border-[#E2E8F0] bg-[#F8FAFC]",
              !hasPhone && "opacity-50",
            )}
          >
            <div className="flex items-center gap-3">
              <MessageCircle className="h-4 w-4 text-[#25D366] flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-[#0F172A]">
                  WhatsApp reminders
                </p>
                <p className="text-[10px] text-[#94A3B8]">
                  Same reminders delivered to your WhatsApp
                </p>
              </div>
            </div>
            <Toggle
              checked={whatsappValue ?? false}
              onChange={(v) =>
                setValue("whatsappEnabled", v, { shouldDirty: true })
              }
              disabled={!hasPhone}
            />
          </div>

          {/* Context note — no phone but toggles on */}
          {!hasPhone && (smsValue || whatsappValue) && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
              <Info className="h-3.5 w-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                Add a phone number above to activate SMS and WhatsApp reminders.
              </p>
            </div>
          )}

          {/* Confirmation note — phone + at least one channel on */}
          {hasPhone && (smsValue || whatsappValue) && (
            <div className="flex items-start gap-2 rounded-lg border border-[#10B981]/20 bg-[#10B981]/5 px-3 py-2.5">
              <Info className="h-3.5 w-3.5 text-[#10B981] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-[#10B981]">
                You&apos;ll receive reminders for due-soon payments (7, 3, 1 day
                before) and overdue alerts. Email reminders are always on
                regardless.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Shared save button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending || !isDirty}
          className="rounded-lg bg-[#0F172A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1E293B] transition-colors disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

// ─── 3. Change password ────────────────────────────────────────────────────────

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
    resolver: schemaResolver(changePasswordSchema),
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

// ─── 4. Danger zone ────────────────────────────────────────────────────────────

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
