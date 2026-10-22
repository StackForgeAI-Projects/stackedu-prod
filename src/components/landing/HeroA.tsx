"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Check, Play, Star, Volume2, VolumeX, X } from "lucide-react";
import { FragmentCard } from "@/components/ui/FragmentCard";
import { HERO_IMAGE, STUDENT_AVATARS } from "@/lib/assets";
import { getHeroVideoUrl } from "@/lib/cloudinary";
import { useLocale } from "@/lib/i18n";
import { scrollToContact } from "@/lib/scroll";

export function HeroA() {
  const { t, locale, market } = useLocale();
  const heroVideoUrl = useMemo(() => getHeroVideoUrl(locale), [locale]);
  const stageRef = useRef<HTMLDivElement>(null);
  const playBtnRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const modalVideoRef = useRef<HTMLVideoElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [muted, setMuted] = useState(false);

  const openModal = useCallback(() => {
    if (!heroVideoUrl) return;
    setMuted(false);
    setModalOpen(true);
  }, [heroVideoUrl]);

  const closeModal = useCallback(() => {
    const video = modalVideoRef.current;
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
    setModalOpen(false);
  }, []);

  useEffect(() => {
    const video = modalVideoRef.current;
    if (!modalOpen || !video || !heroVideoUrl) return;
    if (video.getAttribute("src") !== heroVideoUrl) {
      video.src = heroVideoUrl;
    }
    video.muted = false;
    video.load();
    void video.play().catch(() => {});
  }, [modalOpen, heroVideoUrl]);

  useEffect(() => {
    if (!modalOpen) return;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [modalOpen, closeModal]);

  useEffect(() => {
    const root = stageRef.current;
    if (!root) return;
    let revert: (() => void) | undefined;
    let cancelled = false;

    const start = () => {
      void import("gsap").then(({ default: gsap }) => {
        if (cancelled || !stageRef.current) return;
        const ctx = gsap.context(() => {
          gsap.from(".hero-text > :not(h1)", {
            y: 24,
            opacity: 0,
            stagger: 0.08,
            duration: 0.9,
            ease: "power3.out",
          });
          const tl = gsap.timeline({ delay: 0.1 });
          tl.from(".fragment", {
            opacity: 0,
            x: (i) => [-160, 180, -120, 200, -80][i] ?? 0,
            y: (i) => [-120, 100, 180, -80, 160][i] ?? 0,
            rotate: (i) => [-14, 12, -8, 10, -6][i] ?? 0,
            scale: 0.85,
            duration: 0.9,
            ease: "power3.out",
            stagger: 0.08,
          })
            .from(".hero-frame", { scale: 0.96, duration: 0.4, ease: "power2.out" }, "-=0.3")
            .from(".play-btn", { opacity: 0, scale: 0.7, duration: 0.45, ease: "back.out(2.2)" }, "-=0.2");
        }, stageRef);
        revert = () => ctx.revert();
      });
    };

    const idleId = window.requestIdleCallback?.(start, { timeout: 1500 });
    const timerId = idleId === undefined ? window.setTimeout(start, 400) : undefined;
    return () => {
      cancelled = true;
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
      if (timerId !== undefined) window.clearTimeout(timerId);
      revert?.();
    };
  }, []);

  useEffect(() => {
    if (!modalOpen) return;
    let revert: (() => void) | undefined;
    let cancelled = false;
    void import("gsap").then(({ default: gsap }) => {
      if (cancelled) return;
      const ctx = gsap.context(() => {
        gsap.fromTo(
          ".hero-video-backdrop",
          { opacity: 0 },
          { opacity: 1, duration: 0.35, ease: "power2.out" },
        );
        gsap.fromTo(
          ".hero-video-dialog",
          { opacity: 0, scale: 0.9, y: 24 },
          { opacity: 1, scale: 1, y: 0, duration: 0.45, ease: "power3.out" },
        );
      }, modalRef);
      revert = () => ctx.revert();
      requestAnimationFrame(() => {
        modalVideoRef.current?.play().catch(() => {});
      });
    });
    return () => {
      cancelled = true;
      revert?.();
    };
  }, [modalOpen]);

  const toggleMute = () => {
    setMuted((prev) => {
      const next = !prev;
      if (modalVideoRef.current) modalVideoRef.current.muted = next;
      return next;
    });
  };

  return (
    <section
      ref={stageRef}
      id="product"
      className="relative overflow-x-clip pt-16 pb-28 md:pt-24 md:pb-36"
    >
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/8 blur-3xl" />
      <div className="pointer-events-none absolute top-40 right-0 h-96 w-96 rounded-full bg-primary-bright/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-full dotted-pattern opacity-40" />

      <div className="relative mx-auto max-w-7xl px-6 grid lg:grid-cols-[1fr_1.2fr] gap-10 lg:gap-14 items-center">
        <div className="hero-text flex flex-col justify-center">
          <h1 className="text-[2.75rem] leading-[1.05] sm:text-6xl lg:text-[4.5rem] font-extrabold tracking-tight text-ink">
            {t.hero.titleBefore}
            {locale === "rw" ? (
              <span className="bg-primary-bright/40 box-decoration-clone">{t.hero.titleHighlight}</span>
            ) : (
              <span className="relative inline-block">
                <span className="relative z-10">{t.hero.titleHighlight}</span>
                <span className="absolute inset-x-0 bottom-1 h-3 bg-primary-bright/40 -z-0" />
              </span>
            )}
            {t.hero.titleAfter}
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground leading-relaxed">
            {t.hero.subtitle}
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={scrollToContact}
              className="group inline-flex items-center gap-2 bg-ink text-white px-7 py-4 rounded-full font-bold hover:bg-primary transition-colors shadow-lift"
            >
              {t.nav.bookDemo}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button
              type="button"
              onClick={openModal}
              className="inline-flex items-center gap-3 bg-white border border-border px-6 py-4 rounded-full font-bold hover:bg-secondary transition-colors"
            >
              <span className="grid place-items-center size-7 rounded-full bg-primary/10 text-primary">
                <Play className="size-3.5 fill-primary" />
              </span>
              {t.hero.watchHow}
            </button>
          </div>

          <div className="mt-10 flex items-center gap-4">
            <div className="flex -space-x-3">
              {STUDENT_AVATARS.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={src}
                  alt="Student"
                  width={88}
                  height={88}
                  decoding="async"
                  fetchPriority="low"
                  className="size-11 rounded-full object-cover border-2 border-white shadow-soft"
                />
              ))}
            </div>
            <div>
              <div className="flex items-center gap-1 text-primary">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-3.5 fill-primary" />
                ))}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                <b className="text-ink">12,000+</b> {t.hero.studentsOnboard}
              </div>
            </div>
          </div>
        </div>

        <div className="relative w-full shrink-0 h-[360px] sm:h-[400px] lg:h-[480px]">
          <div className="hero-frame absolute inset-0 rounded-[28px] border border-border shadow-lift overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={HERO_IMAGE}
              alt={
                market === "rw"
                  ? "Rwandan university student using StackEDU"
                  : "African university student using StackEDU"
              }
              width={1600}
              height={2400}
              decoding="async"
              fetchPriority="high"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-ink/60 via-ink/10 to-transparent" />
          </div>

          <FragmentCard
            className="fragment absolute -top-3 -left-3 sm:-top-10 sm:-left-10 w-[7.5rem] sm:w-48 md:w-56"
            label="/GRADE_CARD"
          >
            <div className="flex items-center justify-between gap-1">
              <div className="min-w-0">
                <div className="text-[8px] sm:text-[10px] text-muted-foreground truncate">MATH 302</div>
                <div className="font-bold text-xs sm:text-lg text-ink truncate">Advanced Calculus</div>
              </div>
              <span className="grid place-items-center size-7 sm:size-10 shrink-0 rounded-lg sm:rounded-xl bg-primary text-white text-xs sm:text-base font-bold">
                A+
              </span>
            </div>
          </FragmentCard>

          <FragmentCard
            className="fragment absolute top-1 -right-3 sm:top-4 sm:-right-12 w-[8rem] sm:w-52 md:w-60"
            label="/MOMO_CONFIRMED"
            tone="dark"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="grid place-items-center size-7 sm:size-9 shrink-0 rounded-full bg-primary text-white">
                <Check className="size-3 sm:size-4" strokeWidth={3} />
              </div>
              <div className="min-w-0">
                <div className="text-[8px] sm:text-[10px] text-white/60 truncate">
                  {market === "rw" ? "MTN MoMo · Tuition" : "Mobile Money · Tuition"}
                </div>
                <div className="font-bold text-xs sm:text-base text-white">
                  {market === "rw" ? "750,000 RWF" : "$599 USD"}
                </div>
              </div>
            </div>
          </FragmentCard>

          <FragmentCard className="fragment absolute -bottom-5 left-1 sm:-bottom-10 sm:left-0 w-[7rem] sm:w-44 md:w-52" label="/STUDENT">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="size-7 sm:size-9 shrink-0 rounded-full bg-primary/15 grid place-items-center font-bold text-primary text-[10px] sm:text-xs">
                AM
              </div>
              <div className="min-w-0">
                <div className="font-bold text-ink text-[10px] sm:text-sm truncate">Alice Mukamana</div>
                <div className="text-[8px] sm:text-[10px] text-muted-foreground truncate">BSc CS · Year 3</div>
              </div>
            </div>
          </FragmentCard>

          <FragmentCard
            className="fragment absolute bottom-6 -right-3 sm:bottom-14 sm:-right-12 w-[6.5rem] sm:w-40 md:w-48"
            label="/ENROLLMENT"
          >
            <div className="flex items-end gap-0.5 sm:gap-1 h-8 sm:h-12">
              {[40, 55, 48, 70, 82, 95].map((h, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-t-sm ${i === 5 ? "bg-primary" : "bg-primary/20"}`}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <div className="mt-1 sm:mt-2 text-[8px] sm:text-[10px] text-muted-foreground leading-tight">{t.dashboard.enrollment}</div>
          </FragmentCard>

          <button
            ref={playBtnRef}
            type="button"
            onClick={openModal}
            className="play-btn absolute inset-0 m-auto size-[4.5rem] sm:size-24 rounded-full bg-white border-[5px] border-white/90 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.45)] grid place-items-center z-30 cursor-pointer"
            aria-label="Play demo video"
          >
            <Play className="size-8 sm:size-9 fill-ink text-ink ml-1 stroke-[3]" strokeWidth={3} />
          </button>
        </div>
      </div>

      {modalOpen && heroVideoUrl && (
        <div
          ref={modalRef}
          className="hero-video-modal fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10"
          role="dialog"
          aria-modal="true"
          aria-label="StackEDU demo video"
        >
          <button
            type="button"
            className="hero-video-backdrop absolute inset-0 bg-ink/55 backdrop-blur-md"
            onClick={closeModal}
            aria-label="Close video"
          />

          <div className="hero-video-dialog relative z-10 w-full max-w-5xl">
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/15 bg-ink shadow-2xl aspect-video">
              <video
                ref={modalVideoRef}
                src={heroVideoUrl}
                className="h-full w-full object-contain"
                muted={muted}
                playsInline
                preload="metadata"
              />

              <button
                type="button"
                onClick={closeModal}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 grid place-items-center size-9 sm:size-10 rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70 transition-colors"
                aria-label="Close video"
              >
                <X className="size-5" />
              </button>

              <button
                type="button"
                onClick={toggleMute}
                aria-label={muted ? "Unmute video" : "Mute video"}
                className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 inline-flex items-center gap-2 bg-white/95 text-ink text-[11px] sm:text-xs font-medium px-3 sm:px-4 py-2 rounded-full shadow-lift"
              >
                {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                {muted ? "Unmute" : "Mute"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
