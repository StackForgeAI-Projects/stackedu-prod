"use client";

import { useEffect, useId, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { ArrowRight, Check, ChevronDown } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { RWANDA_DISTRICTS } from "@/lib/stackforgenext/rwanda-districts";
import { getRegisterContent } from "@/lib/stackforgenext/register-content";
import { PhoneField } from "./PhoneField";

const inputClass =
  "w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20";
/** Same right inset as the learning-track chevron (`px-4` + `size-4` icon). */
const selectClass =
  "w-full appearance-none rounded-lg border border-border bg-background py-3 pl-4 pr-11 text-sm text-foreground outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20";
const labelClass = "eyebrow mb-2 block text-muted-foreground";

function FieldSelect({
  id,
  name,
  required,
  defaultValue,
  value,
  onChange,
  children,
}: {
  id: string;
  name: string;
  required?: boolean;
  defaultValue?: string;
  value?: string;
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
  children: ReactNode;
}) {
  return (
    <div className="relative">
      <select
        id={id}
        name={name}
        required={required}
        className={selectClass}
        {...(value !== undefined ? { value, onChange } : { defaultValue })}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
    </div>
  );
}

export function RegisterForm() {
  const { locale, market } = useLocale();
  const c = useMemo(() => getRegisterContent(locale, market).form, [locale, market]);

  const [phone, setPhone] = useState("");
  const [phoneCountry, setPhoneCountry] = useState(market === "rw" ? "Rwanda" : "");
  const [tracks, setTracks] = useState<string[]>([]);
  const [tracksOpen, setTracksOpen] = useState(false);
  const tracksRef = useRef<HTMLDivElement>(null);
  const tracksListId = useId();
  const [isStudent, setIsStudent] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const studentYes = isStudent === c.yes;

  useEffect(() => {
    if (!tracksOpen) return;
    const onDoc = (event: MouseEvent) => {
      if (!tracksRef.current?.contains(event.target as Node)) setTracksOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setTracksOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [tracksOpen]);

  const toggleTrack = (item: string) =>
    setTracks((prev) => (prev.includes(item) ? prev.filter((t) => t !== item) : [...prev, item]));

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    const fullName = String(data.get("fullName") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const street = String(data.get("street") ?? "").trim();
    const district = String(data.get("district") ?? "").trim();
    const freeAddress = String(data.get("address") ?? "").trim();
    const availability = String(data.get("availability") ?? "").trim();
    const sex = String(data.get("sex") ?? "").trim();
    const institution = String(data.get("institution") ?? "").trim();
    const course = String(data.get("course") ?? "").trim();
    const level = String(data.get("level") ?? "").trim();
    const motivation = String(data.get("motivation") ?? "").trim();
    const joinCommunity = data.get("joinCommunity") === "on";

    const address =
      market === "rw"
        ? [street, district].filter(Boolean).join(", ")
        : freeAddress;

    if (
      !fullName ||
      !email ||
      !phone.replace(/\D/g, "") ||
      !address ||
      !availability ||
      !sex ||
      tracks.length === 0 ||
      !isStudent ||
      !motivation ||
      (market === "rw" && (!street || !district)) ||
      (studentYes && (!institution || !course || !level))
    ) {
      setStatus("error");
      setErrorMsg(c.errors.required);
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          address,
          country: market === "africa" ? phoneCountry : "Rwanda",
          availability,
          sex,
          tracks,
          isStudent,
          institution: studentYes ? institution : undefined,
          course: studentYes ? course : undefined,
          level: studentYes ? level : undefined,
          motivation,
          joinCommunity,
        }),
      });

      const payload = (await res.json()) as { error?: string };

      if (!res.ok) {
        setStatus("error");
        setErrorMsg(payload.error || c.errors.generic);
        return;
      }

      form.reset();
      setPhone("");
      setPhoneCountry(market === "rw" ? "Rwanda" : "");
      setTracks([]);
      setTracksOpen(false);
      setIsStudent("");
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMsg(c.errors.network);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[1.75rem] border border-border bg-background/95 p-6 shadow-soft backdrop-blur-sm sm:p-8 lg:p-10"
    >
      <p className="eyebrow text-primary">StackForgeNext</p>
      <h3 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">{c.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">{c.subtitle}</p>

      {status === "success" && (
        <p className="mt-4 rounded-lg border border-primary/25 bg-primary/8 px-4 py-3 text-sm font-semibold text-primary">
          {c.success}
        </p>
      )}
      {status === "error" && errorMsg && (
        <p className="mt-4 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm font-semibold text-red-700">
          {errorMsg}
        </p>
      )}

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="fullName">
            {c.fullName}
          </label>
          <input
            id="fullName"
            name="fullName"
            required
            autoComplete="name"
            className={inputClass}
            placeholder={c.fullNamePlaceholder}
          />
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
            autoComplete="email"
            className={inputClass}
            placeholder={c.emailPlaceholder}
          />
        </div>

        <PhoneField
          market={market}
          id="phone"
          label={c.phone}
          labelClassName={labelClass}
          placeholder={c.phonePlaceholder}
          required
          onChange={(full, countryName) => {
            setPhone(full);
            setPhoneCountry(countryName);
          }}
        />

        {market === "rw" ? (
          <>
            <div>
              <label className={labelClass} htmlFor="street">
                {c.street}
              </label>
              <input
                id="street"
                name="street"
                required
                className={inputClass}
                placeholder={c.streetPlaceholder}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="district">
                {c.district}
              </label>
              <FieldSelect id="district" name="district" required defaultValue="">
                <option value="" disabled>
                  {c.districtPlaceholder}
                </option>
                {RWANDA_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </FieldSelect>
            </div>
          </>
        ) : (
          <div>
            <label className={labelClass} htmlFor="address">
              {c.address}
            </label>
            <input
              id="address"
              name="address"
              required
              className={inputClass}
              placeholder={c.addressPlaceholder}
            />
          </div>
        )}

        <div>
          <label className={labelClass} htmlFor="availability">
            {c.availability}
          </label>
          <FieldSelect id="availability" name="availability" required defaultValue="">
            <option value="" disabled>
              {c.availabilityPlaceholder}
            </option>
            {c.availabilityOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </FieldSelect>
        </div>

        <div>
          <label className={labelClass} htmlFor="sex">
            {c.sex}
          </label>
          <FieldSelect id="sex" name="sex" required defaultValue="">
            <option value="" disabled>
              {c.sexPlaceholder}
            </option>
            {c.sexOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </FieldSelect>
        </div>

        <div ref={tracksRef} className="relative">
          <span className={labelClass} id="learning-track-label">
            {c.track}
          </span>
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={tracksOpen}
            aria-controls={tracksListId}
            aria-labelledby="learning-track-label"
            onClick={() => setTracksOpen((open) => !open)}
            className={`${inputClass} flex items-center justify-between gap-3 text-left`}
          >
            <span className={`min-w-0 truncate ${tracks.length === 0 ? "text-muted-foreground" : ""}`}>
              {tracks.length === 0 ? c.trackHint : tracks.join(", ")}
            </span>
            <ChevronDown
              className={`size-4 shrink-0 text-muted-foreground transition ${tracksOpen ? "rotate-180" : ""}`}
            />
          </button>
          {tracksOpen && (
            <ul
              id={tracksListId}
              role="listbox"
              aria-multiselectable="true"
              aria-labelledby="learning-track-label"
              className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-border bg-background py-1 shadow-lift"
            >
              {c.tracks.map((item) => {
                const active = tracks.includes(item);
                return (
                  <li key={item}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => toggleTrack(item)}
                      className={`flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-sm transition-colors ${
                        active ? "bg-accent text-foreground" : "hover:bg-secondary"
                      }`}
                    >
                      <span
                        className={`flex size-4 shrink-0 items-center justify-center rounded border ${
                          active ? "border-primary bg-primary text-white" : "border-border bg-background"
                        }`}
                        aria-hidden
                      >
                        {active && <Check className="size-3" strokeWidth={3} />}
                      </span>
                      {item}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div>
          <label className={labelClass} htmlFor="isStudent">
            {c.isStudent}
          </label>
          <FieldSelect
            id="isStudent"
            name="isStudent"
            required
            value={isStudent}
            onChange={(e) => setIsStudent(e.target.value)}
          >
            <option value="" disabled>
              {c.isStudentPlaceholder}
            </option>
            <option value={c.yes}>{c.yes}</option>
            <option value={c.no}>{c.no}</option>
          </FieldSelect>
        </div>

        {studentYes && (
          <>
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="institution">
                {c.institution}
              </label>
              <input
                id="institution"
                name="institution"
                required
                className={inputClass}
                placeholder={c.institutionPlaceholder}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="course">
                {c.course}
              </label>
              <input
                id="course"
                name="course"
                required
                className={inputClass}
                placeholder={c.coursePlaceholder}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="level">
                {c.level}
              </label>
              <input
                id="level"
                name="level"
                required
                className={inputClass}
                placeholder={c.levelPlaceholder}
              />
            </div>
          </>
        )}

        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="motivation">
            {c.motivation}
          </label>
          <textarea
            id="motivation"
            name="motivation"
            required
            rows={4}
            className={`${inputClass} resize-none`}
            placeholder={c.motivationPlaceholder}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-3 text-sm leading-snug text-muted-foreground">
            <input
              type="checkbox"
              name="joinCommunity"
              className="size-4 shrink-0 rounded border-border accent-[oklch(62%_0.22_145)]"
            />
            <span>{c.communityConsent}</span>
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" ? c.submitting : c.submit}
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}
