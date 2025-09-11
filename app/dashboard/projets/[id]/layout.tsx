'use client';

import { use } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function ProjetLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const pathname = usePathname();

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Navigation projet */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '2rem',
        borderBottom: '1px solid #e2e8f0',
        paddingBottom: '1rem'
      }}>
        <Link
          href={`/dashboard/projets/${id}`}
          style={{
            padding: '0.5rem 1rem',
            textDecoration: 'none',
            color: pathname === `/dashboard/projets/${id}` ? '#3b82f6' : '#64748b',
            borderBottom: pathname === `/dashboard/projets/${id}` ? '2px solid #3b82f6' : '2px solid transparent',
            fontWeight: '500'
          }}
        >
          📋 Vue Générale
        </Link>
        
        <Link
          href={`/dashboard/projets/${id}/planning`}
          style={{
            padding: '0.5rem 1rem',
            textDecoration: 'none',
            color: pathname.includes('/planning') ? '#3b82f6' : '#64748b',
            borderBottom: pathname.includes('/planning') ? '2px solid #3b82f6' : '2px solid transparent',
            fontWeight: '500'
          }}
        >
          📅 Planning
        </Link>
      </div>

      {children}
    </div>
  );
}
