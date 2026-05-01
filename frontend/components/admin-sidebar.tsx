"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems: Array<{ href: string; label: string }> = [
  { href: "/admin/users", label: "User Management" },
  { href: "/admin/finance", label: "Finance" },
  { href: "/admin/history", label: "Global History" },
  { href: "/admin", label: "Knowledge Sync" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900 text-slate-200 flex flex-col flex-shrink-0">
      <div className="border-b border-slate-800 p-5">
        <h1 className="text-lg font-bold text-white">Platform Admin</h1>
        <p className="mt-1 text-xs text-slate-400">Isolated Admin Workspace</p>
      </div>

      <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
