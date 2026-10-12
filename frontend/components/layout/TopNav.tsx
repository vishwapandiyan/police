'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, FileText, Search, ShoppingCart, BookOpen,
  CheckSquare, Wrench, BarChart2, Settings
} from 'lucide-react';

const ITEMS = [
  { label: 'Home',          href: '/dashboard',       icon: <Home size={14} /> },
  { label: 'Proposals',     href: '/proposals',       icon: <FileText size={14} /> },
  { label: 'Precedents',    href: '/precedents',      icon: <Search size={14} /> },
  { label: 'Procurement',   href: '/procurement',     icon: <ShoppingCart size={14} /> },
  { label: 'Proc. Workflow',href: '/procurement/workflow', icon: <ShoppingCart size={14} /> },
  { label: 'Policies & SOP',href: '/policies',        icon: <BookOpen size={14} /> },
  { label: 'Decisions',     href: '/decisions',       icon: <CheckSquare size={14} /> },
  { label: 'Implementation',href: '/implementation',  icon: <Wrench size={14} /> },
  { label: 'Reports',       href: '/reports',         icon: <BarChart2 size={14} /> },
  { label: 'Administration',href: '/administration',  icon: <Settings size={14} /> },
];

export default function TopNav() {
  const pathname = usePathname();
  return (
    <nav className="top-nav" aria-label="Primary navigation" role="navigation">
      {ITEMS.map(item => {
        const active = item.href === '/dashboard'
          ? pathname === '/dashboard'
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`top-nav-item${active ? ' active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            {item.icon}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
