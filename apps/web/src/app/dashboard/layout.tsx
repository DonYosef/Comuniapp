'use client';

import { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />

      {/* Overlay para móvil */}
      {!isSidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Contenido principal */}
      <div
        className={`
        transition-all duration-300 ease-in-out
        ${isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}
      `}
      >
        {/* Topbar */}
        <Topbar onSidebarToggle={toggleSidebar} />

        {/* Contenido de la página */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
