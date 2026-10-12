'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  LayoutDashboard, FilePlus, FileText, Files, Search, BookOpen,
  ShoppingCart, ShoppingBag, FileBarChart, Activity, CheckSquare,
  Target, Archive, Users, Settings, ChevronDown, ChevronRight,
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  children?: NavItem[];
}

const NAV: NavItem[] = [
  { label: 'DASHBOARD', href: '/dashboard', icon: <LayoutDashboard size={15} /> },
  {
    label: 'PROPOSALS',
    icon: <FileText size={15} />,
    children: [
      { label: 'New Proposal', href: '/proposals/new', icon: <FilePlus size={13} /> },
      { label: 'All Proposals', href: '/proposals', icon: <Files size={13} /> },
    ],
  },
  {
    label: 'INTELLIGENCE',
    icon: <Search size={15} />,
    children: [
      { label: 'Precedent Search', href: '/precedents', icon: <Search size={13} /> },
      { label: 'Policy & SOP', href: '/policies', icon: <BookOpen size={13} /> },
      { label: 'GeM Intelligence', href: '/procurement/gem', icon: <ShoppingBag size={13} /> },
      { label: 'Procurement', href: '/procurement', icon: <ShoppingCart size={13} /> },
    ],
  },
  {
    label: 'DECISIONS',
    icon: <CheckSquare size={15} />,
    children: [
      { label: 'Decision Briefs', href: '/decisions', icon: <FileBarChart size={13} /> },
      { label: 'Cost Analysis', href: '/cost-analysis', icon: <Activity size={13} /> },
    ],
  },
  {
    label: 'IMPLEMENTATION',
    icon: <Target size={15} />,
    children: [
      { label: 'Tracking', href: '/implementation', icon: <CheckSquare size={13} /> },
      { label: 'Outcomes', href: '/outcomes', icon: <Target size={13} /> },
      { label: 'Institutional Memory', href: '/memory', icon: <Archive size={13} /> },
    ],
  },
  {
    label: 'ADMINISTRATION',
    icon: <Settings size={15} />,
    children: [
      { label: 'Reports', href: '/reports', icon: <FileBarChart size={13} /> },
      { label: 'Audit Logs', href: '/audit', icon: <Activity size={13} /> },
      { label: 'Users', href: '/administration', icon: <Users size={13} /> },
    ],
  },
];

function NavSection({ item, depth = 0 }: { item: NavItem; depth?: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(
    () => item.children?.some((c) => pathname.startsWith(c.href || '')) ?? depth === 0
  );

  if (item.href) {
    const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
    return (
      <Link
        href={item.href}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: depth === 0 ? '8px 16px' : '5px 16px 5px 36px',
          textDecoration: 'none',
          color: active ? '#1a2744' : '#4b5563',
          background: active ? '#e8edf8' : 'transparent',
          borderLeft: active ? '3px solid #1a2744' : '3px solid transparent',
          fontSize: depth === 0 ? 12 : 12,
          fontWeight: active ? 600 : 400,
          borderRadius: '0 3px 3px 0',
          transition: 'background 0.1s',
        }}
      >
        {item.icon}
        {item.label}
      </Link>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          padding: '7px 16px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#374151',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.8px',
          textAlign: 'left',
          gap: 6,
        }}
      >
        {item.icon && <span style={{ color: '#6b7280' }}>{item.icon}</span>}
        <span style={{ flex: 1 }}>{item.label}</span>
        {open ? <ChevronDown size={11} color="#9ca3af" /> : <ChevronRight size={11} color="#9ca3af" />}
      </button>
      {open && item.children && (
        <div>
          {item.children.map((child) => (
            <NavSection key={child.href || child.label} item={child} depth={1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  return (
    <aside
      style={{
        width: 220,
        background: '#f8f9fa',
        borderRight: '1px solid #e5e7eb',
        overflowY: 'auto',
        flexShrink: 0,
        paddingTop: 8,
        paddingBottom: 24,
      }}
    >
      {NAV.map((item) => (
        <NavSection key={item.label} item={item} />
      ))}
      <div
        style={{
          margin: '16px',
          padding: '8px 10px',
          background: '#fef3c7',
          border: '1px solid #fde68a',
          borderRadius: 3,
          fontSize: 10,
          color: '#78350f',
          lineHeight: 1.4,
        }}
      >
        Synthetic demo data only. Not an official government system.
      </div>

      {/* Crest at the bottom of sidebar */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 16px 16px' }}>
        <Image
          src="/prism-logo-icon.png"
          alt="Puducherry Police PRISM-PY"
          width={52}
          height={52}
          style={{ borderRadius: '50%', border: '2px solid #e5e7eb', opacity: 0.7 }}
        />
      </div>
    </aside>
  );
}
