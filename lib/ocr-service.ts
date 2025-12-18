import type { DetectedMedicine } from "./types"
import { analyzeImageForMedicines } from "./ai-service"

export async function performOCR(canvas: HTMLCanvasElement): Promise<DetectedMedicine[]> {
  try {
    console.log("Starting Scan...")
    
    // Compress image (0.5 quality is perfect for text reading)
    const imageBase64 = canvas.toDataURL("image/jpeg", 0.5)

    // Run AI Vision
    const aiAnalysis = await analyzeImageForMedicines(imageBase64)
    console.log("AI Results:", aiAnalysis)

    const detectedMedicines: DetectedMedicine[] = []
    const seen = new Set<string>()

    if (aiAnalysis.medicineCandidates && aiAnalysis.medicineCandidates.length > 0) {
      aiAnalysis.medicineCandidates.forEach((name, i) => {
        // Ensure we only show "real" looking names
        const cleanName = name.trim()
        if (cleanName.length > 2 && !seen.has(cleanName.toLowerCase())) {
          seen.add(cleanName.toLowerCase())
          
          let pos = { x: 50, y: 50 }
          if (aiAnalysis.detectedObjects?.[i]) {
             const obj = aiAnalysis.detectedObjects[i]
             pos = {
                x: obj.boundingBox.x + (obj.boundingBox.width / 2),
                y: obj.boundingBox.y + (obj.boundingBox.height / 2)
             }
          }

          detectedMedicines.push({
            id: `med-${Date.now()}-${i}`,
            name: cleanName,
            position: pos,
            confidence: 0.95
          })
        }
      })
    }

    return detectedMedicines
  } catch (error) {
    console.error("Scan Error:", error)
    return []
  }
}