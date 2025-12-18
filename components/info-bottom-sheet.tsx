"use client"

import { useEffect, useState } from "react"
import {
  X,
  AlertCircle,
  Info,
  PackageCheck,
  Shield,
  AlertTriangle,
  Pill,
  FileCheck,
  ExternalLink,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { getMedicineInfo } from "@/lib/ai-service"
import type { MedicineInfo } from "@/lib/types"

interface InfoBottomSheetProps {
  medicineName: string | null
  isOpen: boolean
  onClose: () => void
}

export function InfoBottomSheet({ medicineName, isOpen, onClose }: InfoBottomSheetProps) {
  const [medicineInfo, setMedicineInfo] = useState<MedicineInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"overview" | "sideEffects" | "warnings">("overview")

  useEffect(() => {
    if (!isOpen || !medicineName) {
      setMedicineInfo(null)
      setError(null)
      setActiveTab("overview")
      return
    }

    const fetchInfo = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const info = await getMedicineInfo(medicineName)
        setMedicineInfo(info)
      } catch (err) {
        console.error("[v0] Failed to fetch medicine info:", err)
        setError("Unable to fetch medicine information. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchInfo()
  }, [medicineName, isOpen])

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed inset-x-0 bottom-0 z-50 flex max-h-[90vh] flex-col rounded-t-3xl bg-card shadow-2xl animate-in slide-in-from-bottom duration-300">
        <div className="flex justify-center py-3">
          <div className="h-1.5 w-12 rounded-full bg-muted" />
        </div>

        <div className="flex items-start justify-between border-b px-6 pb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-balance text-2xl font-bold text-card-foreground">{medicineName}</h2>
              {medicineInfo?.verified && (
                <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-3 w-3" />
                  Verified
                </span>
              )}
            </div>
            {medicineInfo && (
              <p className="mt-1 text-sm text-muted-foreground">
                {medicineInfo.drugClass} • {medicineInfo.genericName}
              </p>
            )}
          </div>
          <Button size="icon" variant="ghost" onClick={onClose} className="shrink-0">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Tabs */}
        {medicineInfo && !isLoading && (
          <div className="flex gap-1 border-b px-6">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "overview"
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("sideEffects")}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "sideEffects"
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Side Effects
            </button>
            <button
              onClick={() => setActiveTab("warnings")}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "warnings"
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Warnings
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Spinner className="mb-4 h-8 w-8" />
              <p className="text-sm text-muted-foreground">Verifying medicine information...</p>
              <p className="mt-1 text-xs text-muted-foreground">Cross-referencing with medical databases</p>
            </div>
          )}

          {error && (
            <Card className="border-destructive/50 bg-destructive/10 p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            </Card>
          )}

          {medicineInfo && !isLoading && (
            <div className="space-y-6">
              {/* Overview Tab */}
              {activeTab === "overview" && (
                <>
                  {/* Description */}
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <Info className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-card-foreground">Description</h3>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{medicineInfo.description}</p>
                  </div>

                  {/* Brand Names */}
                  {medicineInfo.brandNames && medicineInfo.brandNames.length > 0 && (
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <PackageCheck className="h-4 w-4 text-primary" />
                        <h3 className="font-semibold text-card-foreground">Brand Names</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {medicineInfo.brandNames.map((brand, idx) => (
                          <span
                            key={idx}
                            className="rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground"
                          >
                            {brand}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Common Uses */}
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <Pill className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-card-foreground">Common Uses</h3>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{medicineInfo.commonUses}</p>
                  </div>

                  {/* Dosage Info */}
                  {medicineInfo.dosageInfo && (
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <FileCheck className="h-4 w-4 text-primary" />
                        <h3 className="font-semibold text-card-foreground">Dosage Information</h3>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">{medicineInfo.dosageInfo}</p>
                    </div>
                  )}

                  {/* Sources */}
                  {medicineInfo.sources && medicineInfo.sources.length > 0 && (
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <ExternalLink className="h-4 w-4 text-primary" />
                        <h3 className="font-semibold text-card-foreground">Verified Sources</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {medicineInfo.sources.map((source, idx) => (
                          <span
                            key={idx}
                            className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            {source}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Side Effects Tab */}
              {activeTab === "sideEffects" && medicineInfo.sideEffects && (
                <>
                  {/* Common Side Effects */}
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <h3 className="font-semibold text-card-foreground">Common Side Effects</h3>
                    </div>
                    <Card className="border-yellow-500/20 bg-yellow-500/5 p-4">
                      <ul className="space-y-2">
                        {medicineInfo.sideEffects.common.map((effect, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-yellow-500 shrink-0" />
                            {effect}
                          </li>
                        ))}
                      </ul>
                    </Card>
                  </div>

                  {/* Serious Side Effects */}
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-destructive" />
                      <h3 className="font-semibold text-card-foreground">Serious Side Effects</h3>
                      <span className="text-xs text-destructive">(Seek medical attention)</span>
                    </div>
                    <Card className="border-destructive/20 bg-destructive/5 p-4">
                      <ul className="space-y-2">
                        {medicineInfo.sideEffects.serious.map((effect, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive shrink-0" />
                            {effect}
                          </li>
                        ))}
                      </ul>
                    </Card>
                  </div>
                </>
              )}

              {/* Warnings Tab */}
              {activeTab === "warnings" && (
                <>
                  {/* Warnings */}
                  {medicineInfo.warnings && medicineInfo.warnings.length > 0 && (
                    <div>
                      <div className="mb-3 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        <h3 className="font-semibold text-card-foreground">Warnings & Precautions</h3>
                      </div>
                      <Card className="border-orange-500/20 bg-orange-500/5 p-4">
                        <ul className="space-y-3">
                          {medicineInfo.warnings.map((warning, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <AlertTriangle className="mt-0.5 h-4 w-4 text-orange-500 shrink-0" />
                              {warning}
                            </li>
                          ))}
                        </ul>
                      </Card>
                    </div>
                  )}

                  {/* Drug Interactions */}
                  {medicineInfo.interactions && medicineInfo.interactions.length > 0 && (
                    <div>
                      <div className="mb-3 flex items-center gap-2">
                        <Pill className="h-4 w-4 text-primary" />
                        <h3 className="font-semibold text-card-foreground">Drug Interactions</h3>
                      </div>
                      <Card className="p-4">
                        <ul className="space-y-2">
                          {medicineInfo.interactions.map((interaction, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                              {interaction}
                            </li>
                          ))}
                        </ul>
                      </Card>
                    </div>
                  )}

                  {/* General Safety */}
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-card-foreground">General Safety</h3>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{medicineInfo.generalSafety}</p>
                  </div>
                </>
              )}

              {/* Disclaimer */}
              <Card className="border-muted bg-muted/50 p-4">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 shrink-0 text-foreground" />
                  <div className="space-y-2 text-sm text-foreground">
                    <p className="font-semibold">Important Disclaimer</p>
                    <p className="leading-relaxed">
                      This information is AI-generated and verified against medical databases for educational purposes
                      only. It is not medical advice. Always consult your healthcare provider before starting, stopping,
                      or changing any medication.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
