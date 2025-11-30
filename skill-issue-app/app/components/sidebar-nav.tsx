"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/browse", label: "Browse" },
  { href: "/lineup", label: "Lineup" },
  { href: "/lineups", label: "Compare" },
];

type Orientation = "vertical" | "horizontal";

export function SidebarNav({ orientation = "vertical" }: { orientation?: Orientation }) {
  const pathname = usePathname();

  return (
    <nav
      className={
        orientation === "vertical"
          ? "flex flex-col gap-1"
          : "flex items-center gap-2 overflow-x-auto"
      }
      aria-label="Primary"
    >
      {links.map((link) => {
        const active =
          link.href === "/"
            ? pathname === "/"
            : pathname === link.href || pathname.startsWith(`${link.href}/`);

        const baseClasses =
          "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500";
        const activeClasses = "bg-emerald-600 text-white shadow-sm";
        const idleClasses = "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900";

        const classes =
          orientation === "vertical"
            ? `${baseClasses} ${active ? activeClasses : idleClasses}`
            : `${baseClasses} ${active ? "bg-emerald-600 text-white" : "bg-white/70 text-zinc-700 border border-zinc-200 hover:border-emerald-300 hover:text-emerald-700"}`;

        return (
          <Link key={link.href} href={link.href} className={classes}>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
