'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import RoleGuard from '@/components/RoleGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DynamicVisitsView from '@/components/visitas/DynamicVisitsView';

export default function VisitasPage() {
  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={['SUPER_ADMIN', 'COMMUNITY_ADMIN', 'RESIDENT']}>
        <DashboardLayout>
          <DynamicVisitsView />
        </DashboardLayout>
      </RoleGuard>
    </ProtectedRoute>
  );
}
