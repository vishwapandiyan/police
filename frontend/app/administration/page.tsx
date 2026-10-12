'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { auth as authApi } from '@/lib/api';
import type { User } from '@/lib/types';
import { useAuth } from '@/lib/auth';

export default function AdministrationPage() {
  const { hasPermission } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (hasPermission('admin:manage_users')) {
      authApi.users().then((r) => setUsers(r.users)).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [hasPermission]);

  const ROLE_COLORS: Record<string, string> = {
    ADMIN: '#dc2626', APPROVING_AUTHORITY: '#7e22ce', REVIEWER: '#1d4ed8',
    INITIATOR: '#16a34a', PROCUREMENT_OFFICER: '#0f766e', IMPLEMENTATION_OFFICER: '#d97706', AUDITOR: '#374151',
  };

  return (
    <AppLayout>
      <div style={{ padding: '16px 20px' }}>
        <h1 style={{ fontSize: 16, fontWeight: 700, color: '#1a2744', margin: '0 0 16px' }}>Administration</h1>
        {!hasPermission('admin:manage_users') ? (
          <div style={{ padding: 20, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 4, fontSize: 13, color: '#b91c1c' }}>
            You do not have permission to access user administration.
          </div>
        ) : (
          <>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: '#374151', margin: '0 0 12px' }}>Users ({users.length})</h2>
            {loading && <LoadingSpinner />}
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 4 }}>
              <table className="gov-table">
                <thead><tr><th>Username</th><th>Display Name</th><th>Role</th><th>Department</th><th>Status</th></tr></thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{u.username}</td>
                      <td style={{ fontSize: 12 }}>{u.display_name}</td>
                      <td>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 2, background: `${ROLE_COLORS[u.role] || '#374151'}15`, color: ROLE_COLORS[u.role] || '#374151', fontWeight: 600 }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ fontSize: 11, color: '#6b7280' }}>{u.department || '—'}</td>
                      <td>
                        <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 2, background: '#f0fdf4', color: '#15803d', fontWeight: 600 }}>
                          ACTIVE
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 16, padding: '10px 14px', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 3, fontSize: 12, color: '#78350f' }}>
              All users shown are synthetic demo accounts. In a production deployment, user management would be connected to the departmental identity provider.
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
