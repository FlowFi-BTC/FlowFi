import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { LandingPage } from '../pages/LandingPage';
import { GetStartedPage } from '../pages/GetStartedPage';
import { OnboardingPage } from '../pages/OnboardingPage';
import { OverviewPage } from '../pages/OverviewPage';
import { InvestorDashboardPage } from '../pages/InvestorDashboardPage';
import { InvestorFundingsPage } from '../pages/InvestorFundingsPage';
import { FundingDetailPage } from '../pages/FundingDetailPage';
import { BusinessReceivablesPage } from '../pages/BusinessReceivablesPage';
import { BusinessFundingPage } from '../pages/BusinessFundingPage';
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
import { MyFundings } from '@/pages/MyFundings';
import { AdminPage } from '../pages/AdminPage';

/**
 * Site map (ui-workflow/PAGES_SPEC.md):
 *  /                            Landing
 *  /receivable                   Public Marketplace explorer (#21)
 *  /receivable/:id               Receivable Detail, wallet-aware (#13 + #19 + #20)
 *  /dashboard                    Business overview (#39) — OverviewPage is role-aware
 *  /dashboard/receivables        #12 my receivables (DRAFT shown, marketplace never shows)
 *  /dashboard/submit             Submit flow (#11 then #18, register later #16/#17)
 *  /dashboard/funding            Business active fundings + repay (#35/#36)
 *  /dashboard/settings           GET/PATCH /businesses/me (#7/#8)
 *  /investor                     Investor overview (#40)
 *  /investor/fundings            #31 portfolio
 *  /investor/fundings/:id        #32 + #37 tracking (read-only)
 *  /onboarding                   #4 + #5 role select
 *  /admin                        Release (#33/#34) + default (#15), admin surface only
 * Legacy aliases (/marketplace, /funding, /my-fundings, /receivables/:id…) are kept
 * as redirects so existing links never break.
 */
export const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* 1. Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/get-started" element={<GetStartedPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/marketplace" element={<Marketplace />} />
      <Route path="/receivable" element={<Marketplace />} />
      <Route path="/receivables/:id" element={<ReceivableDetailPage />} />
      <Route path="/receivable/:id" element={<ReceivableDetailPage />} />
      <Route path="/business-verification" element={<BusinessVerificationPage />} />

      {/* 2. App shell (sidebar). Per-page RequireRole gates handle auth gracefully. */}
      <Route element={<Layout />}>
        {/* Overviews */}
        <Route path="dashboard" element={<OverviewPage />} />
        <Route path="overview" element={<Navigate to="/dashboard" replace />} />
        <Route path="investor" element={<InvestorDashboardPage />} />

        {/* Business workspace */}
        <Route path="dashboard/receivables" element={<BusinessReceivablesPage />} />
        <Route path="dashboard/submit" element={<SubmitReceivablePage />} />
        <Route path="dashboard/funding" element={<BusinessFundingPage />} />
        <Route path="dashboard/settings" element={<SettingsPage />} />

        {/* Investor workspace */}
        <Route path="investor/fundings" element={<InvestorFundingsPage />} />
        <Route path="investor/fundings/:id" element={<FundingDetailPage />} />

        {/* Legacy aliases — never break existing links/styling */}
        <Route path="funding" element={<ActiveFundingPage />} />
        <Route path="my-fundings" element={<MyFundings />} />
        <Route path="receivables" element={<Marketplace />} />
        <Route path="submit-receivable" element={<SubmitReceivablePage />} />
        <Route path="receivable/new" element={<SubmitReceivablePage />} />
        <Route path="/receivable" element={<ReceivablesListPage />} />
        <Route path="history" element={<TransparencyLogPage />} />
        <Route path="verification" element={<VerificationPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="api-docs" element={<ApiDocsPage />} />
        <Route path="admin" element={<AdminPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
