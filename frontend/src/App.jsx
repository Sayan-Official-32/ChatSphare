/**
 * @file App.jsx
 * @description Main React Router Declarative Layout Component.
 * 
 * Route Mappings:
 * - `/`                      → Public Product Landing Page (`LandingPage`).
 * - `/login` | `/signup`      → Firebase & BFF Authentication Page (`LoginPage`).
 * - `/app/brand-agent/new`   → 5-Step Brand Agent Creation Wizard (`BrandAgentWizard`).
 * - `*`                      → Wildcard redirect back to `/`.
 */

import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Route-based code splitting: load pages on demand to keep the initial bundle lightweight
const LandingPage = lazy(() => import('./features/landing/LandingPage'));
const BrandAgentWizard = lazy(() => import('./features/wizard/BrandAgentWizard'));
const BrandAgentsDashboard = lazy(() => import('./features/agents/BrandAgentsDashboard'));
const BrandAgentStudio = lazy(() => import('./features/studio/BrandAgentStudio'));
const LoginPage = lazy(() => import('./features/auth/LoginPage'));
const KnowledgeBasesDashboard = lazy(() => import('./features/knowledge/KnowledgeBasesDashboard'));
const EditKnowledgeBasePage = lazy(() => import('./features/knowledge/EditKnowledgeBasePage'));
const ComingSoonPage = lazy(() => import('./components/common/ComingSoonPage'));
const ConversationsPage = lazy(() => import('./features/conversations/ConversationsPage'));
const PricingPage = lazy(() => import('./features/pricing/PricingPage'));
const SubscriptionCheckoutPage = lazy(() => import('./features/pricing/SubscriptionCheckoutPage'));
const ProfilePage = lazy(() => import('./features/profile/ProfilePage'));
const FullscreenWidgetPage = lazy(() => import('./features/widget/FullscreenWidgetPage'));
const AppLayout = lazy(() => import('./components/common/AppLayout'));
import PageLoader from './components/common/PageLoader';


/**
 * Root App routing container component with code-splitting Suspense boundary.
 * 
 * @returns {JSX.Element} React Router Routes element.
 */
export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Landing / home (NO Sidebar) */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth routes (NO Sidebar) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<LoginPage />} />

        {/* External Public Fullscreen Embed Mode (NO Sidebar) */}
        <Route path="/fullscreen-widget/:agentId" element={<FullscreenWidgetPage />} />

        {/* Enterprise Authenticated Application Shell (Common Persistent Left Sidebar) */}
        <Route path="/app" element={<AppLayout />}>
          {/* Brand Agents Dashboard */}
          <Route path="agents" element={<BrandAgentsDashboard />} />
          <Route path="brand-agents" element={<BrandAgentsDashboard />} />

          {/* Knowledge Bases Dashboard & Dedicated Edit View */}
          <Route path="knowledge" element={<KnowledgeBasesDashboard />} />
          <Route path="knowledge-bases" element={<KnowledgeBasesDashboard />} />
          <Route path="knowledge-bases/edit/:kbId" element={<EditKnowledgeBasePage />} />
          <Route path="knowledge/edit/:kbId" element={<EditKnowledgeBasePage />} />

          {/* Brand Agent Studio (Edit, Test, Deploy spaces) */}
          <Route path="brand-agent/new" element={<BrandAgentWizard />} />
          <Route path="brand-agent/:agentId" element={<BrandAgentStudio />} />

          {/* Subscription & Pricing Page (Upgrade Space) */}
          <Route path="pricing" element={<PricingPage />} />
          <Route path="pricing/checkout" element={<SubscriptionCheckoutPage />} />

          {/* Conversations & Inbox */}
          <Route path="conversations" element={<ConversationsPage />} />

          {/* User Profile & Account Settings */}
          <Route path="profile" element={<ProfilePage />} />

          {/* Coming Soon Feature Routes */}
          <Route path="leads" element={<ComingSoonPage feature="leads" />} />
          <Route path="agent-spaces" element={<ComingSoonPage feature="agent-spaces" />} />
          <Route path="tools-skills" element={<ComingSoonPage feature="tools-skills" />} />
          <Route path="runs-schedules" element={<ComingSoonPage feature="runs-schedules" />} />
          <Route path="templates" element={<ComingSoonPage feature="templates" />} />
          <Route path="insights" element={<ComingSoonPage feature="insights" />} />
          <Route path="support" element={<ComingSoonPage feature="support" />} />
          <Route path="docs" element={<ComingSoonPage feature="documentation" />} />
          <Route path="documentation" element={<ComingSoonPage feature="documentation" />} />
          <Route path="coming-soon" element={<ComingSoonPage />} />

          {/* Default /app index fallback */}
          <Route index element={<Navigate to="/app/agents" replace />} />
        </Route>

        {/* Catch-all → home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

