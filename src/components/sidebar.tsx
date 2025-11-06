"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Sales", href: "/dashboard/sales" },
  { name: "Inventory", href: "/dashboard/inventory" },
  { name: "Gen Record", href: "/dashboard/gen-record" },
  { name: "Reports", href: "/dashboard/reports" },
 
 
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-48 bg-white border-r shadow-sm">
      <nav className="flex flex-col gap-1 p-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`p-2 rounded-md hover:bg-blue-50 ${
              pathname === link.href ? "bg-blue-100 text-blue-600" : "text-gray-700"
            }`}
          >
            {link.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
