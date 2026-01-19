"use server"

import { GoogleGenerativeAI } from "@google/generative-ai"
import type { MedicineInfo } from "./types"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "")

// Helper: robust model fallback
async function generateWithFallback(
  prompt: string, 
  imageBase64?: string
): Promise<string> {
  // We use the most standard, production-ready model identifiers
  // 'gemini-1.5-flash' is the current standard for speed/cost
  // 'gemini-1.5-pro' is the fallback for reasoning
    const modelsToTry = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-pro"]  
  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName })
      
      let result;
      if (imageBase64) {
        result = await model.generateContent([
          prompt, 
          { inlineData: { data: imageBase64, mimeType: "image/jpeg" } }
        ])
      } else {
        result = await model.generateContent(prompt)
      }
      
      return result.response.text()
    } catch (error: any) {
      console.warn(`[AI] Error with ${modelName}:`, error.message || error)
      lastError = error;
      continue;
    }
  }
  
  // Throwing specific error for the client to catch
  throw lastError || new Error("All AI models failed.")
}

export async function getMedicineInfo(medicineName: string): Promise<MedicineInfo> {
  const cleanName = medicineName.trim()

  try {
    const prompt = `
      Pharmacist Role. Target: "${cleanName}".
      Return ONLY valid JSON.
      Fields:
      - verified (boolean)
      - genericName (string)
      - brandNames (array)
      - drugClass (string)
      - description (concise string)
      - commonUses (concise string)
      - dosageInfo (concise string)
      - sideEffects (obj: {common:[], serious:[]})
      - warnings (array)
      - interactions (array)
      - generalSafety (concise string)
      
      If uncertain, set "verified": false.
    `

    const text = await generateWithFallback(prompt)
    const jsonStr = text.replace(/```json|```/g, "").trim()
    
    // Safety check for empty response
    if (!jsonStr) throw new Error("Empty AI response")
    
    const data = JSON.parse(jsonStr)

    return {
      ...data,
      sources: [`https://www.drugs.com/search.php?searchterm=${encodeURIComponent(cleanName)}`]
    }

  } catch (error) {
    console.error("[AI] Search Failed:", error)
    return {
      verified: false,
      genericName: cleanName,
      brandNames: [cleanName],
      drugClass: "Unknown",
      description: "Could not retrieve details. Please verify online.",
      commonUses: "Consult Doctor",
      dosageInfo: "Consult Doctor",
      sideEffects: { common: [], serious: [] },
      warnings: [],
      interactions: [],
      generalSafety: "Consult Doctor",
      sources: []
    }
  }
}

export async function analyzeImageForMedicines(imageBase64: string): Promise<string[]> {
  try {
    const base64Data = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64
    
    const prompt = `
      Identify the medicine name from this image.
      Return ONLY the names separated by commas.
      If no medicine text is visible, return "NONE".
    `

    const responseText = await generateWithFallback(prompt, base64Data)
    
    const raw = responseText.trim()
    if (raw.toUpperCase().includes("NONE") && raw.length < 10) return []
    
    return raw.split(",").map(s => s.trim()).filter(s => s.length > 2)

  } catch (error) {
    // We log but don't crash - this allows the OCR fallback in lib/ocr-service.ts to take over
    console.error("[AI] Vision Failed:", error)
    return []
  }
}