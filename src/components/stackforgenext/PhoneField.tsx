"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import type { Market } from "@/lib/market";
import {
  DEFAULT_PHONE_COUNTRY_ISO,
  findPhoneCountry,
  formatFullPhone,
  PHONE_COUNTRIES,
  type PhoneCountry,
} from "@/lib/stackforgenext/phone-countries";

const RW_DIAL = "+250";

type PhoneFieldProps = {
  market: Market;
  id: string;
  label: string;
  labelClassName: string;
  placeholder: string;
  required?: boolean;
  onChange: (fullPhone: string, countryName: string) => void;
};

export function PhoneField({
  market,
  id,
  label,
  labelClassName,
  placeholder,
  required,
  onChange,
}: PhoneFieldProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState<PhoneCountry>(() =>
    findPhoneCountry(market === "rw" ? "RW" : DEFAULT_PHONE_COUNTRY_ISO),
  );
  const [national, setNational] = useState("");

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PHONE_COUNTRIES;
    return PHONE_COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dial.includes(q) ||
        c.iso.toLowerCase().includes(q),
    );
  }, [query]);

  const emit = (nextCountry: PhoneCountry, nextNational: string) => {
    const dial = market === "rw" ? RW_DIAL : nextCountry.dial;
    onChange(formatFullPhone(dial, nextNational), market === "rw" ? "Rwanda" : nextCountry.name);
  };

  const selectCountry = (next: PhoneCountry) => {
    setCountry(next);
    setOpen(false);
    setQuery("");
    emit(next, national);
  };

  const onNationalChange = (raw: string) => {
    const cleaned = raw.replace(/[^\d\s]/g, "");
    setNational(cleaned);
    emit(country, cleaned);
  };

  if (market === "rw") {
    return (
      <div>
        <label className={labelClassName} htmlFor={id}>
          {label}
        </label>
        <div className="flex overflow-hidden rounded-lg border border-border bg-background focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20">
          <span
            className="inline-flex shrink-0 items-center gap-1.5 border-r border-border bg-secondary/60 px-3 text-sm font-semibold text-foreground"
            aria-hidden
          >
            <span className="text-base leading-none">🇷🇼</span>
            {RW_DIAL}
          </span>
          <input
            id={id}
            name="phoneNational"
            type="tel"
            inputMode="numeric"
            required={required}
            autoComplete="tel-national"
            className="w-full border-0 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground"
            placeholder={placeholder}
            value={national}
            onChange={(e) => onNationalChange(e.target.value)}
          />
        </div>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <label className={labelClassName} htmlFor={id}>
        {label}
      </label>
      <div className="flex overflow-hidden rounded-lg border border-border bg-background focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex shrink-0 items-center gap-1.5 border-r border-border bg-secondary/60 px-2.5 py-3 text-sm font-semibold transition-colors hover:bg-secondary"
        >
          <span className="text-base leading-none" aria-hidden>
            {country.flag}
          </span>
          <span className="tabular-nums">{country.dial}</span>
          <ChevronDown className={`size-3.5 text-muted-foreground transition ${open ? "rotate-180" : ""}`} />
        </button>
        <input
          id={id}
          name="phoneNational"
          type="tel"
          inputMode="numeric"
          required={required}
          autoComplete="tel-national"
          className="w-full border-0 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground"
          placeholder={placeholder}
          value={national}
          onChange={(e) => onNationalChange(e.target.value)}
        />
      </div>

      {open && (
        <div
          id={listId}
          role="listbox"
          aria-label="Country dial code"
          className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-border bg-background shadow-lift"
        >
          <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search country or code"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              autoFocus
            />
          </div>
          <ul className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-3 py-3 text-sm text-muted-foreground">No countries found</li>
            )}
            {filtered.map((c) => {
              const active = c.iso === country.iso;
              return (
                <li key={c.iso}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => selectCountry(c)}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors ${
                      active ? "bg-accent text-foreground" : "hover:bg-secondary"
                    }`}
                  >
                    <span className="text-base leading-none" aria-hidden>
                      {c.flag}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium">{c.name}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">{c.dial}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
