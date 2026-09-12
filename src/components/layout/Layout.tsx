import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useUser } from '@/context/UserContext';
import { ScaleLoader } from 'react-spinners';

export const Layout: React.FC = () => {
  const { isLoading, refreshUserSession } = useUser();

  // Restore session once on shell mount. Per-page <RequireRole> handles
  // unauthenticated / wrong-role states gracefully — the shell itself must
  // NOT force-navigate (the previous version bounced every non-default path
  // to /get-started and broke deep links).
  useEffect(() => {
    refreshUserSession().catch(() => null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col gap-2 items-center justify-center bg-[#f7f7f7] font-syne">
      <ScaleLoader className='h-10 w-10' color="#000000" speedMultiplier={0.9} /> 
      Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-black antialiased selection:bg-[#a8ff3e] selection:text-black font-syne">
      <Sidebar />

      <div className="lg:pl-64 flex flex-col min-h-screen">
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
