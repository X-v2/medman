"use client"

import { useEffect, useRef, useState } from "react"
import { X, CameraIcon, Scan, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AnnotationMarker } from "@/components/annotation-marker"
import { InfoBottomSheet } from "@/components/info-bottom-sheet"
import { performOCR } from "@/lib/ocr-service"
import type { DetectedMedicine } from "@/lib/types"

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
  const [selectedMedicine, setSelectedMedicine] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStage, setProcessingStage] = useState<string>("")

  useEffect(() => {
    let mounted = true

    const initCamera = async () => {
      try {
        const constraints = {
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
            // Standard HD resolution is usually safer for aspect ratios
            width: { ideal: 1280 },
            height: { ideal: 720 },
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
          videoRef.current.setAttribute("playsinline", "true")
          videoRef.current.play().catch(console.error)
        }
      } catch (error) {
        console.error("Camera Init Error:", error)
        alert("Camera failed. Please refresh and allow permissions.")
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
    setProcessingStage("Identifying Medicine...")

    const video = videoRef.current
    const canvas = canvasRef.current

    // Set max dimension to 1024px to save memory/bandwidth
    const scale = Math.min(1024 / video.videoWidth, 1024 / video.videoHeight, 1)
    canvas.width = video.videoWidth * scale
    canvas.height = video.videoHeight * scale

    const ctx = canvas.getContext("2d")
    if (ctx) {
      // Draw scaled image
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      const imageUrl = canvas.toDataURL("image/jpeg", 0.8)
      setCapturedImage(imageUrl)

      // Pause stream instead of stopping tracks immediately (faster retake)
      video.pause()

      try {
        const medicines = await performOCR(canvas)
        setDetectedMedicines(medicines)
        if (medicines.length === 0) {
          alert("No medicines found. Try getting closer to the label.")
        }
      } catch (e) {
        console.error(e)
        alert("An error occurred during scanning.")
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
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      {/* 1. Scanning Animation Styles */}
      <style jsx>{`
        @keyframes scan-line {
          0% { top: 0%; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan {
          animation: scan-line 2.5s linear infinite;
        }
      `}</style>

      {/* Camera Feed / Captured Image */}
      {capturedImage ? (
        // Using object-contain here too ensures the captured view matches the preview exactly
        <img src={capturedImage} className="h-full w-full object-contain" alt="captured" />
      ) : (
        // 2. Fixed Overfitting: 'object-contain' prevents the video from zooming/cropping
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="h-full w-full object-contain" 
        />
      )}
      <canvas ref={canvasRef} className="hidden" />

      {/* 3. Scanning Animation Overlay (Only when camera is live) */}
      {!capturedImage && !isProcessing && (
        <div className="absolute inset-0 pointer-events-none z-10">
            {/* The Laser Line */}
            <div className="absolute left-0 right-0 h-0.5 bg-primary shadow-[0_0_15px_rgba(var(--primary),0.8)] animate-scan">
                 <div className="absolute right-0 -top-1 h-3 w-3 bg-primary/50 rounded-full blur-[2px]" />
            </div>
            {/* Optional: Corner guides for "scanner" feel */}
            <div className="absolute top-10 left-10 w-16 h-16 border-t-2 border-l-2 border-primary/50 rounded-tl-xl" />
            <div className="absolute top-10 right-10 w-16 h-16 border-t-2 border-r-2 border-primary/50 rounded-tr-xl" />
            <div className="absolute bottom-32 left-10 w-16 h-16 border-b-2 border-l-2 border-primary/50 rounded-bl-xl" />
            <div className="absolute bottom-32 right-10 w-16 h-16 border-b-2 border-r-2 border-primary/50 rounded-br-xl" />
        </div>
      )}

      {/* 4. Loading Screen Overlay */}
      {isProcessing && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="relative">
             <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
             <Scan className="h-16 w-16 text-primary animate-pulse relative z-10" />
           </div>
           <h3 className="mt-6 text-xl font-medium text-white tracking-wide">{processingStage}</h3>
           <p className="text-white/60 text-sm mt-2">Please hold on...</p>
        </div>
      )}

      {/* Close Button */}
      {!isProcessing && (
        <div className="absolute top-4 right-4 z-20">
          <Button size="icon" variant="ghost" onClick={onClose} className="rounded-full bg-black/20 text-white hover:bg-black/40">
            <X className="h-6 w-6" />
          </Button>
        </div>
      )}

      {/* Markers */}
      {capturedImage && detectedMedicines.map((m) => (
        <AnnotationMarker key={m.id} medicine={m} onTap={setSelectedMedicine} />
      ))}

      {/* Controls */}
      <div className="absolute bottom-0 w-full p-6 bg-linear-to-t from-black/90 via-black/50 to-transparent z-20 flex justify-center gap-4 pb-12">
        {capturedImage ? (
           <>
             <Button type="button" onClick={handleRetake} variant="outline" className="h-12 px-8 rounded-full border-white/20 bg-white/10 text-white hover:bg-white/20">Retake</Button>
             <Button type="button" onClick={handleDone} className="h-12 px-8 rounded-full">Done</Button>
           </>
        ) : (
          <Button 
            type="button"
            onClick={handleCapture} 
            disabled={isProcessing}
            className="h-20 w-20 rounded-full bg-white border-4 border-gray-300 hover:bg-gray-100 transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
          >
             <CameraIcon className="h-8 w-8 text-black" />
          </Button>
        )}
      </div>

      <InfoBottomSheet
        medicineName={selectedMedicine}
        isOpen={!!selectedMedicine}
        onClose={() => setSelectedMedicine(null)}
      />
    </div>
  )
}