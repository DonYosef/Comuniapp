'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import RoleGuard from '@/components/RoleGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DynamicParcelsView from '@/components/encomiendas/DynamicParcelsView';

export default function EncomiendasPage() {
  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={['SUPER_ADMIN', 'COMMUNITY_ADMIN', 'RESIDENT']}>
        <DashboardLayout>
          <DynamicParcelsView />
        </DashboardLayout>
      </RoleGuard>
    </ProtectedRoute>
  );
}
