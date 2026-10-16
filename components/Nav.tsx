"use client";

import { useEffect, useState } from "react";

const LINKS = [
  { href: "#design", label: "Design" },
  { href: "#health", label: "Health" },
  { href: "#finish", label: "Finish" },
  { href: "#specs", label: "Specs" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false); // mobile menu

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 border-b backdrop-blur-md transition-colors duration-300 ${
        scrolled || open ? "border-line bg-bg/80" : "border-transparent bg-bg/50"
      }`}
    >
      <div className="flex items-center justify-between px-[22px] py-[18px] desktop:px-8">
        <a href="#hero" className="text-[15px] font-bold tracking-[0.35em]">
          ECL<span className="text-accent">I</span>PSE
        </a>

        <ul className="hidden gap-7 desktop:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="text-[13px] tracking-[0.08em] text-muted transition-colors hover:text-ink">
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <a href="#order" className="btn-outline hidden desktop:inline-block">
          Pre-order
        </a>

        <button
          className="text-[22px] desktop:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile menu: links close it when tapped */}
      {open && (
        <ul className="flex flex-col gap-1 border-t border-line px-[22px] pb-6 pt-3 desktop:hidden">
          {[...LINKS, { href: "#order", label: "Pre-order" }].map((l) => (
            <li key={l.href}>
              <a href={l.href} onClick={() => setOpen(false)} className="block py-3 text-lg text-ink">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
