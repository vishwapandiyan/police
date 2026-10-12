'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/ui/PageHeader';
import GovCard from '@/components/ui/GovCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import SyntheticBanner from '@/components/ui/SyntheticBanner';
import { auth as authApi } from '@/lib/api';
import type { User } from '@/lib/types';
import { useAuth } from '@/lib/auth';

const ROLE_COLORS: Record<string, string> = {
  ADMIN: '#c0392b', APPROVING_AUTHORITY: '#7e22ce', REVIEWER: '#1F5A92',
  INITIATOR: '#1a7a3c', PROCUREMENT_OFFICER: '#0B5D5E', IMPLEMENTATION_OFFICER: '#d97706', AUDITOR: '#5F6B7A',
};

export default function AdministrationPage() {
  const { hasPermission } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (hasPermission('admin:manage_users')) {
      authApi.users().then(r => setUsers(r.users)).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [hasPermission]);

  return (
    <AppLayout>
      <div className="gov-page">
        <SyntheticBanner />
        <PageHeader
          title="Administration"
          subtitle="User management, roles, and system settings"
          breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Administration' }]}
        />
        {!hasPermission('admin:manage_users') ? (
          <div style={{ padding: '16px 18px', background: 'var(--gov-danger-bg)', border: '1px solid #f5c6c2', borderLeft: '3px solid var(--gov-danger)', borderRadius: '0 var(--r-md) var(--r-md) 0', fontSize: '0.85rem', color: 'var(--gov-danger)' }}>
            You do not have permission to access user administration. Required role: ADMIN.
          </div>
        ) : (
          <>
            {loading && <LoadingSpinner />}
            <GovCard title={`User Management — ${users.length} accounts`} noPadding>
              <table className="gov-table">
                <thead>
                  <tr><th>Username</th><th>Display Name</th><th>Role</th><th>Department</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{u.username}</td>
                      <td style={{ fontSize: '0.82rem', fontWeight: 500 }}>{u.display_name}</td>
                      <td>
                        <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 'var(--r-sm)', background: `${ROLE_COLORS[u.role] || '#374151'}18`, color: ROLE_COLORS[u.role] || '#374151', fontWeight: 700 }}>
                          {u.role?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--gov-text-sec)' }}>{u.department || '—'}</td>
                      <td><span className="badge badge-approved" style={{ fontSize: '0.62rem' }}>Active</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </GovCard>
            <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--gov-warning-bg)', border: '1px solid #f0d060', borderRadius: 'var(--r-md)', fontSize: '0.78rem', color: '#7a5500' }}>
              All user accounts shown are synthetic demo accounts. In a production deployment, user management is connected to the departmental identity provider.
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
