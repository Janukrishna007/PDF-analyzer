import { type NextRequest, NextResponse } from "next/server"
import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"
import { promises as fs } from "fs"
import path from "path"
import { v4 as uuidv4 } from "uuid"
import { DatabaseService } from "@/lib/services/db-service"
import { AIService } from "@/lib/services/ai-service"
import { AnalysisResult } from "@/types/analysis"

export const maxDuration = 60

interface ProcessingResult {
  success: boolean
  answer?: string
  sourceChunks?: string[]
  error?: string
  message: string
  model?: string
  confidence?: number
}

// In-memory cache for development. In production, use a proper database
let analysisHistory: AnalysisResult[] = []

// Alternative PDF text extraction using browser APIs
async function extractTextFromPDFBuffer(buffer: ArrayBuffer): Promise<string> {
  try {
    // Convert ArrayBuffer to Uint8Array
    const uint8Array = new Uint8Array(buffer)

    // Simple PDF text extraction using regular expressions
    // This is a basic approach - for production, consider using a proper PDF parser
    const text = new TextDecoder().decode(uint8Array)

    // Extract text between stream and endstream markers
    const streamRegex = /stream\s*([\s\S]*?)\s*endstream/g
    const textRegex = /$$(.*?)$$/g
    const tjRegex = /\[(.*?)\]/g

    let extractedText = ""
    let match

    // Try to extract text from PDF streams
    while ((match = streamRegex.exec(text)) !== null) {
      const streamContent = match[1]

      // Extract text from parentheses (simple text objects)
      let textMatch
      while ((textMatch = textRegex.exec(streamContent)) !== null) {
        extractedText += textMatch[1] + " "
      }

      // Extract text from arrays (TJ operators)
      while ((textMatch = tjRegex.exec(streamContent)) !== null) {
        const arrayContent = textMatch[1]
        const textParts = arrayContent.match(/$$(.*?)$$/g)
        if (textParts) {
          textParts.forEach((part) => {
            extractedText += part.replace(/[()]/g, "") + " "
          })
        }
      }
    }

    // Clean up the extracted text
    extractedText = extractedText
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "\r")
      .replace(/\\t/g, "\t")
      .replace(/\\\\/g, "\\")
      .replace(/\s+/g, " ")
      .trim()

    if (!extractedText || extractedText.length < 10) {
      // Fallback: try to extract any readable text from the PDF
      const fallbackText = text
        .replace(/[^\x20-\x7E\n\r\t]/g, " ") // Keep only printable ASCII
        .replace(/\s+/g, " ")
        .trim()

      if (fallbackText.length > 50) {
        extractedText = fallbackText.substring(0, 2000) // Limit to first 2000 chars
      }
    }

    if (!extractedText || extractedText.length < 10) {
      throw new Error("Could not extract readable text from PDF. The PDF might be image-based or encrypted.")
    }

    return extractedText
  } catch (error) {
    console.error("Error extracting text from PDF:", error)
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

// Enhanced PDF text extraction with multiple methods
async function extractTextFromPDF(buffer: ArrayBuffer): Promise<string> {
  try {
    // Method 1: Try basic extraction
    let extractedText = await extractTextFromPDFBuffer(buffer)

    if (extractedText && extractedText.length > 50) {
      return extractedText
    }

    // Method 2: Try alternative extraction for different PDF formats
    const uint8Array = new Uint8Array(buffer)
    const pdfString = new TextDecoder("latin1").decode(uint8Array)

    // Look for text objects in PDF
    const textObjects = []
    const btRegex = /BT\s*([\s\S]*?)\s*ET/g
    let match

    while ((match = btRegex.exec(pdfString)) !== null) {
      const textBlock = match[1]

      // Extract text from Tj and TJ operators
      const tjMatches = textBlock.match(/$$(.*?)$$\s*Tj/g)
      if (tjMatches) {
        tjMatches.forEach((tjMatch) => {
          const text = tjMatch.match(/$$(.*?)$$/)?.[1]
          if (text) {
            textObjects.push(text)
          }
        })
      }

      // Extract text from show text operators
      const showTextMatches = textBlock.match(/\[(.*?)\]\s*TJ/g)
      if (showTextMatches) {
        showTextMatches.forEach((showMatch) => {
          const arrayContent = showMatch.match(/\[(.*?)\]/)?.[1]
          if (arrayContent) {
            const textParts = arrayContent.match(/$$(.*?)$$/g)
            if (textParts) {
              textParts.forEach((part) => {
                textObjects.push(part.replace(/[()]/g, ""))
              })
            }
          }
        })
      }
    }

    if (textObjects.length > 0) {
      extractedText = textObjects.join(" ").replace(/\s+/g, " ").trim()
    }

    if (!extractedText || extractedText.length < 10) {
      throw new Error("No readable text found in PDF. This might be a scanned document or image-based PDF.")
    }

    return extractedText
  } catch (error) {
    console.error("Error extracting text from PDF:", error)
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

function chunkText(text: string, chunkSize = 1200, overlap = 200): string[] {
  if (!text || text.trim().length === 0) {
    return []
  }

  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0)
  const chunks: string[] = []
  let currentChunk = ""

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim()
    if (!trimmedSentence) continue

    if (currentChunk.length + trimmedSentence.length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim())

      const words = currentChunk.split(" ")
      const overlapWords = words.slice(-Math.floor(overlap / 10))
      currentChunk = overlapWords.join(" ") + " " + trimmedSentence
    } else {
      currentChunk += (currentChunk ? ". " : "") + trimmedSentence
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim())
  }

  if (chunks.length === 0 && text.length > 0) {
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize))
    }
  }

  return chunks
}

function selectRelevantChunks(chunks: string[], question: string, maxChunks = 3): string[] {
  if (chunks.length === 0) return []

  const questionWords = question
    .toLowerCase()
    .split(/\W+/)
    .filter((word) => word.length > 2)
    .map((word) => word.toLowerCase())

  const scoredChunks = chunks.map((chunk, index) => {
    const chunkWords = chunk.toLowerCase()
    let score = 0

    questionWords.forEach((word) => {
      const regex = new RegExp(`\\b${word}\\b`, "gi")
      const matches = chunk.match(regex)
      if (matches) {
        score += matches.length
      }
    })

    score += (chunks.length - index) * 0.1

    return { chunk, score, index }
  })

  return scoredChunks
    .sort((a, b) => b.score - a.score)
    .slice(0, maxChunks)
    .map((item) => item.chunk)
}

// Free AI Model Integrations
async function generateAnswerWithHuggingFace(question: string, context: string): Promise<string> {
  try {
    // Using Hugging Face Inference API (free tier)
    const response = await fetch("https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY || ""}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: `Context: ${context.substring(0, 1000)}\n\nQuestion: ${question}\n\nAnswer:`,
        parameters: {
          max_length: 500,
          temperature: 0.1,
          do_sample: true,
        },
      }),
    })

    if (!response.ok) {
      throw new Error("Hugging Face API error")
    }

    const data = await response.json()
    return data[0]?.generated_text || "I couldn't generate an answer using the Hugging Face model."
  } catch (error) {
    console.error("Hugging Face error:", error)
    return generateSimpleAnswer(question, context)
  }
}

async function generateAnswerWithOllama(question: string, context: string): Promise<string> {
  try {
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3.2",
        prompt: `Based on the following context, please answer the question concisely and accurately.

Context: ${context}

Question: ${question}

Answer:`,
        stream: false,
        options: {
          temperature: 0.1,
          top_p: 0.9,
          max_tokens: 500,
        },
      }),
    })

    if (!response.ok) {
      throw new Error("Ollama API error")
    }

    const data = await response.json()
    return data.response || "I couldn't generate an answer using the Ollama model."
  } catch (error) {
    console.error("Ollama error:", error)
    return generateSimpleAnswer(question, context)
  }
}

function generateSimpleAnswer(question: string, context: string): string {
  const questionLower = question.toLowerCase()
  const contextSentences = context.split(/[.!?]+/).filter((s) => s.trim().length > 20)

  const questionWords = questionLower.split(/\W+/).filter((word) => word.length > 3)
  const relevantSentences = contextSentences.filter((sentence) => {
    const sentenceLower = sentence.toLowerCase()
    return questionWords.some((word) => sentenceLower.includes(word))
  })

  if (relevantSentences.length > 0) {
    return relevantSentences.slice(0, 3).join(". ").trim() + "."
  }

  return contextSentences.slice(0, 2).join(". ").trim() + "."
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    const question = formData.get("question") as string
    const model = formData.get("model") as string

    if (!file || !question) {
      return NextResponse.json(
        { success: false, error: "File and question are required" },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type || file.type !== "application/pdf") {
      return NextResponse.json(
        { success: false, error: "Only PDF files are allowed" },
        { status: 400 }
      )
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "File size should be less than 10MB" },
        { status: 400 }
      )
    }

    const startTime = Date.now()
    const fileBuffer = Buffer.from(await file.arrayBuffer())

    // Process the PDF using AI service
    const aiResult = await AIService.analyzePDF(fileBuffer, question)

    // Create analysis result
    const result: AnalysisResult = {
      id: uuidv4(),
      answer: aiResult.answer,
      sourceChunks: aiResult.sourceChunks,
      success: true,
      message: "Analysis completed successfully",
      processingTime: Math.round((Date.now() - startTime) / 1000),
      model,
      confidence: aiResult.confidence,
      timestamp: new Date(),
      fileName: file.name,
      question
    }

    // Store in database
    await DatabaseService.createAnalysis(result)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error processing request:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Internal server error" 
      },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")
    const userId = searchParams.get("userId") || undefined
    
    const result = await DatabaseService.getAnalyses(limit, offset, userId)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching history:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    const userId = searchParams.get("userId") || undefined

    if (id) {
      await DatabaseService.deleteAnalysis(id)
    } else {
      await DatabaseService.deleteAllAnalyses(userId)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting history:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
