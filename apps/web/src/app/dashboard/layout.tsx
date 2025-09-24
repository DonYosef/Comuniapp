'use client';

import { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  const handleSidebarHoverChange = (isHovered: boolean) => {
    setIsSidebarHovered(isHovered);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar isCollapsed={isSidebarCollapsed} onHoverChange={handleSidebarHoverChange} />

      {/* Contenido principal */}
      <div
        className={`
        transition-all duration-300 ease-in-out
        ${isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}
      `}
      >
        {/* Topbar */}
        <Topbar isSidebarCollapsed={isSidebarCollapsed && !isSidebarHovered} />

        {/* Contenido de la página */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
