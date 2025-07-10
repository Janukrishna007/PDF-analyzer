import { AnalysisResult } from "@/types/analysis"
import { prisma } from "@/lib/db"

export class DatabaseService {
  static async createAnalysis(result: AnalysisResult) {
    try {
      const analysis = await prisma.analysis.create({
        data: {
          question: result.question,
          answer: result.answer,
          sourceChunks: JSON.stringify(result.sourceChunks),
          success: result.success,
          message: result.message,
          processingTime: result.processingTime,
          model: result.model,
          confidence: result.confidence,
          fileName: result.fileName,
          userId: result.userId,
          timestamp: result.timestamp,
        },
      })
      return analysis
    } catch (error) {
      console.error("Error creating analysis:", error)
      throw error
    }
  }

  static async getAnalyses(limit: number = 50, offset: number = 0, userId?: string) {
    try {
      const where = userId ? { userId } : {}
      const [analyses, total] = await Promise.all([
        prisma.analysis.findMany({
          where,
          orderBy: { timestamp: "desc" },
          take: limit,
          skip: offset,
        }),
        prisma.analysis.count({ where }),
      ])

      return {
        data: analyses.map(analysis => ({
          ...analysis,
          sourceChunks: JSON.parse(analysis.sourceChunks),
        })),
        total,
        limit,
        offset,
      }
    } catch (error) {
      console.error("Error fetching analyses:", error)
      throw error
    }
  }

  static async deleteAnalysis(id: string) {
    try {
      await prisma.analysis.delete({
        where: { id },
      })
    } catch (error) {
      console.error("Error deleting analysis:", error)
      throw error
    }
  }

  static async deleteAllAnalyses(userId?: string) {
    try {
      const where = userId ? { userId } : {}
      await prisma.analysis.deleteMany({ where })
    } catch (error) {
      console.error("Error deleting all analyses:", error)
      throw error
    }
  }

  static async getAnalysisStats(userId?: string) {
    try {
      const where = userId ? { userId } : {}
      const analyses = await prisma.analysis.findMany({
        where,
        select: {
          success: true,
          processingTime: true,
          fileName: true,
        },
      })

      const totalAnalyses = analyses.length
      const successfulAnalyses = analyses.filter(a => a.success).length
      const totalProcessingTime = analyses.reduce((acc, a) => acc + a.processingTime, 0)
      const uniqueDocuments = new Set(analyses.map(a => a.fileName)).size

      return {
        totalAnalyses,
        successRate: totalAnalyses > 0 ? (successfulAnalyses / totalAnalyses) * 100 : 0,
        avgProcessingTime: totalAnalyses > 0 ? totalProcessingTime / totalAnalyses : 0,
        totalDocuments: uniqueDocuments,
      }
    } catch (error) {
      console.error("Error getting analysis stats:", error)
      throw error
    }
  }
} 