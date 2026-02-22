"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Menu, X } from "lucide-react";

type NavLink = { href: string; label: string };

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function Sidebar() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  if (!user) return null;

  let links: NavLink[] = [];
  if (user.role === "ADMIN") {
    links = [
      { href: "/admin/dashboard", label: "Dashboard" },
      { href: "/admin/users", label: "Users" },
      { href: "/admin/clients", label: "Clients" },
      { href: "/admin/services", label: "Services" },
      { href: "/admin/requests", label: "Requests" },
      { href: "/admin/projects", label: "Projects" },
      { href: "/admin/messages", label: "Messages" },
    ];
  } else if (user.role === "EMPLOYEE") {
    links = [
      { href: "/employee/projects", label: "Projects" },
      { href: "/employee/messages", label: "Messages" },
      { href: "/employee/profile", label: "Profile" },
    ];
  } else if (user.role === "CLIENT") {
    links = [
      { href: "/client/projects", label: "Projects" },
      { href: "/client/requests", label: "Requests" },
      { href: "/client/messages", label: "Messages" },
      { href: "/client/profile", label: "Profile" },
    ];
  }

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 p-4 md:hidden sticky top-0 z-20">
        <div className="font-bold text-sky-400">Pranay Solutions</div>
        <button onClick={toggleSidebar} className="text-slate-300 hover:text-white">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Content */}
      <aside
        className={classNames(
          "fixed inset-y-0 left-0 z-10 w-64 transform flex-col border-r border-slate-800 bg-slate-950/95 p-4 transition-transform duration-200 ease-in-out md:static md:flex md:w-64 md:translate-x-0",
          isOpen ? "translate-x-0 flex" : "-translate-x-full md:flex hidden"
        )}
      >
        <div className="mb-6 hidden md:block">
          <div className="text-xl font-bold text-sky-400 mb-4">Pranay Solutions</div>
        </div>
        <div className="mb-6">
          <div className="text-xs uppercase text-slate-500">Signed in as</div>
          <div className="text-sm font-semibold text-slate-100">{user.name}</div>
          <div className="text-xs text-slate-400">{user.role}</div>
        </div>
        <nav className="flex-1 space-y-1 text-sm overflow-y-auto">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className={classNames(
                "block rounded px-2 py-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors",
                pathname.startsWith(link.href) && "bg-slate-800 text-white font-medium"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <button
          onClick={logout}
          className="mt-4 w-full rounded border border-slate-700 px-2 py-2 text-xs text-slate-300 hover:bg-slate-800 transition-colors"
        >
          Log out
        </button>
      </aside>

      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0 bg-black/50 md:hidden"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
}

