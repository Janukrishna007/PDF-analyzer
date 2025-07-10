# PDF Question Answering - Full Stack Application

A modern full-stack application built with **Next.js** and **React** that allows users to upload PDF files and ask questions about their content using AI.

## 🚀 Features

- **📄 PDF Upload**: Drag-and-drop or click to upload PDF files
- **🤖 AI-Powered Q&A**: Ask questions and get intelligent answers about PDF content
- **⚡ Real-time Processing**: Live progress tracking and status updates
- **🎯 Smart Text Chunking**: Intelligent document segmentation for better context
- **💡 Example Questions**: Pre-built question suggestions
- **📱 Responsive Design**: Works perfectly on desktop and mobile
- **🔒 Secure**: Files are processed securely and automatically cleaned up

## 🏗️ Architecture

- **Frontend**: Next.js 15 with React 19 and Tailwind CSS
- **Backend**: Next.js API Routes (serverless functions)
- **AI**: OpenAI GPT-3.5-turbo for question answering
- **PDF Processing**: PDF.js for client-side text extraction
- **UI Components**: Radix UI with custom styling

## 🛠️ Tech Stack

- **Framework**: Next.js 15
- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI, Lucide React
- **AI**: OpenAI API, AI SDK
- **PDF Processing**: PDF.js
- **Deployment**: Vercel (recommended)

## 📦 Installation

1. **Clone the repository**:
   \`\`\`bash
   git clone <repository-url>
   cd pdf-qa-fullstack
   \`\`\`

2. **Install dependencies**:
   \`\`\`bash
   npm install
   \`\`\`

3. **Set up environment variables**:
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`
   
   Add your OpenAI API key to \`.env.local\`:
   \`\`\`
   OPENAI_API_KEY=your-openai-api-key-here
   \`\`\`

4. **Run the development server**:
   \`\`\`bash
   npm run dev
   \`\`\`

5. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🚀 Deployment

### Vercel (Recommended)

1. **Push to GitHub**
2. **Connect to Vercel**
3. **Add environment variables** in Vercel dashboard:
   - \`OPENAI_API_KEY\`: Your OpenAI API key
4. **Deploy**

### Other Platforms

The application can be deployed on any platform that supports Next.js:
- Netlify
- Railway
- AWS Amplify
- DigitalOcean App Platform

## 📖 Usage

1. **Upload a PDF**: Drag and drop or click to select a PDF file
2. **Ask a Question**: Type your question or select from examples
3. **Get Answer**: Click "Get Answer" to process and receive AI response
4. **View Sources**: Expand source context to see relevant text chunks

### Example Questions

- "What is the main topic of this document?"
- "Can you provide a summary of the key points?"
- "What are the main conclusions or findings?"
- "Who are the authors or contributors mentioned?"

## 🔧 Configuration

### Chunk Size Adjustment

Modify text chunking in \`app/api/pdf-qa/route.ts\`:

\`\`\`typescript
const chunks = chunkText(extractedText, 1500, 300) // chunkSize, overlap
\`\`\`

### AI Model Configuration

Change the AI model in \`app/api/pdf-qa/route.ts\`:

\`\`\`typescript
model: openai("gpt-4") // or other available models
\`\`\`

### File Size Limits

Adjust maximum file size:

\`\`\`typescript
const maxSize = 20 * 1024 * 1024 // 20MB
\`\`\`

## 🎨 Customization

### Styling

The application uses Tailwind CSS. Modify styles in:
- \`app/page.tsx\` - Main component styles
- \`app/globals.css\` - Global styles
- \`tailwind.config.ts\` - Tailwind configuration

### UI Components

Add or modify UI components in \`components/ui/\`:
- All components use Radix UI primitives
- Styled with Tailwind CSS
- Fully accessible and customizable

## 🐛 Troubleshooting

### Common Issues

1. **PDF text extraction fails**:
   - Ensure PDF contains extractable text (not scanned images)
   - Check PDF file integrity

2. **OpenAI API errors**:
   - Verify API key is correct
   - Check API usage limits and billing

3. **Large file processing**:
   - Files over 10MB may timeout
   - Consider implementing chunked upload for large files

4. **CORS issues in development**:
   - Ensure API routes are properly configured
   - Check Next.js API route setup

### Debug Mode

Enable detailed logging by adding to \`.env.local\`:
\`\`\`
NODE_ENV=development
\`\`\`

## 🔒 Security

- Files are processed in memory and automatically cleaned up
- No persistent file storage
- API routes include proper validation
- Environment variables for sensitive data

## 📊 Performance

- Client-side PDF processing reduces server load
- Intelligent text chunking for optimal context
- Streaming responses for better UX
- Optimized bundle size with Next.js

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: \`git checkout -b feature-name\`
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- Create an issue on GitHub for bugs
- Check the API documentation
- Review existing issues for solutions

---

