"use client";

import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "../_features/admin/AdminShell";
import {
  clearAdminSession,
  type AdminSettingsData,
  getAccessToken,
  loadAdminSettings,
  updateAdminSettings,
} from "../_features/auth/adminAuth";

const settingLabels = {
  ai_review: {
    title: "AI Review",
    description: "Control how AI answers are monitored and escalated.",
    items: {
      auto_flag_low_confidence_answers: "Auto-flag low confidence answers",
      require_reviewer_approval_for_red_sessions: "Require reviewer approval for red sessions",
      send_daily_quality_summary: "Send daily quality summary",
    },
  },
  student_access: {
    title: "Student Access",
    description: "Manage student visibility and learning safeguards.",
    items: {
      allow_students_to_view_progress_reports: "Allow students to view progress reports",
      enable_quiet_hours_for_study_mode: "Enable quiet hours for study mode",
      lock_inactive_student_accounts: "Lock inactive student accounts",
    },
  },
} as const;

const emptySettings: AdminSettingsData = {
  profile: {
    full_name: "",
    email: "",
    role: "admin",
    role_label: "Admin",
    organization: "",
    profile_image_url: null,
    preferred_language: null,
  },
  workspace: {
    language: "English",
    timezone: "Asia/Phnom_Penh",
  },
  settings: {
    ai_review: {
      auto_flag_low_confidence_answers: true,
      require_reviewer_approval_for_red_sessions: true,
      send_daily_quality_summary: false,
    },
    student_access: {
      allow_students_to_view_progress_reports: true,
      enable_quiet_hours_for_study_mode: false,
      lock_inactive_student_accounts: true,
    },
  },
  security: {
    two_factor_authentication: "Enabled",
    last_password_update: "Not available",
    audit_logs: "90 days retained",
  },
};

function isAuthExpiredError(error: unknown) {
  if (!(error instanceof Error)) return false;
  return (
    error.message.includes("Admin session") ||
    error.message.includes("Invalid or expired authentication token") ||
    error.message.includes("Admin access is required")
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "A";
}

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<AdminSettingsData>(emptySettings);
  const [savedSettings, setSavedSettings] = useState<AdminSettingsData>(emptySettings);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/auth/Login");
      return;
    }

    loadAdminSettings()
      .then((data) => {
        setSettings(data);
        setSavedSettings(data);
        setError("");
      })
      .catch((loadError) => {
        if (isAuthExpiredError(loadError)) {
          clearAdminSession();
          router.replace("/auth/Login");
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "Unable to load settings");
      });
  }, [router]);

  function handleProfileImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      setSettings((current) => ({
        ...current,
        profile: {
          ...current.profile,
          profile_image_url: reader.result as string,
        },
      }));
      setMessage("");
    };
    reader.readAsDataURL(file);
  }

  function updateProfileField(field: keyof AdminSettingsData["profile"], value: string | null) {
    setSettings((current) => ({
      ...current,
      profile: {
        ...current.profile,
        [field]: value,
      },
    }));
    setMessage("");
  }

  function updateWorkspaceField(field: keyof AdminSettingsData["workspace"], value: string) {
    setSettings((current) => ({
      ...current,
      workspace: {
        ...current.workspace,
        [field]: value,
      },
    }));
    setMessage("");
  }

  function updateToggle(group: "ai_review" | "student_access", key: string) {
    setSettings((current) => ({
      ...current,
      settings: {
        ...current.settings,
        [group]: {
          ...current.settings[group],
          [key]: !current.settings[group][key],
        },
      },
    }));
    setMessage("");
  }

  async function saveSettings() {
    setSaving(true);
    setError("");
    try {
      const updated = await updateAdminSettings(settings);
      setSettings(updated);
      setSavedSettings(updated);
      setMessage("Settings saved.");
    } catch (saveError) {
      if (isAuthExpiredError(saveError)) {
        clearAdminSession();
        router.replace("/auth/Login");
        return;
      }
      setError(saveError instanceof Error ? saveError.message : "Unable to save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell
      active="Settings"
      title="Settings"
      subtitle="Configure admin profile, platform rules, and AI tutor safety controls."
      profileImage={savedSettings.profile.profile_image_url}
      adminName={savedSettings.profile.full_name || "Admin"}
      adminRole={savedSettings.profile.role_label || "Admin"}
      action={
        <button
          type="button"
          onClick={saveSettings}
          disabled={saving}
          className="h-11 rounded-lg bg-gradient-to-r from-[#4367ff] to-[#7a4dff] px-5 text-sm font-bold text-white shadow-lg shadow-blue-950/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      }
    >
      {error && (
        <p className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200">
          {error}
        </p>
      )}
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-xl border border-[#243856] bg-[#0b1324] p-6 shadow-[0_18px_45px_rgba(0,0,0,0.16)]">
          <div className="mb-6">
            <h2 className="text-lg font-extrabold text-white">Admin Profile</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Details shown across the admin workspace.
            </p>
          </div>

          <div className="mb-6 flex flex-col gap-4 rounded-lg border border-[#243856] bg-[#101a2b] p-4 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#5368ff] bg-gradient-to-br from-[#4367ff] to-[#7a4dff] text-xl font-extrabold text-white">
              {settings.profile.profile_image_url ? (
                <img
                  src={settings.profile.profile_image_url}
                  alt="Admin profile preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                initials(settings.profile.full_name)
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-100">Profile Picture</p>
              <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
                Upload a square JPG or PNG image for the admin avatar.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-lg border border-[#3b5d8f] bg-[#0b1324] px-4 text-sm font-bold text-slate-100 transition hover:border-[#6f7cff] hover:text-white">
                Upload Photo
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  className="sr-only"
                  onChange={handleProfileImageChange}
                />
              </label>
              {settings.profile.profile_image_url && (
                <button
                  type="button"
                  onClick={() => updateProfileField("profile_image_url", null)}
                  className="h-10 rounded-lg border border-[#3b5d8f] bg-[#0b1324] px-4 text-sm font-bold text-rose-300 transition hover:border-rose-400 hover:text-rose-200"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Full Name"
              value={settings.profile.full_name}
              onChange={(value) => updateProfileField("full_name", value)}
            />
            <Field
              label="Role"
              value={settings.profile.role_label}
              onChange={(value) => updateProfileField("role_label", value)}
            />
            <Field
              label="Email"
              value={settings.profile.email}
              onChange={(value) => updateProfileField("email", value)}
            />
            <Field
              label="Organization"
              value={settings.profile.organization}
              onChange={(value) => updateProfileField("organization", value)}
            />
          </div>
          {message && <p className="mt-4 text-sm font-bold text-emerald-300">{message}</p>}
        </section>

        <section className="rounded-xl border border-[#243856] bg-[#0b1324] p-6 shadow-[0_18px_45px_rgba(0,0,0,0.16)]">
          <div className="mb-6">
            <h2 className="text-lg font-extrabold text-white">Workspace</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Regional and display preferences.
            </p>
          </div>

          <div className="space-y-4">
            <SelectField
              label="Language"
              value={settings.workspace.language}
              options={["English", "Khmer", "English / Khmer"]}
              onChange={(value) => updateWorkspaceField("language", value)}
            />
            <SelectField
              label="Timezone"
              value={settings.workspace.timezone}
              options={["Asia/Phnom_Penh", "Asia/Bangkok", "UTC"]}
              onChange={(value) => updateWorkspaceField("timezone", value)}
            />
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <SettingsCard
          title={settingLabels.ai_review.title}
          description={settingLabels.ai_review.description}
          group="ai_review"
          labels={settingLabels.ai_review.items}
          values={settings.settings.ai_review}
          onToggle={updateToggle}
        />
        <SettingsCard
          title={settingLabels.student_access.title}
          description={settingLabels.student_access.description}
          group="student_access"
          labels={settingLabels.student_access.items}
          values={settings.settings.student_access}
          onToggle={updateToggle}
        />
      </div>

      <section className="mt-6 rounded-xl border border-[#243856] bg-[#0b1324] p-6 shadow-[0_18px_45px_rgba(0,0,0,0.16)]">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-white">Security</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Review admin access and audit preferences.
            </p>
          </div>
          <span className="w-fit rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300">
            Protected
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <SecurityTile label="Two-factor Authentication" value={settings.security.two_factor_authentication} />
          <SecurityTile label="Last Password Update" value={settings.security.last_password_update} />
          <SecurityTile label="Audit Logs" value={settings.security.audit_logs} />
        </div>
      </section>
    </AdminShell>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#8da7d8]">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-lg border border-[#3b5d8f] bg-[#101a2b] px-4 text-sm font-medium text-slate-100 outline-none transition placeholder:text-slate-400/70 focus:border-[#6f7cff] focus:ring-2 focus:ring-[#5368ff]/20"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#8da7d8]">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-lg border border-[#3b5d8f] bg-[#101a2b] px-4 text-sm font-medium text-slate-100 outline-none transition focus:border-[#6f7cff] focus:ring-2 focus:ring-[#5368ff]/20"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function SettingsCard({
  title,
  description,
  group,
  labels,
  values,
  onToggle,
}: {
  title: string;
  description: string;
  group: "ai_review" | "student_access";
  labels: Record<string, string>;
  values: Record<string, boolean>;
  onToggle: (group: "ai_review" | "student_access", key: string) => void;
}) {
  return (
    <section className="rounded-xl border border-[#243856] bg-[#0b1324] p-6 shadow-[0_18px_45px_rgba(0,0,0,0.16)]">
      <div className="mb-5">
        <h2 className="text-lg font-extrabold text-white">{title}</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">{description}</p>
      </div>

      <div className="space-y-3">
        {Object.entries(labels).map(([key, label]) => (
          <ToggleRow
            key={key}
            label={label}
            enabled={Boolean(values[key])}
            onToggle={() => onToggle(group, key)}
          />
        ))}
      </div>
    </section>
  );
}

function ToggleRow({
  label,
  enabled,
  onToggle,
}: {
  label: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between gap-4 rounded-lg border border-[#243856] bg-[#101a2b] px-4 py-3 text-left transition hover:border-[#35507a]"
    >
      <span className="text-sm font-semibold text-slate-200">{label}</span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          enabled ? "bg-[#5368ff]" : "bg-[#263a59]"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${
            enabled ? "left-6" : "left-1"
          }`}
        />
      </span>
    </button>
  );
}

function SecurityTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#243856] bg-[#101a2b] p-4">
      <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#8da7d8]">
        {label}
      </p>
      <p className="mt-3 text-sm font-bold text-slate-100">{value}</p>
    </div>
  );
}
