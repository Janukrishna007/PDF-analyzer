"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Upload,
  MessageCircle,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  Brain,
  Zap,
  Target,
  Sparkles,
  Download,
  Eye,
  Settings,
  Clock,
  BarChart3,
  TrendingUp,
  Activity,
  Database,
  Cpu,
  HardDrive,
  Wifi,
  Menu,
  X,
  History,
  HelpCircle,
  User,
  LogOut,
  Search,
  Share2,
  Copy,
  Trash2,
  Bell,
} from "lucide-react"
import { AnalysisService } from "@/lib/services/analysis-service"
import { AnalysisResult, AnalysisStats, AIModel } from "@/types/analysis"

interface DashboardStats {
  totalAnalyses: number
  successRate: number
  avgProcessingTime: number
  totalDocuments: number
}

export default function PDFQADashboard() {
  // Core state
  const [file, setFile] = useState<File | null>(null)
  const [question, setQuestion] = useState("")
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState("")
  const [processingStep, setProcessingStep] = useState("")
  const [selectedModel, setSelectedModel] = useState("huggingface")

  // Dashboard state
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState("analyze")
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisResult[]>([])
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalAnalyses: 0,
    successRate: 0,
    avgProcessingTime: 0,
    totalDocuments: 0,
  })
  const [darkMode, setDarkMode] = useState(false)
  const [autoSave, setAutoSave] = useState(true)
  const [isHistoryLoading, setIsHistoryLoading] = useState(true)
  const [historyError, setHistoryError] = useState("")
  const [deleteInProgress, setDeleteInProgress] = useState<string | null>(null)
  const [clearInProgress, setClearInProgress] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const aiModels = [
    {
      id: "huggingface",
      name: "Hugging Face",
      description: "Free transformer models",
      icon: "🤗",
      status: "Free",
      speed: "Medium",
      accuracy: "Good",
    },
    {
      id: "ollama",
      name: "Ollama",
      description: "Local AI models",
      icon: "🦙",
      status: "Local",
      speed: "Fast",
      accuracy: "Very Good",
    },
    {
      id: "openai",
      name: "OpenAI",
      description: "GPT-3.5 Turbo",
      icon: "🧠",
      status: "Premium",
      speed: "Fast",
      accuracy: "Excellent",
    },
  ]

  const exampleQuestions = [
    "What is the main topic of this document?",
    "Can you provide a comprehensive summary?",
    "What are the key findings and conclusions?",
    "Who are the main authors or contributors?",
    "What methodology was used in this research?",
    "What are the primary recommendations?",
    "What are the limitations mentioned?",
    "What future work is suggested?",
  ]

  const sidebarItems = [
    { id: "analyze", label: "Analyze", icon: Brain, active: true },
    { id: "history", label: "History", icon: History, active: false },
    { id: "dashboard", label: "Dashboard", icon: BarChart3, active: false },
    { id: "settings", label: "Settings", icon: Settings, active: false },
  ]

  // Load data from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem("pdfqa-history")
    const savedStats = localStorage.getItem("pdfqa-stats")
    const savedDarkMode = localStorage.getItem("pdfqa-darkmode")

    if (savedHistory) {
      try {
        const history = JSON.parse(savedHistory)
        setAnalysisHistory(history)
      } catch (e) {
        console.error("Error loading history:", e)
      }
    }

    if (savedStats) {
      try {
        const stats = JSON.parse(savedStats)
        setDashboardStats(stats)
      } catch (e) {
        console.error("Error loading stats:", e)
      }
    }

    if (savedDarkMode) {
      setDarkMode(savedDarkMode === "true")
    }
  }, [])

  // Save to localStorage when data changes
  useEffect(() => {
    if (autoSave && analysisHistory.length > 0) {
      localStorage.setItem("pdfqa-history", JSON.stringify(analysisHistory))
    }
  }, [analysisHistory, autoSave])

  useEffect(() => {
    if (autoSave) {
      localStorage.setItem("pdfqa-stats", JSON.stringify(dashboardStats))
    }
  }, [dashboardStats, autoSave])

  useEffect(() => {
    localStorage.setItem("pdfqa-darkmode", darkMode.toString())
    if (darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [darkMode])

  // Load history and stats
  useEffect(() => {
    const loadHistory = async () => {
      try {
        setIsHistoryLoading(true)
        setHistoryError("")
        const { data } = await AnalysisService.getHistory()
        setAnalysisHistory(data)
        
        // Calculate stats from history
        const stats: AnalysisStats = {
          totalAnalyses: data.length,
          successRate: data.filter(item => item.success).length / data.length * 100,
          avgProcessingTime: data.reduce((acc, item) => acc + (item.processingTime || 0), 0) / data.length,
          totalDocuments: new Set(data.map(item => item.fileName)).size
        }
        
        setDashboardStats(stats)
      } catch (error) {
        console.error("Error loading history:", error)
        setHistoryError("Failed to load analysis history. Please try again later.")
      } finally {
        setIsHistoryLoading(false)
      }
    }

    loadHistory()
  }, [])

  // Handle file upload errors
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("")
    const selectedFile = e.target.files?.[0]
    
    if (!selectedFile) {
      return
    }

    if (selectedFile.type !== "application/pdf") {
      setError("Please select a valid PDF file")
      setFile(null)
      return
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File size should be less than 10MB")
      setFile(null)
      return
    }

    setFile(selectedFile)
    setResult(null)
  }

  // Handle file drop with error handling
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setError("")
    
    const droppedFile = e.dataTransfer.files[0]
    if (!droppedFile) {
      return
    }

    if (droppedFile.type !== "application/pdf") {
      setError("Please drop a valid PDF file")
      return
    }

    if (droppedFile.size > 10 * 1024 * 1024) {
      setError("File size should be less than 10MB")
      return
    }

    setFile(droppedFile)
    setResult(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const simulateProgress = () => {
    const steps = [
      { progress: 15, step: "Uploading PDF file..." },
      { progress: 35, step: "Extracting text content..." },
      { progress: 55, step: "Processing text chunks..." },
      { progress: 75, step: "Analyzing with AI model..." },
      { progress: 90, step: "Generating response..." },
      { progress: 100, step: "Complete!" },
    ]

    let currentStep = 0
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setProgress(steps[currentStep].progress)
        setProcessingStep(steps[currentStep].step)
        currentStep++
      } else {
        clearInterval(interval)
      }
    }, 800)

    return interval
  }

  const updateStats = (newResult: AnalysisResult) => {
    setDashboardStats((prev) => ({
      totalAnalyses: prev.totalAnalyses + 1,
      successRate:
        ((prev.successRate * prev.totalAnalyses + (newResult.success ? 1 : 0)) / (prev.totalAnalyses + 1)) * 100,
      avgProcessingTime:
        (prev.avgProcessingTime * prev.totalAnalyses + (newResult.processingTime || 0)) / (prev.totalAnalyses + 1),
      totalDocuments: prev.totalDocuments + 1,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !question.trim()) {
      setError("Please upload a PDF file and enter a question")
      return
    }

    setLoading(true)
    setError("")
    setResult(null)
    setProgress(0)
    setProcessingStep("")

    const progressInterval = simulateProgress()
    
    try {
      const result = await AnalysisService.analyzePDF(file, question, selectedModel)
      
      if (result.success) {
        setResult(result)
        setAnalysisHistory((prev) => [result, ...prev.slice(0, 49)]) // Keep last 50
        updateStats(result)
      } else {
        setError(result.message || "Failed to process PDF")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error processing your request. Please try again.")
      console.error(err)
    } finally {
      clearInterval(progressInterval)
      setLoading(false)
      setProgress(100)
      setProcessingStep("Complete!")
    }
  }

  const handleExampleClick = (exampleQuestion: string) => {
    setQuestion(exampleQuestion)
  }

  const clearAll = () => {
    setFile(null)
    setQuestion("")
    setResult(null)
    setError("")
    setProgress(0)
    setProcessingStep("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Delete history item with loading state
  const deleteHistoryItem = async (id: string) => {
    try {
      setDeleteInProgress(id)
      await AnalysisService.deleteHistoryItem(id)
      setAnalysisHistory((prev) => prev.filter((item) => item.id !== id))
      
      // Update stats
      const updatedHistory = analysisHistory.filter(item => item.id !== id)
      updateStatsFromHistory(updatedHistory)
    } catch (error) {
      console.error("Error deleting history item:", error)
      setError("Failed to delete history item. Please try again.")
    } finally {
      setDeleteInProgress(null)
    }
  }

  // Clear all history with loading state
  const clearHistory = async () => {
    try {
      setClearInProgress(true)
      await AnalysisService.clearHistory()
      setAnalysisHistory([])
      localStorage.removeItem("pdfqa-history")
      
      // Reset stats
      setDashboardStats({
        totalAnalyses: 0,
        successRate: 0,
        avgProcessingTime: 0,
        totalDocuments: 0,
      })
    } catch (error) {
      console.error("Error clearing history:", error)
      setError("Failed to clear history. Please try again.")
    } finally {
      setClearInProgress(false)
    }
  }

  // Update stats from history
  const updateStatsFromHistory = (history: AnalysisResult[]) => {
    const stats: AnalysisStats = {
      totalAnalyses: history.length,
      successRate: history.filter(item => item.success).length / history.length * 100,
      avgProcessingTime: history.reduce((acc, item) => acc + (item.processingTime || 0), 0) / history.length,
      totalDocuments: new Set(history.map(item => item.fileName)).size
    }
    
    setDashboardStats(stats)
  }

  const exportHistory = () => {
    const dataStr = JSON.stringify(analysisHistory, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)
    const exportFileDefaultName = "pdf-qa-history.json"

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  const renderSidebar = () => (
    <div
      className={`fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0 lg:static lg:inset-0 shadow-lg`}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 rounded-lg blur-sm opacity-20"></div>
              <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg shadow-lg">
                <Brain className="h-6 w-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                PDF Intelligence
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">AI Dashboard</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4">
          <div className="space-y-2">
            {sidebarItems.map((item) => (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "default" : "ghost"}
                className={`w-full justify-start text-sm font-medium transition-all duration-200 ${
                  activeTab === item.id
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
                onClick={() => setActiveTab(item.id)}
              >
                <item.icon className={`mr-3 h-4 w-4 transition-transform duration-200 ${
                  activeTab === item.id ? "transform rotate-6" : ""
                }`} />
                {item.label}
              </Button>
            ))}
          </div>

          <div className="mt-8">
            <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Quick Actions</h3>
            <div className="mt-4 space-y-2">
              <Button variant="ghost" className="w-full justify-start text-sm">
                <HelpCircle className="h-4 w-4 mr-3" />
                Help & Support
              </Button>
              <Button variant="ghost" className="w-full justify-start text-sm">
                <Settings className="h-4 w-4 mr-3" />
                Preferences
              </Button>
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center ring-2 ring-white dark:ring-gray-800">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">User</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Free Plan</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="hover:bg-gray-200 dark:hover:bg-gray-700">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderTopBar = () => (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)} className="lg:hidden">
            <Menu className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent capitalize">
              {activeTab}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {activeTab === "analyze" && "Upload and analyze PDF documents"}
              {activeTab === "history" && "View your analysis history"}
              {activeTab === "dashboard" && "Monitor your usage and performance"}
              {activeTab === "settings" && "Configure your preferences"}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
              <div className="flex items-center space-x-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                <span>Online</span>
              </div>
            </Badge>
            <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0">
              <Cpu className="h-3 w-3 mr-1" />
              {selectedModel}
            </Badge>
          </div>

          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Search className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Bell className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )

  const renderAnalyzeTab = () => (
    <div className="space-y-8">
      {/* AI Model Selection */}
      <Card className="overflow-hidden border-0 bg-white dark:bg-gray-900 shadow-lg">
        <CardHeader className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <CardTitle className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 rounded-lg blur-sm opacity-20"></div>
              <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
                <Brain className="h-5 w-5 text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                AI Model Configuration
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Choose the AI model for document analysis</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-3 gap-4">
            {aiModels.map((model) => (
              <div
                key={model.id}
                className={`group relative overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                  selectedModel === model.id
                    ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-lg"
                    : "border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-blue-50/30 dark:hover:bg-blue-900/10"
                }`}
                onClick={() => setSelectedModel(model.id)}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent dark:from-white/5 pointer-events-none"></div>
                <div className="relative p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl transform transition-transform duration-300 group-hover:scale-110">
                        {model.icon}
                      </span>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{model.name}</h3>
                    </div>
                    <Badge
                      className={
                        model.status === "Free"
                          ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0"
                          : model.status === "Local"
                            ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0"
                            : "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0"
                      }
                    >
                      {model.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{model.description}</p>
                  <div className="flex justify-between text-xs font-medium">
                    <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                      <Zap className="h-3 w-3" />
                      <span>Speed: {model.speed}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                      <Target className="h-3 w-3" />
                      <span>Accuracy: {model.accuracy}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <Card className="overflow-hidden border-0 bg-white dark:bg-gray-900 shadow-lg">
          <CardHeader className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <CardTitle className="flex items-center gap-2">
              <div className="relative">
                <div className="absolute inset-0 bg-purple-500 rounded-lg blur-sm opacity-20"></div>
                <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 p-2 rounded-lg">
                  <Upload className="h-5 w-5 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Document Upload
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Upload your PDF document for analysis</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div
              className={`relative overflow-hidden border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                file
                  ? "border-green-400 bg-green-50/50 dark:bg-green-900/20"
                  : "border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-900/10"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent dark:from-white/5 pointer-events-none"></div>
              <div className="relative">
                {file ? (
                  <div className="space-y-4">
                    <div className="relative mx-auto w-16 h-16">
                      <div className="absolute inset-0 bg-green-500 rounded-full blur-sm opacity-20"></div>
                      <div className="relative bg-gradient-to-r from-green-500 to-emerald-500 rounded-full w-16 h-16 flex items-center justify-center">
                        <CheckCircle className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">{file.name}</h3>
                      <p className="text-green-600 dark:text-green-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      <div className="flex items-center justify-center gap-4 mt-4">
                        <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
                          <FileText className="h-3 w-3 mr-1" />
                          PDF Ready
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="border-green-200 text-green-700 hover:bg-green-50"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Change File
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative mx-auto w-20 h-20">
                      <div className="absolute inset-0 bg-blue-500 rounded-full blur-sm opacity-20"></div>
                      <div className="relative bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full w-20 h-20 flex items-center justify-center">
                        <FileText className="h-10 w-10 text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Drop your PDF here</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">or click to browse from your computer</p>
                      <div className="flex items-center justify-center gap-4 text-sm text-gray-400 dark:text-gray-500">
                        <Badge variant="secondary">Max 10MB</Badge>
                        <Badge variant="secondary">PDF format</Badge>
                        <Badge variant="secondary">Secure upload</Badge>
                      </div>
                    </div>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Select PDF File
                    </Button>
                  </div>
                )}
                <Input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Question Section */}
        <Card className="overflow-hidden border-0 bg-white dark:bg-gray-900 shadow-lg">
          <CardHeader className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <CardTitle className="flex items-center gap-2">
              <div className="relative">
                <div className="absolute inset-0 bg-green-500 rounded-lg blur-sm opacity-20"></div>
                <div className="relative bg-gradient-to-r from-green-600 to-teal-600 p-2 rounded-lg">
                  <MessageCircle className="h-5 w-5 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Question Input
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">What would you like to know about the document?</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="relative">
              <Textarea
                placeholder="Enter your question about the PDF content..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={4}
                className="resize-none bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  <MessageCircle className="h-3 w-3 mr-1" />
                  AI Powered
                </Badge>
              </div>
            </div>

            <Tabs defaultValue="examples" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                <TabsTrigger
                  value="examples"
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm rounded-md transition-all duration-200"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Examples
                </TabsTrigger>
                <TabsTrigger
                  value="templates"
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm rounded-md transition-all duration-200"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Templates
                </TabsTrigger>
              </TabsList>
              <TabsContent value="examples" className="mt-4 space-y-2">
                <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                  {exampleQuestions.slice(0, 4).map((example, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      className="justify-start text-left h-auto p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 group"
                      onClick={() => handleExampleClick(example)}
                    >
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <div className="absolute inset-0 bg-blue-500 rounded-full blur-sm opacity-20 group-hover:opacity-40"></div>
                          <div className="relative h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                            <MessageCircle className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                          </div>
                        </div>
                        <span className="text-sm">{example}</span>
                      </div>
                    </Button>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="templates" className="mt-4 space-y-2">
                <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                  {exampleQuestions.slice(4).map((example, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      className="justify-start text-left h-auto p-2 hover:bg-green-50 dark:hover:bg-green-900/20 group"
                      onClick={() => handleExampleClick(example)}
                    >
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <div className="absolute inset-0 bg-green-500 rounded-full blur-sm opacity-20 group-hover:opacity-40"></div>
                          <div className="relative h-6 w-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                            <FileText className="h-3 w-3 text-green-600 dark:text-green-400" />
                          </div>
                        </div>
                        <span className="text-sm">{example}</span>
                      </div>
                    </Button>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex gap-3">
              <Button
                onClick={handleSubmit}
                disabled={loading || !file || !question.trim()}
                className={`flex-1 relative overflow-hidden ${
                  loading || !file || !question.trim()
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                } text-white shadow-lg hover:shadow-xl transition-all duration-300`}
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Analyze Document
                  </>
                )}
                {!(loading || !file || !question.trim()) && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform translate-x-[-200%] animate-shimmer"></div>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={clearAll}
                disabled={loading}
                size="lg"
                className="border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Section */}
      {loading && (
        <Card className="overflow-hidden border-0 bg-white dark:bg-gray-900 shadow-lg">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-500 rounded-full blur-sm opacity-20"></div>
                    <div className="relative h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center animate-pulse">
                      <Loader2 className="h-4 w-4 text-white animate-spin" />
                    </div>
                  </div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">{processingStep}</span>
                </div>
                <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0">
                  {progress}%
                </Badge>
              </div>
              <div className="relative pt-1">
                <div className="overflow-hidden h-2 text-xs flex rounded-full bg-gray-100 dark:bg-gray-800">
                  <div
                    style={{ width: `${progress}%` }}
                    className="rounded-full flex flex-col justify-center bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500 ease-out"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform translate-x-[-200%] animate-shimmer"></div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-6 text-sm">
                <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-800">
                  <Brain className="h-3 w-3 mr-1" />
                  {aiModels.find((m) => m.id === selectedModel)?.name}
                </Badge>
                <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-800">
                  <FileText className="h-3 w-3 mr-1" />
                  Processing PDF
                </Badge>
                <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-800">
                  <Zap className="h-3 w-3 mr-1" />
                  Free Analysis
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Alert */}
      {error && (
        <Alert className="border-0 bg-red-50 dark:bg-red-900/20">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
        </Alert>
      )}

      {/* Results Section */}
      {result && result.success && (
        <Card className="overflow-hidden border-0 bg-white dark:bg-gray-900 shadow-lg">
          <CardHeader className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <div className="relative">
                  <div className="absolute inset-0 bg-green-500 rounded-lg blur-sm opacity-20"></div>
                  <div className="relative bg-gradient-to-r from-green-600 to-teal-600 p-2 rounded-lg">
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    Analysis Results
                  </h3>
                </div>
              </CardTitle>
              <div className="flex items-center gap-2">
                {result.processingTime && (
                  <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0">
                    <Clock className="h-3 w-3 mr-1" />
                    {result.processingTime}s
                  </Badge>
                )}
                <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {result.model}
                </Badge>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="h-4 w-4 text-blue-600" />
                <h4 className="font-semibold text-gray-900 dark:text-white">Question</h4>
              </div>
              <p className="text-gray-700 dark:text-gray-300">{question}</p>
            </div>

            <Separator className="bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent" />

            <div className="relative overflow-hidden rounded-lg border-l-4 border-blue-500">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20"></div>
              <div className="relative p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">AI Answer</h4>
                </div>
                <div className="prose max-w-none dark:prose-invert">
                  <p className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">{result.answer}</p>
                </div>
              </div>
            </div>

            {/* Source Chunks */}
            {result.sourceChunks && result.sourceChunks.length > 0 && (
              <details className="group">
                <summary className="cursor-pointer font-semibold text-gray-900 dark:text-white hover:text-blue-600 transition-colors flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Source Context ({result.sourceChunks.length} sections)
                  <Badge className="ml-auto bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                    Click to expand
                  </Badge>
                </summary>
                <div className="mt-4 space-y-4">
                  {result.sourceChunks.map((chunk, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden group"
                    >
                      <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-0">
                            Source {index + 1}
                          </Badge>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {chunk.length} chars • High relevance
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="p-4">
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                          {chunk.length > 500 ? `${chunk.substring(0, 500)}...` : chunk}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )

  const renderHistoryTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Analysis History</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{analysisHistory.length} total analyses</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportHistory}
            disabled={isHistoryLoading || analysisHistory.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearHistory}
            disabled={isHistoryLoading || analysisHistory.length === 0 || clearInProgress}
          >
            {clearInProgress ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Clear All
          </Button>
        </div>
      </div>

      {isHistoryLoading ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Loading history...</p>
            </div>
          </CardContent>
        </Card>
      ) : historyError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{historyError}</AlertDescription>
        </Alert>
      ) : analysisHistory.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Analysis History</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Your analysis history will appear here after you process some documents.
            </p>
            <Button onClick={() => setActiveTab("analyze")}>
              <Brain className="h-4 w-4 mr-2" />
              Start Analyzing
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {analysisHistory.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-gray-900 dark:text-white">{item.fileName}</span>
                      <Badge variant="secondary" className="text-xs">
                        {item.model}
                      </Badge>
                      {item.processingTime && (
                        <Badge variant="outline" className="text-xs">
                          {item.processingTime}s
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <strong>Q:</strong> {item.question}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                      <strong>A:</strong> {item.answer}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {new Date(item.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-4">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteHistoryItem(item.id)}
                      disabled={deleteInProgress === item.id}
                    >
                      {deleteInProgress === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )

  const renderDashboardTab = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Analyses</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardStats.totalAnalyses}</p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600 dark:text-green-400">+12% from last week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {dashboardStats.successRate.toFixed(1)}%
                </p>
              </div>
              <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
                <Target className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              <Activity className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600 dark:text-green-400">Excellent performance</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Processing</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {dashboardStats.avgProcessingTime.toFixed(1)}s
                </p>
              </div>
              <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              <Zap className="h-4 w-4 text-yellow-500 mr-1" />
              <span className="text-sm text-yellow-600 dark:text-yellow-400">Fast processing</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Documents</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardStats.totalDocuments}</p>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
                <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              <Database className="h-4 w-4 text-purple-500 mr-1" />
              <span className="text-sm text-purple-600 dark:text-purple-400">Total processed</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-600" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full">
                  <Cpu className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">AI Models</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">All systems operational</p>
                </div>
              </div>
              <Badge className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">Online</Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                  <HardDrive className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Storage</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">85% available</p>
                </div>
              </div>
              <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">Healthy</Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-full">
                  <Wifi className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Network</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Low latency</p>
                </div>
              </div>
              <Badge className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">Optimal</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderSettingsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Configure your application preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="dark-mode" className="text-base font-medium">
                Dark Mode
              </Label>
              <p className="text-sm text-gray-500 dark:text-gray-400">Toggle dark mode theme</p>
            </div>
            <Switch id="dark-mode" checked={darkMode} onCheckedChange={setDarkMode} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-save" className="text-base font-medium">
                Auto Save
              </Label>
              <p className="text-sm text-gray-500 dark:text-gray-400">Automatically save analysis history</p>
            </div>
            <Switch id="auto-save" checked={autoSave} onCheckedChange={setAutoSave} />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="default-model" className="text-base font-medium">
              Default AI Model
            </Label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger>
                <SelectValue placeholder="Select default model" />
              </SelectTrigger>
              <SelectContent>
                {aiModels.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex items-center gap-2">
                      <span>{model.icon}</span>
                      <span>{model.name}</span>
                      <Badge variant="outline" className="ml-auto">
                        {model.status}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Manage your data and privacy settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" onClick={exportHistory} className="w-full justify-start bg-transparent">
            <Download className="h-4 w-4 mr-2" />
            Export Analysis History
          </Button>
          <Button variant="outline" onClick={clearHistory} className="w-full justify-start bg-transparent">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All History
          </Button>
          <Button variant="destructive" className="w-full justify-start">
            <AlertCircle className="h-4 w-4 mr-2" />
            Delete All Data
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${darkMode ? "dark" : ""}`}>
      <div className="flex">
        {renderSidebar()}
        <div className="flex-1 min-h-screen">
          {renderTopBar()}
          <main className="p-6 max-w-7xl mx-auto">
            {activeTab === "analyze" && renderAnalyzeTab()}
            {activeTab === "history" && renderHistoryTab()}
            {activeTab === "dashboard" && renderDashboardTab()}
            {activeTab === "settings" && renderSettingsTab()}
          </main>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}

