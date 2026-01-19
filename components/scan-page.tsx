"use client"

import { useState, useEffect } from "react"
// ADDED CheckCircle2 to imports
import { ArrowLeft, Camera, Clock, FileText, Pill, ChevronRight, Trash2, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CameraView } from "@/components/camera-view"
import { ShaderAnimation } from "@/components/ui/shader-animation"
import CinematicThemeSwitcher from "@/components/ui/cinematic-theme-switcher"
import { InfoBottomSheet } from "@/components/info-bottom-sheet"
import { getMedicineInfo } from "@/lib/ai-service"
import type { ScanResult, DetectedMedicine, MedicineInfo } from "@/lib/types"

export function ScanPage() {
  const [showCamera, setShowCamera] = useState(false)
  const [activeTab, setActiveTab] = useState<"current" | "history">("current")
  const [currentScan, setCurrentScan] = useState<ScanResult | null>(null)
  
  const [selectedMedicineName, setSelectedMedicineName] = useState<string | null>(null)
  const [selectedMedicineData, setSelectedMedicineData] = useState<MedicineInfo | null>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([])

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("MedMan-history")
    if (saved) {
      setScanHistory(JSON.parse(saved))
    }
  }, [])

  // Save history to localStorage
  useEffect(() => {
    if (scanHistory.length > 0) {
      localStorage.setItem("MedMan-history", JSON.stringify(scanHistory))
    }
  }, [scanHistory])

  const handleScanComplete = (imageUrl: string, medicines: DetectedMedicine[]) => {
    const newScan: ScanResult = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      imageUrl,
      medicines,
      medicineDetails: {},
    }
    setCurrentScan(newScan)
    setScanHistory((prev) => [newScan, ...prev])
    setShowCamera(false)
    setActiveTab("current")
  }

  const handleMedicineClick = async (medicineName: string) => {
    setSelectedMedicineName(medicineName)
    
    if (!currentScan) return

    // 1. Check Cache
    if (currentScan.medicineDetails && currentScan.medicineDetails[medicineName]) {
      setSelectedMedicineData(currentScan.medicineDetails[medicineName])
      return
    }

    // 2. Fetch if missing
    setIsLoadingDetails(true)
    setSelectedMedicineData(null)

    try {
      const info = await getMedicineInfo(medicineName)
      
      const updatedScan = {
        ...currentScan,
        medicineDetails: {
          ...currentScan.medicineDetails,
          [medicineName]: info
        }
      }

      setCurrentScan(updatedScan)
      setSelectedMedicineData(info)
      
      // Update persistent history
      setScanHistory(prev => prev.map(s => s.id === updatedScan.id ? updatedScan : s))

    } catch (error) {
      console.error("Failed to fetch details:", error)
    } finally {
      setIsLoadingDetails(false)
    }
  }

  const clearHistory = () => {
    setScanHistory([])
    localStorage.removeItem("MedMan-history")
  }

  const viewHistoryScan = (scan: ScanResult) => {
    setCurrentScan(scan)
    setActiveTab("current")
  }

  if (showCamera) {
    return <CameraView onClose={() => setShowCamera(false)} onScanComplete={handleScanComplete} />
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="fixed inset-0 -z-10 opacity-50 dark:opacity-40">
        <ShaderAnimation />
      </div>

      <header className="relative border-b backdrop-blur-xl px-4 py-4 bg-white/10 dark:bg-black/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary shadow-lg shadow-primary/20">
                <Camera className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">MedMan</h1>
                <p className="text-xs text-muted-foreground">Scan & identify medicines</p>
              </div>
            </div>
          </div>
          <CinematicThemeSwitcher />
        </div>
      </header>

      <main className="relative px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <Button
              onClick={() => setShowCamera(true)}
              size="lg"
              className="w-full h-16 text-lg font-medium shadow-lg backdrop-blur-xl bg-primary/90 hover:bg-primary text-primary-foreground"
            >
              <Camera className="mr-2 h-6 w-6" />
              Start New Scan
            </Button>
          </div>

          <div className="mb-6 flex gap-4 border-b border-border/50">
            <button
              onClick={() => setActiveTab("current")}
              className={`pb-3 px-1 font-medium transition-colors ${
                activeTab === "current"
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Current Scan
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`pb-3 px-1 font-medium transition-colors flex items-center gap-2 ${
                activeTab === "history"
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All History
              {scanHistory.length > 0 && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                  {scanHistory.length}
                </span>
              )}
            </button>
          </div>

          {activeTab === "current" && (
            <div className="space-y-6">
              {!currentScan ? (
                <div className="rounded-2xl border backdrop-blur-xl bg-white/10 dark:bg-black/10 p-12 text-center shadow-lg">
                  <Camera className="mx-auto h-16 w-16 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Active Scan</h3>
                  <p className="text-muted-foreground mb-6">
                    Start a new scan to identify medicines and get detailed information.
                  </p>
                  <Button onClick={() => setShowCamera(true)} variant="outline" className="backdrop-blur-xl">
                    <Camera className="mr-2 h-4 w-4" />
                    Start Scanning
                  </Button>
                </div>
              ) : (
                <>
                  {currentScan.imageUrl && (
                    <div className="rounded-2xl border backdrop-blur-xl bg-white/10 dark:bg-black/10 overflow-hidden shadow-lg">
                      <img
                        src={currentScan.imageUrl || "/placeholder.svg"}
                        alt="Scanned medicine"
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {new Date(currentScan.date).toLocaleString()}
                        </div>
                        <span className="text-sm font-medium text-primary">
                          {currentScan.medicines.length} medicines detected
                        </span>
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Detected Medicines</h3>
                    {currentScan.medicines.length === 0 ? (
                      <div className="rounded-2xl border backdrop-blur-xl bg-white/10 dark:bg-black/10 p-8 text-center shadow-lg">
                        <Pill className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
                        <p className="text-muted-foreground">No medicines detected in this scan.</p>
                        <p className="text-sm text-muted-foreground mt-1">Try scanning a clearer image of the label.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {currentScan.medicines.map((medicine) => (
                          <button
                            key={medicine.id}
                            onClick={() => handleMedicineClick(medicine.name)}
                            className="w-full group rounded-2xl border backdrop-blur-xl bg-white/10 dark:bg-black/10 p-4 shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl hover:bg-white/20 dark:hover:bg-black/20 text-left"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                                  <Pill className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-foreground">{medicine.name}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {currentScan.medicineDetails?.[medicine.name] 
                                      ? "Details loaded" 
                                      : "Tap to view details"}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-primary">
                                {currentScan.medicineDetails?.[medicine.name] ? (
                                   <CheckCircle2 className="h-4 w-4" />
                                ) : (
                                   <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() => setShowCamera(true)}
                    variant="outline"
                    className="w-full h-12 backdrop-blur-xl bg-white/10 dark:bg-black/10"
                  >
                    <Camera className="mr-2 h-5 w-5" />
                    Scan Another Medicine
                  </Button>
                </>
              )}
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-4">
              {scanHistory.length === 0 ? (
                <div className="rounded-2xl border backdrop-blur-xl bg-white/10 dark:bg-black/10 p-12 text-center shadow-lg">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No scan history yet. Start scanning to build your history.</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-end mb-4">
                    <Button
                      onClick={clearHistory}
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Clear History
                    </Button>
                  </div>
                  {scanHistory.map((scan) => (
                    <button
                      key={scan.id}
                      onClick={() => viewHistoryScan(scan)}
                      className="w-full group rounded-2xl border backdrop-blur-xl bg-white/10 dark:bg-black/10 p-4 shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl hover:bg-white/20 dark:hover:bg-black/20 text-left"
                    >
                      <div className="flex items-center gap-4">
                        {scan.imageUrl ? (
                          <img
                            src={scan.imageUrl || "/placeholder.svg"}
                            alt="Scan"
                            className="h-16 w-16 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
                            <FileText className="h-8 w-8 text-primary" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-foreground">
                              {scan.medicines.length > 0
                                ? scan.medicines.map((m) => m.name).join(", ")
                                : "No medicines detected"}
                            </h3>
                            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(scan.date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                            <span className="text-primary font-medium">
                              {Object.keys(scan.medicineDetails || {}).length}/{scan.medicines.length} Details
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </main>

      <InfoBottomSheet
        medicineName={selectedMedicineName}
        data={selectedMedicineData}
        isLoading={isLoadingDetails}
        isOpen={selectedMedicineName !== null}
        onClose={() => setSelectedMedicineName(null)}
      />
    </div>
  )
}