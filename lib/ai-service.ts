"use server"

import { GoogleGenerativeAI } from "@google/generative-ai"
import type { MedicineInfo } from "./types"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "")

// Helper: Try multiple models until one works
async function generateWithFallback(
  prompt: string, 
  imageBase64?: string
): Promise<string> {
  // UPDATED: Use specific version tags (001/latest) which are often more reliable than generic aliases
  const modelsToTry = [
    "gemini-2.5-flash",
    "gemini-2.0-flash-lite",
    "gemini-2.5-pro",
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash-001",
    "gemini-1.5-pro",
    "gemini-1.5-pro-latest",
    "gemini-1.5-pro-001",
    "gemini-pro",         // Fallback for text
    "gemini-pro-vision"   // Fallback for images
  ]
  
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
      console.warn(`[AI] Skip ${modelName}:`, error.message?.split('[')[0] || "Unknown Error")
      lastError = error;
      continue;
    }
  }
  
  throw lastError || new Error("All AI models failed.")
}

// --- 1. SEARCH SERVICE ---
export async function getMedicineInfo(medicineName: string): Promise<MedicineInfo> {
  const cleanName = medicineName.trim()

  try {
    const prompt = `
      Pharmacist Role. Target: "${cleanName}".
      Task: Provide medical details.
      
      Rules:
      1. If "${cleanName}" is a BRAND name, provide details for the active ingredient.
      2. If it's a GENERIC name, provide details for that.
      3. If specific details are unknown, provide general class info.
      
      Return ONLY valid JSON:
      {
        "verified": boolean,
        "genericName": "string",
        "brandNames": ["string"],
        "drugClass": "string",
        "description": "2-3 sentences.",
        "commonUses": "Concise list",
        "dosageInfo": "General guideline",
        "sideEffects": { "common": [], "serious": [] },
        "warnings": [],
        "interactions": [],
        "generalSafety": "string"
      }
    `

    const text = await generateWithFallback(prompt)
    const jsonStr = text.replace(/```json|```/g, "").trim()
    
    let data;
    try {
        data = JSON.parse(jsonStr)
    } catch (e) {
        throw new Error("Invalid JSON from AI")
    }

    // Soft Validation: If description is garbage, return a fallback instead of crashing
    if (!data.verified && (!data.description || data.description.length < 10)) {
       throw new Error("Insufficient Data")
    }

    return {
      ...data,
      sources: [
        `https://www.drugs.com/search.php?searchterm=${encodeURIComponent(cleanName)}`,
        `https://www.google.com/search?q=${encodeURIComponent(cleanName + " medicine")}`
      ]
    }

  } catch (error) {
    console.error("[AI] Search Failed:", error)
    // GRACEFUL FALLBACK: Never show a blank screen
    return {
      verified: false,
      genericName: cleanName,
      brandNames: [],
      drugClass: "Unidentified",
      description: "We could not verify this medicine in our database. It might be a batch number, manufacturer name, or obscured text.",
      commonUses: "Unknown",
      dosageInfo: "Consult Doctor",
      sideEffects: { common: [], serious: [] },
      warnings: ["Verify this is a valid medicine name"],
      interactions: [],
      generalSafety: "Do not take unverified medication.",
      sources: [`https://www.google.com/search?q=${encodeURIComponent(cleanName)}`]
    }
  }
}

// --- 2. VISION SERVICE (Optimized Text Mode) ---
export async function analyzeImageForMedicines(imageBase64: string): Promise<string[]> {
  try {
    const base64Data = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64
    
    // Simple prompt for Token Efficiency & Speed
    const prompt = `
      Identify the SINGLE MAIN BRAND NAME of the medicine in this image.
      - Ignore generic terms (Tablets, USP, etc).
      - Ignore manufacturer names.
      - If multiple medicines are visible, list them separated by commas.
      
      Return ONLY the name(s). If unreadable, return "NONE".
    `

    const responseText = await generateWithFallback(prompt, base64Data)
    
    const raw = responseText.trim()
    if (raw.toUpperCase().includes("NONE") && raw.length < 5) return []
    
    // Clean up results
    return raw.split(",")
      .map(s => s.trim().replace(/['"`]/g, '')) // Remove quotes
      .filter(s => s.length > 2)

  } catch (error) {
    console.error("[AI] Vision Failed:", error)
    return [] // Return empty array to trigger Tesseract fallback
  }
}