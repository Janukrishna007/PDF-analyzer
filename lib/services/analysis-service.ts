import { AnalysisResult } from "@/types/analysis"

export class AnalysisService {
  private static baseUrl = "/api/pdf-qa"

  static async analyzePDF(file: File, question: string, model: string): Promise<AnalysisResult> {
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("question", question)
      formData.append("model", model)

      const response = await fetch(this.baseUrl, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to analyze PDF")
      }

      return await response.json()
    } catch (error) {
      console.error("Error analyzing PDF:", error)
      throw error
    }
  }

  static async getHistory(limit: number = 50, offset: number = 0): Promise<{
    data: AnalysisResult[]
    total: number
    limit: number
    offset: number
  }> {
    try {
      const response = await fetch(
        `${this.baseUrl}?limit=${limit}&offset=${offset}`,
        {
          method: "GET",
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to fetch history")
      }

      return await response.json()
    } catch (error) {
      console.error("Error fetching history:", error)
      throw error
    }
  }

  static async deleteHistoryItem(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete history item")
      }
    } catch (error) {
      console.error("Error deleting history item:", error)
      throw error
    }
  }

  static async clearHistory(): Promise<void> {
    try {
      const response = await fetch(this.baseUrl, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to clear history")
      }
    } catch (error) {
      console.error("Error clearing history:", error)
      throw error
    }
  }
} 