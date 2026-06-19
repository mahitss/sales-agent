"use client";

import React from "react";
import dynamic from "next/dynamic";
import {
  Users,
  MessageSquare,
  Calendar,
  BookOpen,
  Code as CodeIcon,
  LogOut,
  TrendingUp,
  RefreshCw,
  MapPin,
  Compass,
  Radio,
  Activity,
  CreditCard,
  History,
  Sparkles,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useDashboardData } from "@/hooks/useDashboardData";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { OnboardingForm } from "@/components/auth/OnboardingForm";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Dynamic sub-tabs imports for optimized loading and bundles optimization
const OverviewTab = dynamic(() => import("./components/OverviewTab").then(m => m.OverviewTab), { ssr: false });
const LeadsTab = dynamic(() => import("./components/LeadsTab").then(m => m.LeadsTab), { ssr: false });
const ConversationsTab = dynamic(() => import("./components/ConversationsTab").then(m => m.ConversationsTab), { ssr: false });
const AppointmentsTab = dynamic(() => import("./components/AppointmentsTab").then(m => m.AppointmentsTab), { ssr: false });
const KnowledgeBaseTab = dynamic(() => import("./components/KnowledgeBaseTab").then(m => m.KnowledgeBaseTab), { ssr: false });
const VisitorTracksTab = dynamic(() => import("./components/VisitorTracksTab").then(m => m.VisitorTracksTab), { ssr: false });
const CompetitorTab = dynamic(() => import("./components/CompetitorTab").then(m => m.CompetitorTab), { ssr: false });
const TeamTab = dynamic(() => import("./components/TeamTab").then(m => m.TeamTab), { ssr: false });
const WidgetTab = dynamic(() => import("./components/WidgetTab").then(m => m.WidgetTab), { ssr: false });
const IntegrationsTab = dynamic(() => import("./components/IntegrationsTab").then(m => m.IntegrationsTab), { ssr: false });
const BillingTab = dynamic(() => import("./components/BillingTab").then(m => m.BillingTab), { ssr: false });
const ActivityTab = dynamic(() => import("./components/ActivityTab").then(m => m.ActivityTab), { ssr: false });
const AutomationsTab = dynamic(() => import("./components/AutomationsTab").then(m => m.AutomationsTab), { ssr: false });

import { FeedbackModal } from "@/components/FeedbackModal";

const SkeletonLoader = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-8 bg-slate-900/60 rounded-xl w-1/4 mb-4"></div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="h-32 bg-slate-900/40 border border-slate-900/50 rounded-2xl"></div>
      <div className="h-32 bg-slate-900/40 border border-slate-900/50 rounded-2xl"></div>
      <div className="h-32 bg-slate-900/40 border border-slate-900/50 rounded-2xl"></div>
    </div>
    <div className="h-64 bg-slate-900/30 border border-slate-900/50 rounded-2xl"></div>
  </div>
);

export default function DashboardPage() {
  const [isFeedbackOpen, setIsFeedbackOpen] = React.useState(false);
  const {
    API_URL,
    token,
    user,
    business,
    businessLoading,
    activeTab,
    setActiveTab,
    leads,
    conversations,
    appointments,
    faqs,
    visitorTracks,
    competitorAnalyses,
    recommendations,
    stats,
    selectedConv,
    setSelectedConv,
    faqTitle,
    setFaqTitle,
    faqContent,
    setFaqContent,
    faqLoading,
    competitorUrl,
    setCompetitorUrl,
    competitorLoading,
    competitorLogs,
    scraperUrl,
    setScraperUrl,
    scraperLoading,
    scraperLogs,
    operatorReply,
    setOperatorReply,
    operatorSending,
    simChannel,
    setSimChannel,
    simMessage,
    setSimMessage,
    simLeadName,
    setSimLeadName,
    simLeadPhone,
    setSimLeadPhone,
    simLeadEmail,
    setSimLeadEmail,
    simLoading,
    simStatus,
    whatsappEnabled,
    setWhatsappEnabled,
    instagramEnabled,
    setInstagramEnabled,
    emailEnabled,
    setEmailEnabled,
    whatsappApiKey,
    setWhatsappApiKey,
    instagramAccountId,
    setInstagramAccountId,
    emailSmtp,
    setEmailSmtp,
    connectionSaving,
    themeColor,
    setThemeColor,
    agentTone,
    setAgentTone,
    agentPrompt,
    setAgentPrompt,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    filterSource,
    setFilterSource,
    filterSentiment,
    setFilterSentiment,
    kbProgress,
    kbUploading,
    kbFileName,
    dataLoading,
    employees,
    employeeLoading,
    employeeError,
    employeeSuccess,
    refreshData,
    handleAddEmployee,
    authView,
    setAuthView,
    authError,
    setAuthError,
    authLoading,
    forgotSuccess,
    onboardLoading,
    handleLogout,
    handleLogin,
    handleRegister,
    handleRequestPasswordReset,
    handleOnboard,
    handleAddFAQ,
    handleExportLeads,
    handleDeleteFAQ,
    handleUpdateApptStatus,
    handleUpdateLeadStatus,
    handleSaveConnections,
    handleSimulateMessage,
    handleStartScrape,
    handleStartFileUpload,
    handleStartCompetitor,
    handleToggleTakeover,
    handleSendOperatorReply,
    googleSheetsSpreadsheetId,
    setGoogleSheetsSpreadsheetId,
    googleSheetsEnabled,
    setGoogleSheetsEnabled,
    handleExportLeadsExcel,
    activityLogs,
    handleStripeCheckout,
    handleStripePortal,
    outreachSequences,
    workflowRules,
    notifications,
    removeNotification,
    handleScheduleOutreach,
    handleToggleWorkflowRule,
    handleEnrichCompany,
    handleFindEmails,
  } = useDashboardData();

  // 1. RENDER: Auth Gate
  if (!token) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-background px-4 text-foreground transition-all duration-300">
        <div className="absolute top-6 right-6 z-50">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-md space-y-8 rounded-3xl border border-card-border bg-card/40 p-8 shadow-2xl backdrop-blur-md">
          <AnimatePresence mode="wait" initial={false}>
            {authView === "login" && (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.2 }}
              >
                <LoginForm
                  onSubmit={handleLogin}
                  authLoading={authLoading}
                  authError={authError}
                  onToggleView={() => {
                    setAuthView("register");
                    setAuthError("");
                  }}
                  onForgotPassword={() => {
                    setAuthView("forgot");
                    setAuthError("");
                  }}
                />
              </motion.div>
            )}

            {authView === "register" && (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.2 }}
              >
                <RegisterForm
                  onSubmit={handleRegister}
                  authLoading={authLoading}
                  authError={authError}
                  onToggleView={() => {
                    setAuthView("login");
                    setAuthError("");
                  }}
                />
              </motion.div>
            )}

            {authView === "forgot" && (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.2 }}
              >
                <ForgotPasswordForm
                  onSubmit={handleRequestPasswordReset}
                  authLoading={authLoading}
                  authError={authError}
                  forgotSuccess={forgotSuccess}
                  onBackToLogin={() => {
                    setAuthView("login");
                    setAuthError("");
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // 2. RENDER: Loading Gate
  if (token && businessLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground transition-all duration-300">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-accent-primary" />
          <p className="text-sm text-muted-text">Loading Business Profile...</p>
        </div>
      </div>
    );
  }

  // 3. RENDER: Onboarding Wizard
  if (!business) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-background px-4 text-foreground transition-all duration-300">
        <div className="absolute top-6 right-6 z-50">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-lg space-y-8 rounded-3xl border border-card-border bg-card/40 p-8 shadow-2xl backdrop-blur-md">
          <OnboardingForm
            onSubmit={handleOnboard}
            onboardLoading={onboardLoading}
            onLogout={handleLogout}
          />
        </div>
      </div>
    );
  }

  // 4. RENDER: Full Dashboard Portal
  return (
    <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden transition-all duration-300">
      {/* Sidebar Layout */}
      <aside className="w-64 border-r border-card-border bg-card/20 flex flex-col justify-between shrink-0">
        <div className="flex flex-col">
          {/* Logo / Org Name */}
          <div className="p-6 border-b border-card-border flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-md">
              <Activity className="h-5.5 w-5.5" />
            </div>
            <div>
              <h1 className="font-bold text-sm leading-tight text-white">{business.companyName}</h1>
              <p className="text-[10px] text-accent-primary font-semibold tracking-wider uppercase">Portal Active</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 px-3 space-y-1 overflow-y-auto max-h-[calc(100vh-16rem)]">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all cursor-pointer ${
                activeTab === "overview"
                  ? "bg-accent-primary/10 text-accent-primary border border-accent-primary/20 font-semibold"
                  : "text-muted-text hover:bg-card/40 hover:text-foreground"
              }`}
            >
              <TrendingUp className="h-4.5 w-4.5" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab("leads")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all cursor-pointer ${
                activeTab === "leads"
                  ? "bg-accent-primary/10 text-accent-primary border border-accent-primary/20 font-semibold"
                  : "text-muted-text hover:bg-card/40 hover:text-foreground"
              }`}
            >
              <Users className="h-4.5 w-4.5" />
              Leads
            </button>
            <button
              onClick={() => setActiveTab("conversations")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all cursor-pointer ${
                activeTab === "conversations"
                  ? "bg-accent-primary/10 text-accent-primary border border-accent-primary/20 font-semibold"
                  : "text-muted-text hover:bg-card/40 hover:text-foreground"
              }`}
            >
              <MessageSquare className="h-4.5 w-4.5" />
              Live Inbox
            </button>
            <button
              onClick={() => setActiveTab("appointments")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all cursor-pointer ${
                activeTab === "appointments"
                  ? "bg-accent-primary/10 text-accent-primary border border-accent-primary/20 font-semibold"
                  : "text-muted-text hover:bg-card/40 hover:text-foreground"
              }`}
            >
              <Calendar className="h-4.5 w-4.5" />
              Appointments
            </button>
            <button
              onClick={() => setActiveTab("kb")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all cursor-pointer ${
                activeTab === "kb"
                  ? "bg-accent-primary/10 text-accent-primary border border-accent-primary/20 font-semibold"
                  : "text-muted-text hover:bg-card/40 hover:text-foreground"
              }`}
            >
              <BookOpen className="h-4.5 w-4.5" />
              Knowledge Base
            </button>
            <button
              onClick={() => setActiveTab("visitor")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all cursor-pointer ${
                activeTab === "visitor"
                  ? "bg-accent-primary/10 text-accent-primary border border-accent-primary/20 font-semibold"
                  : "text-muted-text hover:bg-card/40 hover:text-foreground"
              }`}
            >
              <MapPin className="h-4.5 w-4.5" />
              Visitor Activity
            </button>

            {user?.role === "ADMIN" && (
              <>
                <button
                  onClick={() => setActiveTab("competitor")}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all cursor-pointer ${
                    activeTab === "competitor"
                      ? "bg-accent-primary/10 text-accent-primary border border-accent-primary/20 font-semibold"
                      : "text-muted-text hover:bg-card/40 hover:text-foreground"
                  }`}
                >
                  <Compass className="h-4.5 w-4.5" />
                  Competitor Insights
                </button>
                <button
                  onClick={() => setActiveTab("team")}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all cursor-pointer ${
                    activeTab === "team"
                      ? "bg-accent-primary/10 text-accent-primary border border-accent-primary/20 font-semibold"
                      : "text-muted-text hover:bg-card/40 hover:text-foreground"
                  }`}
                >
                  <Users className="h-4.5 w-4.5" />
                  Team Members
                </button>
                <button
                  onClick={() => setActiveTab("integrations")}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all cursor-pointer ${
                    activeTab === "integrations"
                      ? "bg-accent-primary/10 text-accent-primary border border-accent-primary/20 font-semibold"
                      : "text-muted-text hover:bg-card/40 hover:text-foreground"
                  }`}
                >
                  <Radio className="h-4.5 w-4.5" />
                  Integrations
                </button>
                <button
                  onClick={() => setActiveTab("widget")}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all cursor-pointer ${
                    activeTab === "widget"
                      ? "bg-accent-primary/10 text-accent-primary border border-accent-primary/20 font-semibold"
                      : "text-muted-text hover:bg-card/40 hover:text-foreground"
                  }`}
                >
                  <CodeIcon className="h-4.5 w-4.5" />
                  Widget Code
                </button>
                <button
                  onClick={() => setActiveTab("automations")}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all cursor-pointer ${
                    activeTab === "automations"
                      ? "bg-accent-primary/10 text-accent-primary border border-accent-primary/20 font-semibold"
                      : "text-muted-text hover:bg-card/40 hover:text-foreground"
                  }`}
                >
                  <Zap className="h-4.5 w-4.5" />
                  Automations
                </button>
                <button
                  onClick={() => setActiveTab("billing")}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all cursor-pointer ${
                    activeTab === "billing"
                      ? "bg-accent-primary/10 text-accent-primary border border-accent-primary/20 font-semibold"
                      : "text-muted-text hover:bg-card/40 hover:text-foreground"
                  }`}
                >
                  <CreditCard className="h-4.5 w-4.5" />
                  Plans & Billing
                </button>
                <button
                  onClick={() => setActiveTab("activity")}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all cursor-pointer ${
                    activeTab === "activity"
                      ? "bg-accent-primary/10 text-accent-primary border border-accent-primary/20 font-semibold"
                      : "text-muted-text hover:bg-card/40 hover:text-foreground"
                  }`}
                >
                  <History className="h-4.5 w-4.5" />
                  Audit Activity Logs
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Footer profile & logout */}
        <div className="p-4 border-t border-card-border space-y-3">
          <button
            onClick={() => setIsFeedbackOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold rounded-xl text-accent-primary hover:bg-accent-primary/5 hover:text-white border border-transparent hover:border-accent-primary/10 transition-all cursor-pointer"
          >
            <MessageSquare className="h-4.5 w-4.5" />
            Submit Feedback
          </button>
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700/50 flex items-center justify-center font-bold text-accent-primary shrink-0">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                <p className="text-[10px] text-muted-text truncate">{user?.email}</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold rounded-xl text-red-400 hover:bg-red-500/5 hover:text-red-300 border border-transparent hover:border-red-500/10 transition-all cursor-pointer"
          >
            <LogOut className="h-4.5 w-4.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-background">
        {/* Top bar */}
        <header className="h-16 border-b border-card-border bg-card/10 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold capitalize text-white">
              {activeTab === "kb" ? "Knowledge Base" :
               activeTab === "visitor" ? "Visitor Activity Tracking" :
               activeTab === "competitor" ? "Competitor Analysis Audit" :
               activeTab === "integrations" ? "Multi-Channel Settings" :
               activeTab === "team" ? "Team Seats Management" :
               activeTab}
            </h2>
            {dataLoading && <RefreshCw className="h-4 w-4 animate-spin text-accent-primary" />}
          </div>
          <button
            onClick={refreshData}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-muted-text hover:bg-card hover:text-white border border-card-border transition-all cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </header>

        {/* Dynamic Panels */}
        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {dataLoading ? (
                <SkeletonLoader />
              ) : (
                <>
                  {activeTab === "overview" && (
                    <ErrorBoundary>
                      <OverviewTab
                        user={user}
                        stats={stats}
                        recommendations={recommendations}
                        whatsappEnabled={whatsappEnabled}
                        instagramEnabled={instagramEnabled}
                        emailEnabled={emailEnabled}
                        setActiveTab={setActiveTab}
                      />
                    </ErrorBoundary>
                  )}

                  {activeTab === "leads" && (
                    <ErrorBoundary>
                      <LeadsTab
                        leads={leads}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        filterStatus={filterStatus}
                        setFilterStatus={setFilterStatus}
                        filterSource={filterSource}
                        setFilterSource={setFilterSource}
                        filterSentiment={filterSentiment}
                        setFilterSentiment={setFilterSentiment}
                        handleExportLeads={handleExportLeads}
                        handleExportLeadsExcel={handleExportLeadsExcel}
                        handleUpdateLeadStatus={handleUpdateLeadStatus}
                        outreachSequences={outreachSequences}
                        handleScheduleOutreach={handleScheduleOutreach}
                        handleEnrichCompany={handleEnrichCompany}
                        handleFindEmails={handleFindEmails}
                      />
                    </ErrorBoundary>
                  )}

                  {activeTab === "conversations" && (
                    <ErrorBoundary>
                      <ConversationsTab
                        conversations={conversations}
                        selectedConv={selectedConv}
                        setSelectedConv={setSelectedConv}
                        handleToggleTakeover={handleToggleTakeover}
                        operatorReply={operatorReply}
                        setOperatorReply={setOperatorReply}
                        handleSendOperatorReply={handleSendOperatorReply}
                        operatorSending={operatorSending}
                      />
                    </ErrorBoundary>
                  )}

                  {activeTab === "appointments" && (
                    <ErrorBoundary>
                      <AppointmentsTab
                        appointments={appointments}
                        handleUpdateApptStatus={handleUpdateApptStatus}
                      />
                    </ErrorBoundary>
                  )}

                  {activeTab === "kb" && (
                    <ErrorBoundary>
                      <KnowledgeBaseTab
                        user={user}
                        business={business}
                        faqs={faqs}
                        scraperUrl={scraperUrl}
                        setScraperUrl={setScraperUrl}
                        scraperLoading={scraperLoading}
                        scraperLogs={scraperLogs}
                        handleStartScrape={handleStartScrape}
                        kbUploading={kbUploading}
                        kbFileName={kbFileName}
                        kbProgress={kbProgress}
                        handleStartFileUpload={handleStartFileUpload}
                        faqTitle={faqTitle}
                        setFaqTitle={setFaqTitle}
                        faqContent={faqContent}
                        setFaqContent={setFaqContent}
                        faqLoading={faqLoading}
                        handleAddFAQ={handleAddFAQ}
                        handleDeleteFAQ={handleDeleteFAQ}
                      />
                    </ErrorBoundary>
                  )}

                  {activeTab === "visitor" && (
                    <ErrorBoundary>
                      <VisitorTracksTab
                        visitorTracks={visitorTracks}
                      />
                    </ErrorBoundary>
                  )}

                  {activeTab === "competitor" && (
                    <ErrorBoundary>
                      <CompetitorTab
                        competitorUrl={competitorUrl}
                        setCompetitorUrl={setCompetitorUrl}
                        competitorLoading={competitorLoading}
                        competitorLogs={competitorLogs}
                        handleStartCompetitor={handleStartCompetitor}
                        competitorAnalyses={competitorAnalyses}
                        business={business}
                      />
                    </ErrorBoundary>
                  )}

                  {activeTab === "team" && (
                    <ErrorBoundary>
                      <TeamTab
                        employees={employees}
                        employeeError={employeeError}
                        employeeSuccess={employeeSuccess}
                        employeeLoading={employeeLoading}
                        handleAddEmployee={handleAddEmployee}
                      />
                    </ErrorBoundary>
                  )}

                  {activeTab === "widget" && (
                    <ErrorBoundary>
                      <WidgetTab
                        business={business}
                        API_URL={API_URL}
                      />
                    </ErrorBoundary>
                  )}

                  {activeTab === "billing" && (
                    <ErrorBoundary>
                      <BillingTab
                        business={business}
                        handleStripeCheckout={handleStripeCheckout}
                        handleStripePortal={handleStripePortal}
                      />
                    </ErrorBoundary>
                  )}

                  {activeTab === "activity" && (
                    <ErrorBoundary>
                      <ActivityTab
                        activityLogs={activityLogs}
                      />
                    </ErrorBoundary>
                  )}

                  {activeTab === "automations" && (
                    <ErrorBoundary>
                      <AutomationsTab
                        workflowRules={workflowRules}
                        outreachSequences={outreachSequences}
                        handleToggleWorkflowRule={handleToggleWorkflowRule}
                      />
                    </ErrorBoundary>
                  )}

                  {activeTab === "integrations" && (
                    <ErrorBoundary>
                      <IntegrationsTab
                        business={business}
                        whatsappEnabled={whatsappEnabled}
                        setWhatsappEnabled={setWhatsappEnabled}
                        whatsappApiKey={whatsappApiKey}
                        setWhatsappApiKey={setWhatsappApiKey}
                        instagramEnabled={instagramEnabled}
                        setInstagramEnabled={setInstagramEnabled}
                        instagramAccountId={instagramAccountId}
                        setInstagramAccountId={setInstagramAccountId}
                        emailEnabled={emailEnabled}
                        setEmailEnabled={setEmailEnabled}
                        emailSmtp={emailSmtp}
                        setEmailSmtp={setEmailSmtp}
                        googleSheetsSpreadsheetId={googleSheetsSpreadsheetId}
                        setGoogleSheetsSpreadsheetId={setGoogleSheetsSpreadsheetId}
                        googleSheetsEnabled={googleSheetsEnabled}
                        setGoogleSheetsEnabled={setGoogleSheetsEnabled}
                        themeColor={themeColor}
                        setThemeColor={setThemeColor}
                        agentTone={agentTone}
                        setAgentTone={setAgentTone}
                        agentPrompt={agentPrompt}
                        setAgentPrompt={setAgentPrompt}
                        connectionSaving={connectionSaving}
                        handleSaveConnections={handleSaveConnections}
                        simChannel={simChannel}
                        setSimChannel={setSimChannel}
                        simLeadName={simLeadName}
                        setSimLeadName={setSimLeadName}
                        simLeadPhone={simLeadPhone}
                        setSimLeadPhone={setSimLeadPhone}
                        simLeadEmail={simLeadEmail}
                        setSimLeadEmail={setSimLeadEmail}
                        simMessage={simMessage}
                        setSimMessage={setSimMessage}
                        simLoading={simLoading}
                        simStatus={simStatus}
                        handleSimulateMessage={handleSimulateMessage}
                      />
                    </ErrorBoundary>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      {/* Toast Notification Tray */}
      <div className="fixed bottom-6 right-6 z-50 space-y-2 pointer-events-none">
        <AnimatePresence>
          {notifications.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              onClick={() => removeNotification(notif.id)}
              className="pointer-events-auto p-4 rounded-2xl border bg-slate-950/95 shadow-xl max-w-sm flex items-start gap-3 border-card-border cursor-pointer hover:border-slate-800"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                <Sparkles className="h-4.5 w-4.5" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">{notif.title}</p>
                <p className="text-[10px] text-muted-text mt-0.5 leading-relaxed truncate">{notif.content}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        businessId={business.id}
        apiUrl={API_URL}
        userEmail={user?.email}
        userName={user?.name}
      />
    </div>
  );
}
