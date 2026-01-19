import type { DetectedMedicine } from "./types"
import { analyzeImageForMedicines } from "./ai-service"
import Tesseract from "tesseract.js"

export async function performOCR(canvas: HTMLCanvasElement): Promise<DetectedMedicine[]> {
  try {
    console.log("Starting Scan...")
    
    // 1. Prepare Image
    // Quality 0.8 is a good balance for AI and Tesseract
    const imageBase64 = canvas.toDataURL("image/jpeg", 0.8)
    const detectedMedicines: DetectedMedicine[] = []
    const seen = new Set<string>()

    // 2. Try AI First (Fastest/Smartest)
    let rawNames: string[] = []
    try {
      rawNames = await analyzeImageForMedicines(imageBase64)
    } catch (aiError) {
      console.warn("AI Scan Failed, switching to Tesseract:", aiError)
    }

    // 3. Fallback to Tesseract (Offline/Robust) if AI failed or found nothing
    if (rawNames.length === 0) {
      console.log("AI returned no results. Running Tesseract OCR...")
      try {
        const { data: { text } } = await Tesseract.recognize(canvas, 'eng', {
           logger: m => console.log(m) // Optional: logs progress
        })
        
        // Simple heuristic to extract potential medicine names (Capitalized words, >3 chars)
        // This acts as a safety net when AI is down
        const lines = text.split('\n')
        lines.forEach(line => {
          const words = line.trim().split(' ')
          words.forEach(word => {
             // Basic filter: All caps or Title Case, longer than 4 chars, no numbers
             if (word.length > 4 && /^[A-Z][a-zA-Z]+$/.test(word) && !/\d/.test(word)) {
                rawNames.push(word)
             }
          })
        })
      } catch (ocrError) {
        console.error("Tesseract Failed:", ocrError)
      }
    }

    // 4. Process Results
    rawNames.forEach((name, i) => {
      const cleanName = name.replace(/[\*\"]/g, "").trim()
      
      // Filter out common garbage OCR words
      const ignoreList = ["TABLET", "CAPSULE", "MG", "EXP", "MFG", "BATCH", "PRICE", "INDIA"]
      
      if (
        cleanName.length > 3 && 
        !seen.has(cleanName.toLowerCase()) && 
        !ignoreList.includes(cleanName.toUpperCase())
      ) {
        seen.add(cleanName.toLowerCase())
        
        detectedMedicines.push({
          id: `med-${Date.now()}-${i}`,
          name: cleanName,
          // Center the marker since we don't have bounding boxes for text-only mode
          position: { x: 50, y: 50 + (i * 10) }, 
          confidence: 0.85
        })
      }
    })

    return detectedMedicines
  } catch (error) {
    console.error("Critical Scan Error:", error)
    return []
  }
}