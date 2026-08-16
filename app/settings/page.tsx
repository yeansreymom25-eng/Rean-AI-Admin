"use client";

import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { AdminShell } from "../_features/admin/AdminShell";

const settingsSections = [
  {
    title: "AI Review",
    description: "Control how AI answers are monitored and escalated.",
    items: [
      ["Auto-flag low confidence answers", true],
      ["Require reviewer approval for red sessions", true],
      ["Send daily quality summary", false],
    ],
  },
  {
    title: "Student Access",
    description: "Manage student visibility and learning safeguards.",
    items: [
      ["Allow students to view progress reports", true],
      ["Enable quiet hours for study mode", false],
      ["Lock inactive student accounts", true],
    ],
  },
];

type Profile = {
  fullName: string;
  role: string;
  email: string;
  organization: string;
  image: string | null;
};

const defaultProfile: Profile = {
  fullName: "Charya Som",
  role: "Senior Admin",
  email: "charya@rean-ai.edu",
  organization: "Rean AI Learning",
  image: null,
};

const profileStorageKey = "rean-ai-admin-profile";

export default function SettingsPage() {
  const [language, setLanguage] = useState("English");
  const [timezone, setTimezone] = useState("Asia/Phnom_Penh");
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [savedProfile, setSavedProfile] = useState<Profile>(defaultProfile);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    const storedProfile = localStorage.getItem(profileStorageKey);

    if (!storedProfile) {
      return;
    }

    try {
      const parsedProfile = JSON.parse(storedProfile) as Partial<Profile>;
      const nextProfile = {
        ...defaultProfile,
        ...parsedProfile,
      };

      setProfile(nextProfile);
      setSavedProfile(nextProfile);
    } catch {
      localStorage.removeItem(profileStorageKey);
    }
  }, []);

  function handleProfileImageChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        return;
      }

      setProfile((currentProfile) => ({
        ...currentProfile,
        image: reader.result as string,
      }));
      setSaveMessage("");
    };

    reader.readAsDataURL(file);
  }

  function removeProfileImage() {
    setProfile((currentProfile) => ({
      ...currentProfile,
      image: null,
    }));
    setSaveMessage("");
  }

  function updateProfileField(
    field: keyof Omit<Profile, "image">,
    value: string,
  ) {
    setProfile((currentProfile) => ({
      ...currentProfile,
      [field]: value,
    }));
    setSaveMessage("");
  }

  function saveSettings() {
    localStorage.setItem(profileStorageKey, JSON.stringify(profile));
    setSavedProfile(profile);
    setSaveMessage("Profile saved.");
  }

  return (
    <AdminShell
      active="Settings"
      title="Settings"
      subtitle="Configure admin profile, platform rules, and AI tutor safety controls."
      profileImage={savedProfile.image}
      adminName={savedProfile.fullName}
      adminRole={savedProfile.role}
      action={
        <button
          type="button"
          onClick={saveSettings}
          className="h-11 rounded-lg bg-gradient-to-r from-[#4367ff] to-[#7a4dff] px-5 text-sm font-bold text-white shadow-lg shadow-blue-950/30 transition hover:brightness-110"
        >
          Save Changes
        </button>
      }
    >
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
              {profile.image ? (
                <img
                  src={profile.image}
                  alt="Admin profile preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                "CS"
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
              {profile.image && (
                <button
                  type="button"
                  onClick={removeProfileImage}
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
              value={profile.fullName}
              onChange={(value) => updateProfileField("fullName", value)}
            />
            <Field
              label="Role"
              value={profile.role}
              onChange={(value) => updateProfileField("role", value)}
            />
            <Field
              label="Email"
              value={profile.email}
              onChange={(value) => updateProfileField("email", value)}
            />
            <Field
              label="Organization"
              value={profile.organization}
              onChange={(value) => updateProfileField("organization", value)}
            />
          </div>
          {saveMessage && (
            <p className="mt-4 text-sm font-bold text-emerald-300">
              {saveMessage}
            </p>
          )}
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
              value={language}
              options={["English", "Khmer", "English / Khmer"]}
              onChange={setLanguage}
            />
            <SelectField
              label="Timezone"
              value={timezone}
              options={["Asia/Phnom_Penh", "Asia/Bangkok", "UTC"]}
              onChange={setTimezone}
            />
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {settingsSections.map((section) => (
          <SettingsCard
            key={section.title}
            title={section.title}
            description={section.description}
            items={section.items}
          />
        ))}
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
          <SecurityTile label="Two-factor Authentication" value="Enabled" />
          <SecurityTile label="Last Password Update" value="18 days ago" />
          <SecurityTile label="Audit Logs" value="90 days retained" />
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
  items,
}: {
  title: string;
  description: string;
  items: (string | boolean)[][];
}) {
  return (
    <section className="rounded-xl border border-[#243856] bg-[#0b1324] p-6 shadow-[0_18px_45px_rgba(0,0,0,0.16)]">
      <div className="mb-5">
        <h2 className="text-lg font-extrabold text-white">{title}</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">{description}</p>
      </div>

      <div className="space-y-3">
        {items.map(([label, enabled]) => (
          <ToggleRow key={String(label)} label={String(label)} defaultOn={Boolean(enabled)} />
        ))}
      </div>
    </section>
  );
}

function ToggleRow({ label, defaultOn }: { label: string; defaultOn: boolean }) {
  const [enabled, setEnabled] = useState(defaultOn);

  return (
    <button
      type="button"
      onClick={() => setEnabled((current) => !current)}
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
