"use client"

import { useEffect, useRef, useState } from "react"
import { X, CameraIcon, RotateCw, Scan } from "lucide-react"
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
            // Lower resolution slightly to prevent memory crashes on older phones
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
    setProcessingStage("Analyzing...")

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
      {capturedImage ? (
        <img src={capturedImage} className="h-full w-full object-contain" alt="captured" />
      ) : (
        <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
      )}
      <canvas ref={canvasRef} className="hidden" />

      {/* Close Button */}
      <div className="absolute top-4 right-4 z-20">
        <Button size="icon" variant="ghost" onClick={onClose} className="rounded-full bg-black/20 text-white">
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* Markers */}
      {capturedImage && detectedMedicines.map((m) => (
        <AnnotationMarker key={m.id} medicine={m} onTap={setSelectedMedicine} />
      ))}

      {/* Controls */}
      <div className="absolute bottom-0 w-full p-6 bg-linear-to-t from-black/80 to-transparent z-20 flex justify-center gap-4">
        {capturedImage ? (
           <>
             <Button type="button" onClick={handleRetake} variant="outline" className="h-12 px-6">Retake</Button>
             <Button type="button" onClick={handleDone} className="h-12 px-6">Done</Button>
           </>
        ) : (
          <Button 
            type="button"
            onClick={handleCapture} 
            disabled={isProcessing}
            className="h-20 w-20 rounded-full bg-white border-4 border-gray-300 hover:bg-gray-200"
          >
            {isProcessing ? <Scan className="animate-spin text-black" /> : <CameraIcon className="h-8 w-8 text-black" />}
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