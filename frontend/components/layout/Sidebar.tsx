'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  FilePlus, Files, User, Search, BookOpen, ShoppingCart,
  Package, FileBarChart, BarChart2, AlertTriangle, Wrench,
  Target, Database, BarChart, Activity, Users, Settings, Home,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const SECTIONS: { heading: string; items: NavItem[] }[] = [
  {
    heading: 'PROPOSALS',
    items: [
      { label: 'New Proposal',    href: '/proposals/new',   icon: <FilePlus size={13} /> },
      { label: 'My Proposals',    href: '/proposals?mine=1',icon: <User size={13} /> },
      { label: 'All Proposals',   href: '/proposals',       icon: <Files size={13} /> },
    ],
  },
  {
    heading: 'INTELLIGENCE',
    items: [
      { label: 'Precedent Search', href: '/precedents',       icon: <Search size={13} /> },
      { label: 'Policy & SOP',     href: '/policies',         icon: <BookOpen size={13} /> },
      { label: 'Procurement',      href: '/procurement',      icon: <ShoppingCart size={13} /> },
      { label: 'Equipment Library',href: '/procurement/gem',  icon: <Package size={13} /> },
    ],
  },
  {
    heading: 'ANALYSIS',
    items: [
      { label: 'Decision Briefs',  href: '/decisions',      icon: <FileBarChart size={13} /> },
      { label: 'Cost Analysis',    href: '/cost-analysis',  icon: <BarChart2 size={13} /> },
      { label: 'Risk & Compliance',href: '/precedents',     icon: <AlertTriangle size={13} /> },
    ],
  },
  {
    heading: 'IMPLEMENTATION',
    items: [
      { label: 'Implementation Tracking', href: '/implementation', icon: <Wrench size={13} /> },
      { label: 'Outcomes & Lessons',      href: '/outcomes',        icon: <Target size={13} /> },
    ],
  },
  {
    heading: 'KNOWLEDGE',
    items: [
      { label: 'Knowledge Base',    href: '/memory',   icon: <Database size={13} /> },
      { label: 'Reports & Analytics',href: '/reports',  icon: <BarChart size={13} /> },
    ],
  },
  {
    heading: 'ADMINISTRATION',
    items: [
      { label: 'Audit Logs',      href: '/audit',           icon: <Activity size={13} /> },
      { label: 'User Management', href: '/administration',  icon: <Users size={13} /> },
      { label: 'Settings',        href: '/administration',  icon: <Settings size={13} /> },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/proposals'
      ? pathname === '/proposals' || (pathname.startsWith('/proposals/') && !pathname.includes('/new'))
      : pathname === href || pathname.startsWith(href + '/') || pathname.startsWith(href + '?');

  return (
    <aside className="sidebar" aria-label="Sidebar navigation">
      {SECTIONS.map(sec => (
        <div key={sec.heading}>
          <div className="sidebar-section-label">{sec.heading}</div>
          {sec.items.map(item => (
            <Link
              key={item.href + item.label}
              href={item.href}
              className={`sidebar-item${isActive(item.href) ? ' active' : ''}`}
              aria-current={isActive(item.href) ? 'page' : undefined}
            >
              <span style={{ color: isActive(item.href) ? 'var(--gov-navy)' : 'var(--gov-muted)', flexShrink: 0 }}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}
          <div className="sidebar-divider" />
        </div>
      ))}

      {/* Crest at bottom */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 14px 4px', gap: 6 }}>
        <Image src="/prism-logo-icon.png" alt="Puducherry Police" width={44} height={44}
          style={{ borderRadius: '50%', border: '1px solid var(--gov-border)', opacity: 0.65 }} />
        <div style={{ fontSize: '0.6rem', color: 'var(--gov-muted)', textAlign: 'center', lineHeight: 1.4 }}>
          PUDUCHERRY<br/>THE PEARL OF THE EAST
        </div>
      </div>
    </aside>
  );
}
