import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { LandingPage } from '../pages/LandingPage';
import { GetStartedPage } from '../pages/GetStartedPage';
import { OverviewPage } from '../pages/OverviewPage';
import { ActiveFundingPage } from '../pages/ActiveFundingPage';
import { ReceivableDetailPage } from '../pages/ReceivableDetailPage';
import { TransparencyLogPage } from '../pages/TransparencyLogPage';
import { VerificationPage } from '../pages/VerificationPage';
import { SettingsPage } from '../pages/SettingsPage';
import { ApiDocsPage } from '../pages/ApiDocsPage';
import { SubmitReceivablePage } from '../pages/SubmitReceivablePage';
import { Marketplace } from '../pages/Marketplace';
import { BusinessVerificationPage } from '@/pages/BusinessVerification';
import { ReceivablesListPage } from '@/pages/ReceivablesListPage';

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* 1. Public Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* 2. Onboarding Flow */}
      <Route path="/get-started" element={<GetStartedPage />} />
       <Route path="marketplace" element={<Marketplace />} />
          <Route path="business-verification" element={<BusinessVerificationPage/>} />
      {/* 3. Main App Control Panel with Sidebar Layout */}
      <Route element={<Layout />}>
        <Route path="dashboard" element={<OverviewPage />} />
        <Route path="overview" element={<Navigate to="/dashboard" replace />} />
        <Route path="funding" element={<ActiveFundingPage />} />
 
        <Route path="receivables" element={<Marketplace />} />
        <Route path="submit-receivable" element={<SubmitReceivablePage />} />
        <Route path="receivable/new" element={<SubmitReceivablePage />} />
   <Route path="/receivable" element={<ReceivablesListPage />} />
<Route path="/receivables/:id" element={<ReceivableDetailPage />} />
        <Route path="receivable/:id" element={<ReceivableDetailPage />} />
        <Route path="history" element={<TransparencyLogPage />} />
        <Route path="verification" element={<VerificationPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="api-docs" element={<ApiDocsPage />} />
      </Route>

      {/* Fallback Catch-all Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
