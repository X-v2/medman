import type { DetectedMedicine } from "./types"
import { analyzeImageForMedicines } from "./ai-service"
import Tesseract from "tesseract.js"

// Helper: Enhance image contrast
function preprocessImage(canvas: HTMLCanvasElement): string {
  const ctx = canvas.getContext("2d")
  if (!ctx) return canvas.toDataURL("image/jpeg", 0.9)

  const width = canvas.width
  const height = canvas.height
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data

  const contrast = 1.2
  const intercept = 128 * (1 - contrast)

  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
    const newColor = gray * contrast + intercept
    data[i] = newColor
    data[i + 1] = newColor
    data[i + 2] = newColor
  }

  const tempCanvas = document.createElement("canvas")
  tempCanvas.width = width
  tempCanvas.height = height
  const tempCtx = tempCanvas.getContext("2d")
  if (tempCtx) {
    tempCtx.putImageData(imageData, 0, 0)
    return tempCanvas.toDataURL("image/jpeg", 0.9)
  }
  return canvas.toDataURL("image/jpeg", 0.9)
}

export async function performOCR(canvas: HTMLCanvasElement): Promise<DetectedMedicine[]> {
  try {
    console.log("Starting Scan...")
    
    const imageBase64 = preprocessImage(canvas)
    const detectedMedicines: DetectedMedicine[] = []
    const seen = new Set<string>()

    const ignoreList = [
      "TABLET", "TABLETS", "CAPSULE", "CAPSULES", "INJECTION", "SYRUP", "SUSPENSION",
      "MG", "GM", "ML", "MCG", "USP", "IP", "BP", 
      "EXP", "MFG", "BATCH", "MRP", "PRICE", "DATE",
      "PVT", "LTD", "LIMITED", "PRIVATE", "PHARMA", "HEALTHCARE", "LABS",
      "INDIA", "MADE", "IN", "MARKETED", "MANUFACTURED", "BY",
      "KEEP", "STORE", "DRY", "PLACE", "REACH", "CHILDREN", "WARNING", "SCHEDULE"
    ]

    // 1. Try AI First
    let rawNames: string[] = []
    try {
      rawNames = await analyzeImageForMedicines(imageBase64)
    } catch (aiError) {
      console.warn("AI Scan Failed:", aiError)
    }

    // 2. Fallback to Tesseract if AI found nothing
    if (rawNames.length === 0) {
      console.log("AI returned no results. Running Tesseract OCR...")
      try {
        const { data: { text } } = await Tesseract.recognize(imageBase64, 'eng')
        
        const lines = text.split('\n')
        for (const line of lines) {
           const cleanLine = line.trim().replace(/[^a-zA-Z0-9\s]/g, "")
           if (cleanLine.length < 3) continue

           const upperLine = cleanLine.toUpperCase()
           if (ignoreList.some(badWord => upperLine.includes(badWord))) continue

           // Heuristic: Mostly letters, not just numbers
           if (cleanLine.length > 3 && !/^\d+$/.test(cleanLine)) {
              rawNames.push(cleanLine)
           }
        }
      } catch (ocrError) {
        console.error("Tesseract Failed:", ocrError)
      }
    }

    // 3. Deduplicate and Format
    let count = 0;
    rawNames.forEach((name) => {
      if (count >= 3) return;

      const cleanName = name.replace(/[\*\"]/g, "").trim()
      const upperName = cleanName.toUpperCase()

      if (ignoreList.includes(upperName)) return;

      if (cleanName.length > 2 && !seen.has(upperName)) {
        seen.add(upperName)
        detectedMedicines.push({
          id: `med-${Date.now()}-${count}`,
          name: cleanName,
          position: { x: 50, y: 40 + (count * 15) }, 
          confidence: 0.9
        })
        count++;
      }
    })

    return detectedMedicines
  } catch (error) {
    console.error("Critical Scan Error:", error)
    return []
  }
}