export interface DetectedMedicine {
  id: string
  name: string
  position: {
    x: number
    y: number
  }
  confidence: number
}

export interface MedicineInfo {
  genericName: string
  brandNames: string[]
  drugClass: string
  description: string
  commonUses: string
  dosageInfo: string
  sideEffects: {
    common: string[]
    serious: string[]
  }
  warnings: string[]
  interactions: string[]
  generalSafety: string
  verified: boolean
  sources: string[]
}

export interface ScanResult {
  id: string
  date: string
  imageUrl: string
  medicines: DetectedMedicine[]
  medicineDetails: Record<string, MedicineInfo>
}
