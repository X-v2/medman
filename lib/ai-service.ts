"use server"

import { GoogleGenerativeAI } from "@google/generative-ai"
import type { MedicineInfo } from "./types"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "")

// Helper: Try multiple models until one works
async function generateWithFallback(
  prompt: string, 
  imageBase64?: string
): Promise<string> {
  // List of models to try in order of preference
  // 1.5-flash-001 is the specific stable version (most reliable)
  const modelsToTry = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-pro"]
  
  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName })
      
      let result;
      if (imageBase64) {
        // Image Mode
        result = await model.generateContent([
          prompt, 
          { inlineData: { data: imageBase64, mimeType: "image/jpeg" } }
        ])
      } else {
        // Text Only Mode
        result = await model.generateContent(prompt)
      }
      
      return result.response.text()
    } catch (error: any) {
      console.warn(`[AI] Failed with ${modelName}:`, error.message || error)
      lastError = error;
      // If it's a 404 (Model Not Found) or 503 (Overloaded), continue to next model.
      // Otherwise, we might want to stop, but for now we try all.
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
      Act as a medical pharmacist. Provide detailed information for the medicine "${cleanName}".
      Return valid JSON matching this structure exactly (do not use Markdown code blocks):
      {
        "verified": true,
        "genericName": "Generic Name",
        "brandNames": ["Brand 1", "Brand 2"],
        "drugClass": "Class of drug",
        "description": "2-3 sentence summary of what it is.",
        "commonUses": "List of common treatments.",
        "dosageInfo": "General dosage guidelines.",
        "sideEffects": {
          "common": ["Side effect 1", "Side effect 2"],
          "serious": ["Serious effect 1", "Serious effect 2"]
        },
        "warnings": ["Warning 1", "Warning 2"],
        "interactions": ["Interaction 1", "Interaction 2"],
        "generalSafety": "Safety advice summary."
      }
    `

    // Use our new fallback helper
    const text = await generateWithFallback(prompt)
    
    const jsonStr = text.replace(/^```json\s*|```$/g, "").trim()
    const data = JSON.parse(jsonStr)

    return {
      ...data,
      sources: [
        `https://www.google.com/search?q=${encodeURIComponent(cleanName + " medicine")}`,
        `https://www.1mg.com/search/all?name=${encodeURIComponent(cleanName)}`,
        `https://www.drugs.com/search.php?searchterm=${encodeURIComponent(cleanName)}`
      ]
    }

  } catch (error) {
    console.error("[AI] Search Failed:", error)
    return {
      verified: false,
      genericName: cleanName,
      brandNames: [cleanName],
      drugClass: "Unknown",
      description: "Could not retrieve details. Please verify online.",
      commonUses: "Consult a doctor.",
      dosageInfo: "Consult a doctor.",
      sideEffects: { common: [], serious: [] },
      warnings: ["AI Search unavailable"],
      interactions: [],
      generalSafety: "Consult a doctor.",
      sources: [`https://www.google.com/search?q=${encodeURIComponent(cleanName)}`]
    }
  }
}

// --- 2. VISION SERVICE ---
export async function analyzeImageForMedicines(imageBase64: string): Promise<{
  detectedObjects: Array<any>
  extractedText: string[]
  medicineCandidates: string[]
}> {
  try {
    const base64Data = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64
    
    const prompt = `Analyze this image. 
        Task: Identify the FULL MEDICINE NAME (e.g. "Dolo 650", "Augmentin 625").
        Ignore isolated numbers.
        
        Return ONLY JSON:
        {
          "detectedObjects": [{"name": "Bottle", "type": "container", "confidence": 0.9, "boundingBox": {"x":50,"y":50,"width":0,"height":0}}],
          "extractedText": ["visible text"],
          "medicineCandidates": ["Exact Name Found"]
        }`

    // Use our new fallback helper
    const responseText = await generateWithFallback(prompt, base64Data)

    const cleaned = responseText.trim().replace(/^```json\s*|```$/g, "").replace(/^\s*|\s*$/g, "")
    return JSON.parse(cleaned)

  } catch (error) {
    console.error("[AI] Vision Failed:", error)
    return { detectedObjects: [], extractedText: [], medicineCandidates: [] }
  }
}