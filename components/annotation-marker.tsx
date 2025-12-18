"use client"

import type { MouseEvent } from "react"
import { Pill } from "lucide-react"
import type { DetectedMedicine } from "@/lib/types"

interface AnnotationMarkerProps {
  medicine: DetectedMedicine
  onTap: (medicineName: string) => void
}

export function AnnotationMarker({ medicine, onTap }: AnnotationMarkerProps) {
  const handleClick = (e: MouseEvent) => {
    e.stopPropagation()
    onTap(medicine.name)
  }

  return (
    <button
      onClick={handleClick}
      className="group absolute flex items-center gap-2 rounded-full border-2 border-accent bg-accent/90 px-4 py-2 backdrop-blur-sm transition-all hover:scale-105 hover:bg-accent active:scale-95"
      style={{
        left: `${medicine.position.x}%`,
        top: `${medicine.position.y}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      <Pill className="h-4 w-4 text-accent-foreground" />
      <span className="text-sm font-semibold text-accent-foreground">{medicine.name}</span>
      <span className="ml-1 h-2 w-2 animate-pulse rounded-full bg-accent-foreground" />
    </button>
  )
}
