import pdfParse from "pdf-parse"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"
import { HuggingFaceInferenceEmbeddings } from "langchain/embeddings/hf"
import { MemoryVectorStore } from "langchain/vectorstores/memory"
import { loadQAStuffChain } from "langchain/chains"
import { HuggingFaceInference } from "langchain/llms/hf"
import { Document } from "langchain/document"

export class AIService {
  // Use pdf-parse to extract text from PDF buffer
  private static async extractTextFromPDF(buffer: Buffer): Promise<string> {
    try {
      const data = await pdfParse(buffer)
      return data.text
    } catch (error) {
      console.error("Error extracting text from PDF:", error)
      throw new Error("Failed to extract text from PDF")
    }
  }

  private static async splitText(text: string): Promise<Document[]> {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    })
    return await splitter.createDocuments([text])
  }

  private static async findRelevantChunks(
    chunks: Document[],
    question: string,
    embeddings: HuggingFaceInferenceEmbeddings
  ): Promise<string[]> {
    const vectorStore = await MemoryVectorStore.fromDocuments(chunks, embeddings)
    const results = await vectorStore.similaritySearch(question, 3)
    return results.map(doc => doc.pageContent)
  }

  static async analyzePDF(
    buffer: Buffer,
    question: string
  ): Promise<{
    answer: string
    sourceChunks: string[]
    confidence: number
  }> {
    try {
      // Initialize Hugging Face models
      const embeddings = new HuggingFaceInferenceEmbeddings({
        model: "sentence-transformers/all-MiniLM-L6-v2",
        apiKey: process.env.HUGGINGFACE_API_KEY,
      })

      const model = new HuggingFaceInference({
        model: "google/flan-t5-base",
        apiKey: process.env.HUGGINGFACE_API_KEY,
        temperature: 0.5,
        maxTokens: 1000,
      })

      // Extract text from PDF using pdf-parse
      const text = await this.extractTextFromPDF(buffer)
      if (!text) {
        throw new Error("No text could be extracted from the PDF")
      }

      // Split text into chunks
      const chunks = await this.splitText(text)

      // Find relevant chunks
      const relevantChunks = await this.findRelevantChunks(chunks, question, embeddings)

      // Generate answer using QA chain
      const chain = loadQAStuffChain(model)
      const response = await chain.call({
        input_documents: relevantChunks.map(chunk => new Document({ pageContent: chunk })),
        question: question,
      })

      return {
        answer: response.text || "Could not generate an answer.",
        sourceChunks: relevantChunks,
        confidence: 0.85, // Mock confidence score
      }
    } catch (error) {
      console.error("Error analyzing PDF:", error)
      throw error
    }
  }
} 