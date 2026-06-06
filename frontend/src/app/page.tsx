"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bot,
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
    description: "Enter any business website URL and let Beacon scan, extract, and convert pages, services, and FAQs into a production-ready knowledge base instantly. Zero manual setup.",
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
    <div className="relative w-screen h-screen overflow-hidden bg-black text-white font-sans flex flex-col justify-between selection:bg-white selection:text-black">
      {/* Background Video */}
      <video
        className="fixed inset-0 w-full h-full object-cover z-0 pointer-events-none select-none"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260406_094145_4a271a6c-3869-4f1c-8aa7-aeb0cb227994.mp4"
        autoPlay
        loop
        muted
        playsInline
      />

      {/* Bottom Blur Overlay */}
      <div className="bottom-blur-overlay" />

      {/* Navbar (Z-Index 50, relative positioned) */}
      <header className="relative z-50 flex justify-between items-center px-4 sm:px-6 md:px-12 py-4 md:py-6">
        {/* Left: Text logo */}
        <Link 
          href="/" 
          className="h-8 md:h-10 flex items-center gap-2.5 animate-blur-fade-up select-none cursor-pointer" 
          style={{ animationDelay: "0ms" }}
        >
          <span className="font-extrabold text-xl md:text-2xl tracking-wider text-white">
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
              className="text-sm hover:text-gray-300 transition-colors animate-blur-fade-up text-white"
              style={{ animationDelay: `${100 + idx * 50}ms` }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Search Button (Hidden below sm) */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="hidden sm:flex items-center gap-2 rounded-full px-4 md:px-6 py-2 text-sm text-white liquid-glass animate-blur-fade-up cursor-pointer"
            style={{ animationDelay: "350ms" }}
          >
            <Search size={18} />
            Search
          </button>

          {/* User Button (Hidden below sm) */}
          <Link
            href="/dashboard"
            className="hidden sm:flex w-10 h-10 items-center justify-center rounded-full liquid-glass text-white animate-blur-fade-up cursor-pointer"
            style={{ animationDelay: "400ms" }}
          >
            <User size={18} />
          </Link>

          {/* Mobile Hamburger Menu (Below lg only) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex lg:hidden w-10 h-10 items-center justify-center rounded-full liquid-glass text-white relative animate-blur-fade-up cursor-pointer"
            style={{ animationDelay: "350ms" }}
          >
            <div className={`absolute transition-all duration-500 ease-out ${
              mobileMenuOpen 
                ? "rotate-180 opacity-0 scale-50" 
                : "rotate-0 opacity-100 scale-100"
            }`}>
              <Menu size={18} />
            </div>
            <div className={`absolute transition-all duration-500 ease-out ${
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
        className={`absolute left-0 right-0 w-full z-40 bg-gray-900/95 backdrop-blur-lg border-t border-b border-gray-800 shadow-2xl transition-all duration-500 ease-out lg:hidden ${
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
              className={`py-3 px-3 rounded-lg hover:bg-gray-800/50 font-medium text-sm text-white block transition-all duration-500 ease-out transform ${
                mobileMenuOpen ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0"
              }`}
              style={{ transitionDelay: mobileMenuOpen ? `${idx * 50}ms` : "0ms" }}
            >
              {link.label}
            </Link>
          ))}

          {/* Below sm section */}
          <div className="sm:hidden pt-4 border-t border-gray-800 flex flex-col gap-3">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setSearchOpen(true);
              }}
              className="w-full flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-medium text-white liquid-glass"
            >
              <Search size={18} />
              Search
            </button>
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-medium text-white liquid-glass"
            >
              <User size={18} />
              Profile
            </Link>
          </div>
        </div>
      </div>

      {/* Search Overlay Input */}
      {searchOpen && (
        <div className="absolute inset-x-0 top-[72px] z-30 bg-black/80 border-b border-gray-800 p-4 animate-blur-fade-up backdrop-blur-md">
          <div className="max-w-2xl mx-auto flex gap-3">
            <input
              type="text"
              placeholder="Search features, documentation or leads..."
              className="flex-1 rounded-full bg-white/5 border border-white/10 px-5 py-2.5 text-sm text-white focus:outline-none focus:border-white/30 placeholder-white/40"
              autoFocus
            />
            <button
              onClick={() => setSearchOpen(false)}
              className="rounded-full px-5 py-2.5 text-xs font-semibold text-white liquid-glass"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Hero Content Section */}
      <div className="relative z-10 flex-1 flex flex-col justify-end px-4 sm:px-6 md:px-12 pb-8 md:pb-16">
        
        {/* Dynamic Key Component which triggers CSS entry animations on slide swap */}
        <div key={currentSlide} className="flex flex-col md:flex-row items-end gap-8 w-full">
          
          {/* Left Side: Copywriting */}
          <div className="flex-1 max-w-3xl space-y-6">
            {/* Metadata tags */}
            <div
              className="flex flex-wrap items-center gap-3 sm:gap-6 mb-6 md:mb-8 text-xs sm:text-sm animate-blur-fade-up text-white"
              style={{ animationDelay: "300ms" }}
            >
              <span className="flex items-center gap-2 font-medium">
                <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-white text-white" />
                {slide.metaRating}
              </span>
              <span className="flex items-center gap-2">
                <Clock size={16} className="text-white" />
                {slide.metaDuration}
              </span>
              <span className="flex items-center gap-2">
                <Calendar size={16} className="text-white" />
                {slide.metaDate}
              </span>
            </div>

            {/* Title */}
            <h2
              className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-normal tracking-[-0.04em] mb-4 md:mb-6 animate-blur-fade-up text-white"
              style={{ animationDelay: "400ms" }}
            >
              {slide.title}
            </h2>

            {/* Description */}
            <p
              className="text-base sm:text-lg md:text-xl text-gray-400 mb-6 md:mb-12 max-w-2xl animate-blur-fade-up"
              style={{ animationDelay: "500ms" }}
            >
              {slide.description}
            </p>

            {/* Call To Actions */}
            <div className="flex flex-wrap gap-3 sm:gap-4">
              <Link
                href={slide.ctaLink}
                className="bg-white text-black rounded-full font-medium px-6 sm:px-8 py-2.5 sm:py-3 hover:bg-gray-200 transition-colors flex items-center gap-2 cursor-pointer animate-blur-fade-up"
                style={{ animationDelay: "600ms" }}
              >
                <Play size={18} className="fill-black" />
                {slide.ctaText}
              </Link>
              <Link
                href={slide.secondaryLink}
                className="rounded-full font-medium liquid-glass px-6 sm:px-8 py-2.5 sm:py-3 text-white flex items-center justify-center cursor-pointer animate-blur-fade-up"
                style={{ animationDelay: "700ms" }}
              >
                {slide.secondaryText}
              </Link>
            </div>
          </div>

          {/* Right Side: Slides Navigation Buttons */}
          <div className="flex gap-3 w-full md:w-auto justify-start md:justify-end shrink-0">
            <button
              onClick={prevSlide}
              aria-label="Previous Slide"
              className="rounded-full liquid-glass px-4 sm:px-6 py-2.5 sm:py-3 text-white flex items-center justify-center cursor-pointer animate-blur-fade-up"
              style={{ animationDelay: "800ms" }}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={nextSlide}
              aria-label="Next Slide"
              className="rounded-full liquid-glass px-4 sm:px-6 py-2.5 sm:py-3 text-white flex items-center justify-center cursor-pointer animate-blur-fade-up"
              style={{ animationDelay: "900ms" }}
            >
              <ChevronRight size={20} />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
