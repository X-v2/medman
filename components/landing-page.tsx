"use client"

import { Camera, Sparkles, Shield, Zap } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ShaderAnimation } from "@/components/ui/shader-animation"
import CinematicThemeSwitcher from "@/components/ui/cinematic-theme-switcher"

export function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="fixed inset-0 -z-10 opacity-50 dark:opacity-40">
        <ShaderAnimation />
      </div>

      {/* Header */}
      <header className="relative border-b backdrop-blur-xl px-4 py-4 bg-white/10 dark:bg-black/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary shadow-lg shadow-primary/20">
              <Camera className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">MedMan</h1>
              <p className="text-xs text-muted-foreground">AI-Powered OCR</p>
            </div>
          </div>
          <CinematicThemeSwitcher />
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          {/* Main Hero Content */}
          <div className="text-center">
            <div className="mb-6 inline-flex animate-fade-in-up items-center gap-2 rounded-full border backdrop-blur-xl bg-white/10 dark:bg-black/10 px-4 py-2 text-sm shadow-lg">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">AI-powered medicine recognition with web verification</span>
            </div>

            <h2 className="mb-6 animate-fade-in-up text-balance text-4xl font-bold text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
              Scan Medicine Labels
              <br />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Get Verified Info
              </span>
            </h2>

            <p
              className="mx-auto mb-10 max-w-2xl animate-fade-in-up text-pretty text-lg text-muted-foreground leading-relaxed sm:text-xl"
              style={{ animationDelay: "0.1s" }}
            >
              Point your camera at medicine labels for instant AI-powered identification. Get comprehensive information
              including side effects, warnings, and drug interactions verified from medical databases.
            </p>

            <div
              className="flex animate-fade-in-up flex-col items-center justify-center gap-4"
              style={{ animationDelay: "0.2s" }}
            >
              <Link href="/scan">
                <Button
                  size="lg"
                  className="h-14 px-8 text-base font-medium shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Camera className="mr-2 h-5 w-5" />
                  Start Scanning
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-24 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="group animate-fade-in-up rounded-2xl border backdrop-blur-xl bg-white/10 dark:bg-black/10 p-6 shadow-lg transition-all hover:scale-105 hover:shadow-xl hover:bg-white/20 dark:hover:bg-black/20">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-all group-hover:bg-primary/20">
                <Camera className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-card-foreground">Smart OCR + AI Vision</h3>
              <p className="text-muted-foreground leading-relaxed">
                Advanced OCR combined with AI vision to detect medicine objects and extract text from labels
                automatically.
              </p>
            </div>

            <div
              className="group animate-fade-in-up rounded-2xl border backdrop-blur-xl bg-white/10 dark:bg-black/10 p-6 shadow-lg transition-all hover:scale-105 hover:shadow-xl hover:bg-white/20 dark:hover:bg-black/20"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 transition-all group-hover:bg-accent/20">
                <Zap className="h-6 w-6 text-accent" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-card-foreground">Verified Information</h3>
              <p className="text-muted-foreground leading-relaxed">
                Get detailed descriptions, side effects, warnings, and drug interactions verified from FDA and medical
                databases.
              </p>
            </div>

            <div
              className="group animate-fade-in-up rounded-2xl border backdrop-blur-xl bg-white/10 dark:bg-black/10 p-6 shadow-lg transition-all hover:scale-105 hover:shadow-xl hover:bg-white/20 dark:hover:bg-black/20 sm:col-span-2 lg:col-span-1"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-all group-hover:bg-primary/20">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-card-foreground">Complete Safety Info</h3>
              <p className="text-muted-foreground leading-relaxed">
                View common and serious side effects, precautions, contraindications, and potential drug interactions.
              </p>
            </div>
          </div>

          {/* How it works */}
          <div className="mt-24">
            <h3 className="mb-12 text-center text-3xl font-bold text-foreground">How It Works</h3>
            <div className="grid gap-8 sm:grid-cols-3">
              <div className="text-center">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground shadow-lg shadow-primary/20">
                  1
                </div>
                <h4 className="mb-2 text-lg font-semibold text-foreground">Capture</h4>
                <p className="text-muted-foreground">Take a photo of the medicine label or packaging</p>
              </div>
              <div className="text-center">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground shadow-lg shadow-primary/20">
                  2
                </div>
                <h4 className="mb-2 text-lg font-semibold text-foreground">Detect & Verify</h4>
                <p className="text-muted-foreground">
                  AI identifies medicines and verifies information from medical sources
                </p>
              </div>
              <div className="text-center">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground shadow-lg shadow-primary/20">
                  3
                </div>
                <h4 className="mb-2 text-lg font-semibold text-foreground">Get Details</h4>
                <p className="text-muted-foreground">
                  View comprehensive info including side effects, warnings, and interactions
                </p>
              </div>
            </div>
          </div>

          <div className="mx-auto mt-16 max-w-3xl rounded-2xl border backdrop-blur-xl bg-white/10 dark:bg-black/10 p-6 shadow-lg">
            <p className="text-center text-sm text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Important Disclaimer:</strong> MedMan is a demonstration tool for
              educational purposes only. This application does not provide medical advice, diagnosis, or treatment.
              Always consult qualified healthcare professionals for medical information and decisions regarding
              medications.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
