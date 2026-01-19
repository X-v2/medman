import type { DetectedMedicine } from "./types"
import { analyzeImageForMedicines } from "./ai-service"
import Tesseract from "tesseract.js"

export async function performOCR(canvas: HTMLCanvasElement): Promise<DetectedMedicine[]> {
  try {
    console.log("Starting Scan...")
    
    // Quality 0.8 is a good balance for AI and Tesseract
    const imageBase64 = canvas.toDataURL("image/jpeg", 0.8)
    const detectedMedicines: DetectedMedicine[] = []
    const seen = new Set<string>()

    // Common non-medicine text found on labels
    const ignoreList = [
      "TABLET", "TABLETS", "CAPSULE", "CAPSULES", "INJECTION", "SYRUP", "SUSPENSION",
      "MG", "GM", "ML", "MCG", "USP", "IP", "BP", 
      "EXP", "MFG", "BATCH", "MRP", "PRICE", "DAATE", "DATE",
      "PVT", "LTD", "LIMITED", "PRIVATE", "PHARMA", "PHARMACEUTICALS", "HEALTHCARE", "LABS",
      "INDIA", "MADE", "IN", "MARKETED", "MANUFACTURED", "BY",
      "KEEP", "STORE", "DRY", "PLACE", "REACH", "CHILDREN", "WARNING", "SCHEDULE",
      "RX", "DR", "TM", "R", "NET", "CONTENT", "COUNT", "OF"
    ]

    // 1. Try AI First (Fastest/Smartest)
    let rawNames: string[] = []
    try {
      rawNames = await analyzeImageForMedicines(imageBase64)
    } catch (aiError) {
      console.warn("AI Scan Failed, switching to Tesseract:", aiError)
    }

    // 2. Fallback to Tesseract (Offline/Robust)
    if (rawNames.length === 0) {
      console.log("AI returned no results. Running Tesseract OCR...")
      try {
        const { data: { text } } = await Tesseract.recognize(canvas, 'eng')
        
        // BETTER STRATEGY: Process entire lines, not just words
        const lines = text.split('\n')
        
        for (const line of lines) {
           const cleanLine = line.trim().replace(/[^a-zA-Z0-9\s]/g, "") // Remove special chars
           if (cleanLine.length < 4) continue

           const upperLine = cleanLine.toUpperCase()
           
           // Skip line if it contains noise words
           const containsNoise = ignoreList.some(badWord => upperLine.includes(badWord))
           if (containsNoise) continue

           // Heuristic: If line is mostly capital letters or Title Case, it might be a brand name
           // e.g. "Dolo 650" or "Ascoril LS"
           if (/^[A-Z0-9\s]+$/.test(cleanLine) || /^[A-Z][a-z]+/.test(cleanLine)) {
              rawNames.push(cleanLine)
           }
        }
      } catch (ocrError) {
        console.error("Tesseract Failed:", ocrError)
      }
    }

    // 3. Process & Deduplicate Results
    // Limit to top 3 results to prevent UI clutter
    const maxResults = 3;
    let count = 0;

    rawNames.forEach((name) => {
      if (count >= maxResults) return;

      // Final cleanup
      let cleanName = name.replace(/[\*\"]/g, "").trim()
      
      // Remove trailing numbers if they are just dosage (optional, but keeps names clean)
      // cleanName = cleanName.replace(/\s\d+((mg)|(ml))?$/i, "")

      const upperName = cleanName.toUpperCase()

      // Exact block list check
      if (ignoreList.includes(upperName)) return;

      // Check if we already have this name (case-insensitive)
      if (cleanName.length > 2 && !seen.has(upperName)) {
        seen.add(upperName)
        
        detectedMedicines.push({
          id: `med-${Date.now()}-${count}`,
          name: cleanName,
          // Stagger position for better visibility
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