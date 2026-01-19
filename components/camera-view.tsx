"use client"

import { useEffect, useRef, useState } from "react"
import { X, Camera, Zap, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AnnotationMarker } from "@/components/annotation-marker"
import { InfoBottomSheet } from "@/components/info-bottom-sheet"
import { performOCR } from "@/lib/ocr-service"
// Import missing services and types
import { getMedicineInfo } from "@/lib/ai-service"
import type { DetectedMedicine, MedicineInfo } from "@/lib/types"

interface CameraViewProps {
  onClose: () => void
  onScanComplete?: (imageUrl: string, medicines: DetectedMedicine[]) => void
}

export function CameraView({ onClose, onScanComplete }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [detectedMedicines, setDetectedMedicines] = useState<DetectedMedicine[]>([])
  
  // State for BottomSheet info
  const [selectedMedicine, setSelectedMedicine] = useState<string | null>(null)
  const [selectedMedicineData, setSelectedMedicineData] = useState<MedicineInfo | null>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [sessionCache, setSessionCache] = useState<Record<string, MedicineInfo>>({})

  const [isProcessing, setIsProcessing] = useState(false)

  // Fetch info when a medicine marker is tapped
  useEffect(() => {
    if (!selectedMedicine) {
      setSelectedMedicineData(null)
      return
    }

    const fetchInfo = async () => {
      // Check local session cache first
      if (sessionCache[selectedMedicine]) {
        setSelectedMedicineData(sessionCache[selectedMedicine])
        return
      }

      setIsLoadingDetails(true)
      try {
        const info = await getMedicineInfo(selectedMedicine)
        setSelectedMedicineData(info)
        // Save to session cache
        setSessionCache(prev => ({ ...prev, [selectedMedicine]: info }))
      } catch (error) {
        console.error("Error fetching medicine info:", error)
      } finally {
        setIsLoadingDetails(false)
      }
    }

    fetchInfo()
  }, [selectedMedicine, sessionCache])

  useEffect(() => {
    let mounted = true

    const initCamera = async () => {
      try {
        const constraints = {
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)

        if (!mounted) {
          mediaStream.getTracks().forEach((track) => track.stop())
          return
        }

        setStream(mediaStream)
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
          videoRef.current.play().catch(console.error)
        }
      } catch (error) {
        console.error("Camera Init Error:", error)
      }
    }

    initCamera()

    return () => {
      mounted = false
      if (stream) stream.getTracks().forEach((track) => track.stop())
    }
  }, [])

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return

    setIsProcessing(true)
    
    const video = videoRef.current
    const canvas = canvasRef.current

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      const imageUrl = canvas.toDataURL("image/jpeg", 0.9)
      setCapturedImage(imageUrl)
      video.pause()

      try {
        const medicines = await performOCR(canvas)
        setDetectedMedicines(medicines)
      } catch (e) {
        console.error(e)
      }
    }
    setIsProcessing(false)
  }

  const handleRetake = () => {
    setCapturedImage(null)
    setDetectedMedicines([])
    setSelectedMedicine(null)
    if (videoRef.current) {
      videoRef.current.play().catch(console.error)
    }
  }

  const handleDone = () => {
    if (onScanComplete && capturedImage) {
      onScanComplete(capturedImage, detectedMedicines)
    } else {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black text-white overflow-hidden font-sans">
      
      <div className="relative h-full w-full">
        {capturedImage ? (
          <img src={capturedImage} className="h-full w-full object-cover" alt="Captured" />
        ) : (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="h-full w-full object-cover" 
          />
        )}
        <canvas ref={canvasRef} className="hidden" />

        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60" />

          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-20">
            <div className="bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-mono tracking-wider opacity-80">SYSTEM READY</span>
            </div>
            
            <Button size="icon" variant="ghost" onClick={onClose} className="rounded-full bg-black/20 text-white hover:bg-black/40 pointer-events-auto">
              <X className="h-6 w-6" />
            </Button>
          </div>

          {!capturedImage && !isProcessing && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[80vw] h-[50vh] relative border border-white/20 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                 <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl" />
                 <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl" />
                 <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl" />
                 <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl" />
                 
                 <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-80 animate-[scan_2s_ease-in-out_infinite] shadow-[0_0_20px_var(--primary)]" />
                 
                 <div className="absolute inset-0 flex items-center justify-center opacity-30">
                   <div className="w-10 h-10 border border-white rounded-full flex items-center justify-center">
                     <div className="w-1 h-1 bg-white rounded-full" />
                   </div>
                 </div>
              </div>
              <p className="absolute mt-[55vh] text-white/70 text-sm font-medium tracking-wide animate-pulse">
                ALIGN MEDICINE WITHIN FRAME
              </p>
            </div>
          )}
        </div>

        {isProcessing && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full" />
              <Zap className="h-16 w-16 text-primary animate-bounce relative z-10" />
            </div>
            <h3 className="mt-6 text-2xl font-bold tracking-tighter text-white uppercase">Analyzing</h3>
            <p className="text-primary/80 font-mono text-sm mt-1">AI VISION PROTOCOL INITIATED</p>
          </div>
        )}

        {capturedImage && detectedMedicines.map((m) => (
          <AnnotationMarker key={m.id} medicine={m} onTap={setSelectedMedicine} />
        ))}

        <div className="absolute bottom-0 left-0 right-0 p-8 pb-12 bg-gradient-to-t from-black via-black/80 to-transparent z-40 flex justify-center items-center gap-6">
          {capturedImage ? (
             <>
               <Button onClick={handleRetake} variant="outline" className="h-14 w-14 rounded-full border-white/20 bg-black/40 text-white hover:bg-black/60 hover:scale-110 transition-all p-0">
                  <RotateCcw className="h-6 w-6" />
               </Button>
               <Button onClick={handleDone} className="h-14 px-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-all font-bold text-lg shadow-[0_0_20px_rgba(var(--primary),0.5)]">
                  DONE
               </Button>
             </>
          ) : (
            <button 
              onClick={handleCapture}
              disabled={isProcessing}
              className="group relative flex items-center justify-center"
            >
              <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl group-hover:bg-primary/50 transition-all" />
              <div className="h-20 w-20 rounded-full border-[3px] border-white flex items-center justify-center bg-white/10 backdrop-blur-sm group-hover:scale-110 group-active:scale-95 transition-all duration-300">
                <div className="h-16 w-16 rounded-full bg-white group-hover:bg-primary transition-colors" />
              </div>
            </button>
          )}
        </div>
      </div>

      <InfoBottomSheet
        medicineName={selectedMedicine}
        data={selectedMedicineData}
        isLoading={isLoadingDetails}
        isOpen={!!selectedMedicine}
        onClose={() => setSelectedMedicine(null)}
      />

      <style jsx>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  )
}