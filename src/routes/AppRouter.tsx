import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { LandingPage } from '../pages/LandingPage';
import { OverviewPage } from '../pages/OverviewPage';
import { ActiveFundingPage } from '../pages/ActiveFundingPage';
import { ReceivableDetailPage } from '../pages/ReceivableDetailPage';
import { TransparencyLogPage } from '../pages/TransparencyLogPage';
import { VerificationPage } from '../pages/VerificationPage';
import { SettingsPage } from '../pages/SettingsPage';
import { ApiDocsPage } from '../pages/ApiDocsPage';
import { CascadeRiskPage } from '../pages/CascadeRiskPage';
import { LiquidityPage } from '../pages/LiquidityPage';
import { ProtocolsPage } from '../pages/ProtocolsPage';
import { SubmitReceivablePage } from '../pages/SubmitReceivablePage';

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* 1. Public Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* 2-8. Main App Control Panel with Sidebar Layout */}
      <Route element={<Layout />}>
        <Route path="dashboard" element={<OverviewPage />} />
        <Route path="overview" element={<Navigate to="/dashboard" replace />} />
        <Route path="funding" element={<ActiveFundingPage />} />
        <Route path="submit-receivable" element={<SubmitReceivablePage />} />
        <Route path="receivable/new" element={<SubmitReceivablePage />} />
        <Route path="receivable" element={<ReceivableDetailPage />} />
        <Route path="receivable/:id" element={<ReceivableDetailPage />} />
        <Route path="history" element={<TransparencyLogPage />} />
        <Route path="verification" element={<VerificationPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="cascade-risk" element={<CascadeRiskPage />} />
        <Route path="liquidity" element={<LiquidityPage />} />
        <Route path="protocols" element={<ProtocolsPage />} />
        <Route path="api-docs" element={<ApiDocsPage />} />
      </Route>

      {/* Fallback Catch-all Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
