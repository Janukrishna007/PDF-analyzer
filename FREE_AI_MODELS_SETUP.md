# Free AI Models Integration Guide

This guide explains how to integrate and use free AI models with the PDF QA application.

## 🤗 Hugging Face Integration

### Setup

1. **Create a Hugging Face account** at [huggingface.co](https://huggingface.co)

2. **Get your API token**:
   - Go to Settings → Access Tokens
   - Create a new token with "Read" permissions

3. **Add to environment variables**:
   \`\`\`bash
   HUGGINGFACE_API_KEY=your_token_here
   \`\`\`

### Available Models

- **microsoft/DialoGPT-medium**: Conversational AI
- **facebook/bart-large-cnn**: Summarization
- **deepset/roberta-base-squad2**: Question Answering
- **google/flan-t5-large**: Text-to-text generation

### Usage Example

\`\`\`javascript
// In your API route
const response = await fetch("https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium", {
  method: "POST",
  headers: {
    Authorization: \`Bearer \${process.env.HUGGINGFACE_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    inputs: \`Context: \${context}\n\nQuestion: \${question}\n\nAnswer:\`,
    parameters: {
      max_length: 500,
      temperature: 0.1,
    },
  }),
})
\`\`\`

## 🦙 Ollama Integration (Local AI)

### Installation

1. **Install Ollama**:
   \`\`\`bash
   # macOS
   brew install ollama
   
   # Linux
   curl -fsSL https://ollama.ai/install.sh | sh
   
   # Windows
   # Download from https://ollama.ai/download
   \`\`\`

2. **Pull models**:
   \`\`\`bash
   ollama pull llama3.2        # 2B parameters, fast
   ollama pull mistral         # 7B parameters, balanced
   ollama pull codellama       # Code-focused
   ollama pull phi3           # Microsoft's efficient model
   \`\`\`

3. **Start Ollama server**:
   \`\`\`bash
   ollama serve
   \`\`\`

### Usage Example

\`\`\`javascript
const response = await fetch("http://localhost:11434/api/generate", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "llama3.2",
    prompt: \`Context: \${context}\n\nQuestion: \${question}\n\nAnswer:\`,
    stream: false,
    options: {
      temperature: 0.1,
      top_p: 0.9,
      max_tokens: 500,
    },
  }),
})
\`\`\`

## 🔧 Alternative Free Models

### 1. Google Colab + Transformers

\`\`\`python
# Run in Google Colab (free GPU)
from transformers import pipeline

qa_pipeline = pipeline("question-answering", 
                      model="deepset/roberta-base-squad2")

result = qa_pipeline(question=question, context=context)
\`\`\`

### 2. Replicate (Free Tier)

\`\`\`javascript
const response = await fetch("https://api.replicate.com/v1/predictions", {
  method: "POST",
  headers: {
    Authorization: \`Token \${process.env.REPLICATE_API_TOKEN}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    version: "meta/llama-2-7b-chat",
    input: {
      prompt: \`Context: \${context}\n\nQuestion: \${question}\n\nAnswer:\`,
      max_length: 500,
    },
  }),
})
\`\`\`

### 3. Together AI (Free Credits)

\`\`\`javascript
const response = await fetch("https://api.together.xyz/inference", {
  method: "POST",
  headers: {
    Authorization: \`Bearer \${process.env.TOGETHER_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "togethercomputer/llama-2-7b-chat",
    prompt: \`Context: \${context}\n\nQuestion: \${question}\n\nAnswer:\`,
    max_tokens: 500,
    temperature: 0.1,
  }),
})
\`\`\`

## 📊 Model Comparison

| Model | Provider | Cost | Speed | Quality | Setup |
|-------|----------|------|-------|---------|-------|
| Hugging Face | Cloud | Free | Medium | Good | Easy |
| Ollama | Local | Free | Fast | Very Good | Medium |
| Google Colab | Cloud | Free | Slow | Good | Hard |
| Replicate | Cloud | Free Tier | Medium | Good | Easy |
| Together AI | Cloud | Free Credits | Fast | Good | Easy |

## 🚀 Implementation Steps

### 1. Update Environment Variables

\`\`\`bash
# .env.local
HUGGINGFACE_API_KEY=your_hf_token
REPLICATE_API_TOKEN=your_replicate_token
TOGETHER_API_KEY=your_together_token
\`\`\`

### 2. Install Ollama (Recommended)

\`\`\`bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull a lightweight model
ollama pull llama3.2

# Start the server
ollama serve
\`\`\`

### 3. Test the Integration

\`\`\`bash
# Test Ollama
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.2",
  "prompt": "What is AI?",
  "stream": false
}'

# Test Hugging Face
curl -X POST https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"inputs": "What is AI?"}'
\`\`\`

## 🔧 Troubleshooting

### Common Issues

1. **Ollama not responding**:
   \`\`\`bash
   # Check if Ollama is running
   ps aux | grep ollama
   
   # Restart Ollama
   ollama serve
   \`\`\`

2. **Hugging Face rate limits**:
   - Use multiple API keys
   - Implement request queuing
   - Cache responses

3. **Model loading errors**:
   \`\`\`bash
   # Clear Ollama models
   ollama list
   ollama rm model_name
   ollama pull model_name
   \`\`\`

## 💡 Best Practices

1. **Model Selection**:
   - Use Ollama for privacy and speed
   - Use Hugging Face for variety
   - Implement fallbacks

2. **Performance Optimization**:
   - Cache frequent responses
   - Use smaller models for speed
   - Implement request batching

3. **Error Handling**:
   - Always have fallback methods
   - Implement retry logic
   - Log errors for debugging

## 📈 Scaling Tips

1. **Load Balancing**:
   - Run multiple Ollama instances
   - Use different models for different tasks
   - Implement smart routing

2. **Caching**:
   - Cache PDF text extraction
   - Cache AI responses
   - Use Redis for distributed caching

3. **Monitoring**:
   - Track response times
   - Monitor error rates
   - Log usage statistics

---

**Ready to use free AI models? Choose your preferred option and start building!**
