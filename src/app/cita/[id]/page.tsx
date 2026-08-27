'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import AppointmentTracker from '@/components/client/AppointmentTracker';

export default function CitaSeguimientoPage() {
  const params = useParams();
  const citaId = Array.isArray(params.id) ? params.id[0] : (params.id as string) || '';

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F0]">
      <Navbar />
      <main className="flex-1 py-8">
        <AppointmentTracker citaId={citaId} />
      </main>
    </div>
  );
}
