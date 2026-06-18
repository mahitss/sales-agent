"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  User,
  Menu,
  X,
  Play,
  ChevronLeft,
  ChevronRight,
  Star,
  Clock,
  Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";

interface Slide {
  metaRating: string;
  metaDuration: string;
  metaDate: string;
  title: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  secondaryText: string;
  secondaryLink: string;
}

const slides: Slide[] = [
  {
    metaRating: "87% Probability",
    metaDuration: "Urgency: High",
    metaDate: "Decision Maker: Yes",
    title: "Deal Probability. Score Every Lead.",
    description: "Qualify leads with an AI-calculated Deal Probability Score, identifying budget, urgency indicators, and decision maker status. Instantly know who to contact first.",
    ctaText: "Launch Portal",
    ctaLink: "/dashboard",
    secondaryText: "Documentation",
    secondaryLink: "/dashboard",
  },
  {
    metaRating: "₹75,000 Value",
    metaDuration: "Probability: 82%",
    metaDate: "Expected: ₹61,500",
    title: "Revenue Prediction. Talk Business.",
    description: "Automatically calculate estimated deal value and expected revenue based on deal probability. Speak the financial language of your business stakeholders.",
    ctaText: "Launch Portal",
    ctaLink: "/dashboard",
    secondaryText: "Documentation",
    secondaryLink: "/dashboard",
  },
  {
    metaRating: "Zero Setup",
    metaDuration: "Auto-Scrape",
    metaDate: "FAQ Extraction",
    title: "Auto Website Learning. Instant RAG.",
    description: "Enter any business website URL and let Beacon scan, extract, and convert pages, services, and FAQs into a knowledge base instantly. Zero manual setup.",
    ctaText: "Launch Portal",
    ctaLink: "/dashboard",
    secondaryText: "Documentation",
    secondaryLink: "/dashboard",
  },
  {
    metaRating: "John (Visitor)",
    metaDuration: "3 Previous Visits",
    metaDate: "Topic: SEO / ₹40k",
    title: "Conversational Memory. Feels Premium.",
    description: "Beacon remembers returning users, their past inquiries, and budgets (e.g., 'Welcome back John, still looking for SEO services?'). Personalize engagement automatically.",
    ctaText: "Launch Portal",
    ctaLink: "/dashboard",
    secondaryText: "Documentation",
    secondaryLink: "/dashboard",
  },
  {
    metaRating: "32 Leads",
    metaDuration: "7 High-Value",
    metaDate: "Recommendation Active",
    title: "AI Recommendations. Guided Action.",
    description: "Unlock actionable intelligence with weekly recommendations. Highlight high-value leads and get direct step-by-step strategies on which opportunities to close first.",
    ctaText: "Launch Portal",
    ctaLink: "/dashboard",
    secondaryText: "Documentation",
    secondaryLink: "/dashboard",
  },
  {
    metaRating: "Service Compare",
    metaDuration: "Content Gaps",
    metaDate: "Insights Active",
    title: "Competitor Analysis. Market Gaps.",
    description: "Analyze competitor domains to uncover detailed service comparisons, identify missing offerings, and pinpoint content gaps. Turn external data into raw business insights.",
    ctaText: "Launch Portal",
    ctaLink: "/dashboard",
    secondaryText: "Documentation",
    secondaryLink: "/dashboard",
  },
  {
    metaRating: "Location: Mumbai",
    metaDuration: "Pages: Pricing",
    metaDate: "Duration: 8 mins",
    title: "Visitor Tracking. Live User Flows.",
    description: "Track visitor geographic location, pages viewed, and duration of stay to supply the AI agent with contextual sales triggers.",
    ctaText: "Launch Portal",
    ctaLink: "/dashboard",
    secondaryText: "Documentation",
    secondaryLink: "/dashboard",
  },
  {
    metaRating: "4 Channels",
    metaDuration: "Unified Inbox",
    metaDate: "WhatsApp & Insta",
    title: "Multi-Channel Inbox. Unified Conversations.",
    description: "Consolidate all conversations across Website Chat, WhatsApp, Instagram, and Email into a single unified inbox. Bring communication streams together.",
    ctaText: "Launch Portal",
    ctaLink: "/dashboard",
    secondaryText: "Documentation",
    secondaryLink: "/dashboard",
  },
  {
    metaRating: "Live Takeover",
    metaDuration: "Instant Hand-off",
    metaDate: "AI + Human",
    title: "Human Takeover. Seamless Hand-offs.",
    description: "Transition conversations from AI to human agents instantly with a simple 'Take Over Chat' action. Ensure high-stakes inquiries always get the personal human touch.",
    ctaText: "Launch Portal",
    ctaLink: "/dashboard",
    secondaryText: "Documentation",
    secondaryLink: "/dashboard",
  }
];

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  // Keyboard navigation for carousel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextSlide();
      if (e.key === "ArrowLeft") prevSlide();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const slide = slides[currentSlide];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-background text-foreground font-sans flex flex-col justify-between selection:bg-foreground selection:text-background transition-colors duration-300">
      {/* Background Video (Only visible in dark theme) */}
      <video
        className="fixed inset-0 w-full h-full object-cover z-0 pointer-events-none select-none opacity-40 dark:opacity-100 dark:block hidden"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260406_094145_4a271a6c-3869-4f1c-8aa7-aeb0cb227994.mp4"
        autoPlay
        loop
        muted
        playsInline
        onError={(e) => {
          console.warn("Background video failed to load, falling back to CSS gradient.");
          (e.currentTarget as HTMLVideoElement).style.display = "none";
        }}
      />

      {/* Light Theme Background Mesh */}
      <div className="fixed inset-0 w-full h-full z-0 pointer-events-none bg-gradient-to-br from-slate-100 via-slate-50 to-emerald-50/20 dark:hidden" />

      {/* Bottom Blur Overlay */}
      <div className="bottom-blur-overlay" />

      {/* Navbar */}
      <header className="relative z-50 flex justify-between items-center px-4 sm:px-6 md:px-12 py-4 md:py-6 bg-background/5 backdrop-blur-md border-b border-card-border/10">
        {/* Left: Logo */}
        <Link 
          href="/" 
          className="flex items-center gap-2.5 select-none cursor-pointer" 
        >
          <span className="font-extrabold text-xl md:text-2xl tracking-wider bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
            BEACON AI
          </span>
        </Link>

        {/* Center: Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-8">
          {[
            { label: "Solutions", href: "/dashboard" },
            { label: "Integrations", href: "/dashboard" },
            { label: "Lead Panel", href: "/dashboard" },
            { label: "FAQs Portal", href: "/dashboard" },
            { label: "Widget Code", href: "/dashboard" },
          ].map((link, idx) => (
            <Link
              key={idx}
              href={link.href}
              className="text-sm hover:text-accent-primary transition-colors text-foreground/80 font-medium"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle integration */}
          <ThemeToggle />

          {/* Search Button (Hidden below sm) */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="hidden sm:flex items-center gap-2 rounded-xl px-4 md:px-6 py-2 text-sm text-foreground bg-card/20 border border-card-border hover:bg-card/50 transition-all cursor-pointer"
          >
            <Search size={16} />
            Search
          </button>

          {/* User Button (Hidden below sm) */}
          <Link
            href="/dashboard"
            className="hidden sm:flex w-10 h-10 items-center justify-center rounded-xl bg-card/20 border border-card-border hover:bg-card/50 text-foreground transition-all cursor-pointer"
          >
            <User size={18} />
          </Link>

          {/* Mobile Hamburger Menu (Below lg only) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex lg:hidden w-10 h-10 items-center justify-center rounded-xl bg-card/20 border border-card-border text-foreground relative cursor-pointer"
          >
            <div className={`absolute transition-all duration-300 ease-out ${
              mobileMenuOpen 
                ? "rotate-180 opacity-0 scale-50" 
                : "rotate-0 opacity-100 scale-100"
            }`}>
              <Menu size={18} />
            </div>
            <div className={`absolute transition-all duration-300 ease-out ${
              mobileMenuOpen 
                ? "rotate-0 opacity-100 scale-100" 
                : "-rotate-180 opacity-0 scale-50"
            }`}>
              <X size={18} />
            </div>
          </button>
        </div>
      </header>

      {/* Mobile Dropdown Menu */}
      <div
        className={`absolute left-0 right-0 w-full z-40 bg-card/95 backdrop-blur-lg border-t border-b border-card-border shadow-2xl transition-all duration-300 ease-out lg:hidden ${
          mobileMenuOpen
            ? "top-[72px] opacity-100 translate-y-0 pointer-events-auto"
            : "top-[72px] opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        <div className="flex flex-col p-6 space-y-4">
          {[
            { label: "Solutions", href: "/dashboard" },
            { label: "Integrations", href: "/dashboard" },
            { label: "Lead Panel", href: "/dashboard" },
            { label: "FAQs Portal", href: "/dashboard" },
            { label: "Widget Code", href: "/dashboard" },
          ].map((link, idx) => (
            <Link
              key={idx}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="py-3 px-3 rounded-lg hover:bg-card/40 font-medium text-sm text-foreground block transition-colors duration-200"
            >
              {link.label}
            </Link>
          ))}

          {/* Below sm section */}
          <div className="sm:hidden pt-4 border-t border-card-border flex flex-col gap-3">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setSearchOpen(true);
              }}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-foreground bg-card/30 border border-card-border"
            >
              <Search size={18} />
              Search
            </button>
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-foreground bg-card/30 border border-card-border"
            >
              <User size={18} />
              Profile
            </Link>
          </div>
        </div>
      </div>

      {/* Search Overlay Input */}
      {searchOpen && (
        <div className="absolute inset-x-0 top-[72px] z-30 bg-card/85 border-b border-card-border p-4 backdrop-blur-md">
          <div className="max-w-2xl mx-auto flex gap-3">
            <input
              type="text"
              placeholder="Search features, documentation or leads..."
              className="flex-1 rounded-xl bg-background border border-card-border px-5 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent-primary placeholder-muted-text"
              autoFocus
            />
            <button
              onClick={() => setSearchOpen(false)}
              className="rounded-xl px-5 py-2.5 text-xs font-semibold text-foreground border border-card-border hover:bg-card/40 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Hero Content Section */}
      <div className="relative z-10 flex-1 flex flex-col justify-end px-4 sm:px-6 md:px-12 pb-8 md:pb-16">
        
        {/* Dynamic Key Component which triggers Framer Motion animations on slide swap */}
        <div className="w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="flex flex-col md:flex-row items-end gap-8 w-full"
            >
              {/* Left Side: Copywriting */}
              <div className="flex-1 max-w-3xl space-y-6">
                {/* Metadata tags */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-6 mb-2 text-xs sm:text-sm text-foreground font-semibold">
                  <span className="flex items-center gap-2">
                    <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-accent-primary text-accent-primary" />
                    <span className="text-accent-primary font-black uppercase tracking-wider">{slide.metaRating}</span>
                  </span>
                  <span className="flex items-center gap-2 text-muted-text">
                    <Clock size={16} />
                    {slide.metaDuration}
                  </span>
                  <span className="flex items-center gap-2 text-muted-text">
                    <Calendar size={16} />
                    {slide.metaDate}
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-light tracking-tight text-foreground leading-[1.05]">
                  {slide.title}
                </h2>

                {/* Description */}
                <p className="text-base sm:text-lg md:text-xl text-muted-text max-w-2xl leading-relaxed">
                  {slide.description}
                </p>

                {/* Call To Actions */}
                <div className="flex flex-wrap gap-3 sm:gap-4 pt-2">
                  <Link
                    href={slide.ctaLink}
                    className="bg-accent-primary hover:bg-accent-hover text-white rounded-xl font-bold px-6 sm:px-8 py-2.5 sm:py-3 transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/10"
                  >
                    <Play size={16} className="fill-white" />
                    {slide.ctaText}
                  </Link>
                  <Link
                    href={slide.secondaryLink}
                    className="rounded-xl font-semibold bg-card/25 border border-card-border px-6 sm:px-8 py-2.5 sm:py-3 text-foreground flex items-center justify-center cursor-pointer hover:bg-card/50 transition-all"
                  >
                    {slide.secondaryText}
                  </Link>
                </div>
              </div>

              {/* Right Side: Slides Navigation Buttons */}
              <div className="flex gap-3 w-full md:w-auto justify-start md:justify-end shrink-0 pb-1">
                <button
                  onClick={prevSlide}
                  aria-label="Previous Slide"
                  className="rounded-xl bg-card/25 border border-card-border p-3 text-foreground flex items-center justify-center cursor-pointer hover:bg-card/50 transition-all"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={nextSlide}
                  aria-label="Next Slide"
                  className="rounded-xl bg-card/25 border border-card-border p-3 text-foreground flex items-center justify-center cursor-pointer hover:bg-card/50 transition-all"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
