"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import Section from "./Section";

type Title = { title: string; primary: boolean };
type Email = {
  email: string;
  primary: boolean;
  verified: boolean;
  label: string;
};

type Fields = {
  name: string;
  titles: Title[];
  emails: Email[];
  contact_info: string;
  address: string;
  city: string;
  state: string;
  special_instructions: string;
};

const initialFields: Fields = {
  name: "",
  titles: [{ title: "", primary: true }],
  emails: [{ email: "", primary: true, verified: false, label: "" }],
  contact_info: "",
  address: "",
  city: "",
  state: "",
  special_instructions: "",
};

export default function AccountForm() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [fields, setFields] = useState<Fields>(initialFields);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      setSaveSuccess(false);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setError("Unauthorized. Please log in.");
        setLoading(false);
        return;
      }

      setUserId(user.id);

      const { data: profile, error: dbError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (dbError) {
        setError("Error loading account data.");
        setLoading(false);
        return;
      }

      if (profile) {
        setFields({
          name: profile.name ?? "",
          titles:
            Array.isArray(profile.titles) && profile.titles.length
              ? profile.titles
              : [{ title: "", primary: true }],
          emails:
            Array.isArray(profile.emails) && profile.emails.length
              ? profile.emails
              : [{ email: "", primary: true, verified: false, label: "" }],
          contact_info: profile.contact_info ?? "",
          address: profile.address ?? "",
          city: profile.city ?? "",
          state: profile.state ?? "",
          special_instructions: profile.special_instructions ?? "",
        });
      }

      setLoading(false);
    }

    fetchData();
  }, [supabase]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();

    if (!userId) {
      setError("No user authenticated.");
      return;
    }

    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    const { error: upError } = await supabase
      .from("user_profiles")
      .upsert(
        [
          {
            user_id: userId,
            ...fields,
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: "user_id" }
      );

    if (upError) {
      setError("Could not save profile. " + upError.message);
    } else {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }

    setSaving(false);
  }

  return (
    <>
      {loading && (
        <div className="text-neutral-400">Loading your profile…</div>
      )}

      {error && (
        <div className="p-4 rounded-lg bg-red-900/60 text-red-200 border border-red-800 shadow">
          {error}
        </div>
      )}

      {saveSuccess && (
        <div className="p-4 rounded-lg bg-green-900/60 text-green-200 border border-green-800 shadow">
          Profile saved successfully
        </div>
      )}

      {!loading && (
        <form onSubmit={saveProfile} className="space-y-10">
          <Section title="Basic Information">
            <label className="block">
              <span className="text-sm text-neutral-400">Name</span>
              <input
                type="text"
                value={fields.name}
                onChange={(e) =>
                  setFields({ ...fields, name: e.target.value })
                }
                className="w-full mt-1 px-4 py-2 rounded-lg bg-neutral-800 border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </label>
          </Section>

          <Section title="Contact Information">
            <label className="block">
              <span className="text-sm text-neutral-400">Address</span>
              <input
                type="text"
                value={fields.address}
                onChange={(e) =>
                  setFields({ ...fields, address: e.target.value })
                }
                className="w-full mt-1 px-4 py-2 rounded-lg bg-neutral-800 border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </label>

            <label className="block">
              <span className="text-sm text-neutral-400">City</span>
              <input
                type="text"
                value={fields.city}
                onChange={(e) =>
                  setFields({ ...fields, city: e.target.value })
                }
                className="w-full mt-1 px-4 py-2 rounded-lg bg-neutral-800 border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </label>

            <label className="block">
              <span className="text-sm text-neutral-400">State</span>
              <input
                type="text"
                value={fields.state}
                onChange={(e) =>
                  setFields({ ...fields, state: e.target.value })
                }
                className="w-full mt-1 px-4 py-2 rounded-lg bg-neutral-800 border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </label>

            <label className="block">
              <span className="text-sm text-neutral-400">Contact Info</span>
              <input
                type="text"
                value={fields.contact_info}
                onChange={(e) =>
                  setFields({ ...fields, contact_info: e.target.value })
                }
                className="w-full mt-1 px-4 py-2 rounded-lg bg-neutral-800 border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </label>
          </Section>

          <Section title="Special Instructions">
            <textarea
              value={fields.special_instructions}
              onChange={(e) =>
                setFields({
                  ...fields,
                  special_instructions: e.target.value,
                })
              }
              className="w-full mt-1 px-4 py-2 rounded-lg bg-neutral-800 border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              rows={4}
            />
          </Section>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold shadow transition"
          >
            {saving ? "Saving…" : "Save Profile"}
          </button>
        </form>
      )}
    </>
  );
}
