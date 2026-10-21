"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Check, ChevronDown } from "lucide-react";
import { useStackForgeNextContent } from "@/lib/stackforgenext/use-content";

const inputClass =
  "w-full rounded-lg border border-white/12 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-primary-bright/60 focus:bg-white/8 focus:ring-2 focus:ring-primary/30";
const selectClass =
  "w-full appearance-none rounded-lg border border-white/12 bg-white/5 py-3 pl-4 pr-11 text-sm text-white outline-none transition focus:border-primary-bright/60 focus:bg-white/8 focus:ring-2 focus:ring-primary/30";
const labelClass = "eyebrow mb-2 block text-white/55";

export function PartnerForm() {
  const c = useStackForgeNextContent().form;
  const [selected, setSelected] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const toggle = (item: string) =>
    setSelected((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item],
    );

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (selected.length === 0) {
      setStatus("error");
      setErrorMsg(c.capacityError);
      return;
    }

    const form = e.currentTarget;
    const data = new FormData(form);

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/partner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org: String(data.get("org") ?? "").trim(),
          name: String(data.get("name") ?? "").trim(),
          email: String(data.get("email") ?? "").trim(),
          phone: String(data.get("phone") ?? "").trim(),
          timeline: String(data.get("timeline") ?? "").trim(),
          message: String(data.get("message") ?? "").trim(),
          capacities: selected,
        }),
      });

      const payload = (await res.json()) as { error?: string };

      if (!res.ok) {
        setStatus("error");
        setErrorMsg(payload.error || c.errors.generic);
        return;
      }

      form.reset();
      setSelected([]);
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMsg(c.errors.network);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm sm:p-8"
    >
      <h3 className="text-2xl font-bold text-white">{c.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-white/60">{c.subtitle}</p>

      {status === "success" && (
        <p className="mt-4 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary-bright">
          {c.success}
        </p>
      )}
      {status === "error" && errorMsg && (
        <p className="mt-4 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm font-semibold text-red-200">
          {errorMsg}
        </p>
      )}

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="org">
            {c.org}
          </label>
          <input id="org" name="org" required className={inputClass} placeholder={c.orgPlaceholder} />
        </div>

        <div>
          <label className={labelClass} htmlFor="name">
            {c.name}
          </label>
          <input id="name" name="name" required className={inputClass} placeholder={c.namePlaceholder} />
        </div>

        <div>
          <label className={labelClass} htmlFor="email">
            {c.email}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className={inputClass}
            placeholder={c.emailPlaceholder}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="phone">
            {c.phone}
          </label>
          <input id="phone" name="phone" required className={inputClass} placeholder={c.phonePlaceholder} />
        </div>

        <div>
          <label className={labelClass} htmlFor="timeline">
            {c.timeline}
          </label>
          <div className="relative">
            <select id="timeline" name="timeline" defaultValue="" className={selectClass}>
              <option value="" disabled className="bg-ink">
                {c.timelinePlaceholder}
              </option>
              {c.timelineOptions.map((t) => (
                <option key={t} value={t} className="bg-ink">
                  {t}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-white/55"
              aria-hidden
            />
          </div>
        </div>

        <div className="sm:col-span-2">
          <span className={labelClass}>{c.capacitiesLabel}</span>
          <div className="grid gap-2 sm:grid-cols-2">
            {c.capacities.map((cap) => {
              const active = selected.includes(cap);
              return (
                <button
                  type="button"
                  key={cap}
                  onClick={() => toggle(cap)}
                  aria-pressed={active}
                  className={`flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-left text-sm transition ${
                    active
                      ? "border-primary-bright/60 bg-primary/15 text-white"
                      : "border-white/10 bg-white/[0.03] text-white/60 hover:border-white/25 hover:text-white/85"
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      active ? "border-primary-bright bg-primary-bright" : "border-white/25"
                    }`}
                  >
                    {active && <Check className="h-3 w-3 text-ink" strokeWidth={3} />}
                  </span>
                  {cap}
                </button>
              );
            })}
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="message">
            {c.message}
          </label>
          <textarea
            id="message"
            name="message"
            rows={4}
            className={`${inputClass} resize-none`}
            placeholder={c.messagePlaceholder}
          />
        </div>

        <label className="flex items-start gap-3 text-xs leading-relaxed text-white/50 sm:col-span-2">
          <input
            type="checkbox"
            required
            name="consent"
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/25 bg-white/5 accent-[oklch(62%_0.22_145)]"
          />
          {c.consent}
        </label>
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary-bright px-6 py-3.5 text-sm font-bold text-ink transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" ? c.submitting : c.submit}
        <ArrowRight className="h-4 w-4" />
      </button>
      <p className="mt-3 text-center text-xs text-white/40">{c.footerNote}</p>
    </form>
  );
}
