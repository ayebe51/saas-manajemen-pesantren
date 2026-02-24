import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function DashboardLayout() {
  return (
    <div className="flex h-screen bg-app overflow-hidden" style={{ backgroundColor: 'var(--bg-app)' }}>
      {/* Sidebar - Fixed di sisi kiri */}
      <Sidebar />

      {/* Main Content Area (Bergeser 64 Tailwind spaces / 256px ke kanan) */}
      <div className="flex-1 ml-64 flex flex-col min-w-0">
        <Header />
        
        {/* Konten Utama Dasbor yang berubah-ubah (Outlet) */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
