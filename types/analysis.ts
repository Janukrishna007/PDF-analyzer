export interface AnalysisResult {
  id: string
  answer: string
  sourceChunks: string[]
  success: boolean
  message: string
  processingTime: number
  model: string
  confidence: number
  timestamp: Date
  fileName: string
  question: string
  userId?: string
}

export interface AnalysisStats {
  totalAnalyses: number
  successRate: number
  avgProcessingTime: number
  totalDocuments: number
}

export interface AIModel {
  id: string
  name: string
  description: string
  icon: string
  status: "Free" | "Local" | "Premium"
  speed: "Fast" | "Medium" | "Slow"
  accuracy: "Excellent" | "Very Good" | "Good"
}

export interface HistoryFilters {
  search?: string
  model?: string
  startDate?: Date
  endDate?: Date
  sortBy?: "date" | "model" | "confidence"
  sortOrder?: "asc" | "desc"
} 