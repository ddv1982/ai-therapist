# Data Export Feature

## **Overview**
Comprehensive data export system supporting multiple formats (PDF, JSON, CSV, Markdown) with professional formatting, therapeutic content organization, and privacy-compliant data portability.

## **Key Components**

### **Export Formats**
- **PDF** - Professional formatted documents with charts and visualizations
- **JSON** - Raw structured data for analysis and backup
- **CSV** - Spreadsheet compatible format for data processing
- **Markdown** - Human-readable format with formatting preservation
- **HTML** - Web-ready format with styling and interactivity

### **Content Types**
- **CBT Sessions** - Complete cognitive behavioral therapy workflows
- **Chat Transcripts** - Full conversation history with timestamps
- **Session Reports** - Generated analytics and insights
- **Memory Data** - Extracted memories and therapeutic insights
- **Progress Tracking** - Emotional trends and improvement metrics

### **Professional Formatting**
- **Therapeutic templates** - Professionally designed layouts
- **Chart integration** - Visual representations of data
- **Brand consistency** - Unified styling across exports
- **Accessibility compliance** - Screen reader compatible formats
- **Print optimization** - High-quality print outputs

## **Implementation Details**

### **Export API**
```typescript
// Export endpoints
POST /api/export/cbt/:sessionId     // Export CBT session
POST /api/export/chat/:sessionId     // Export chat transcript
POST /api/export/report/:reportId  // Export session report
POST /api/export/memory/:memoryId  // Export memory data

// Export configuration
interface ExportConfig {
  format: 'pdf' | 'json' | 'csv' | 'markdown' | 'html'
  includeMetadata: boolean
  anonymize: boolean
  dateRange?: [Date, Date]
  language: 'en' | 'nl'
}
```

### **Export Processing**
```typescript
// Export pipeline (src/lib/cbt/export-utils.ts)
export const processExport = async (
  data: ExportData,
  config: ExportConfig
): Promise<ExportResult> => {
  // Data preparation
  const preparedData = await prepareData(data, config)
  
  // Format-specific processing
  switch (config.format) {
    case 'pdf':
      return await generatePDF(preparedData, config)
    case 'json':
      return await generateJSON(preparedData, config)
    case 'csv':
      return await generateCSV(preparedData, config)
    case 'markdown':
      return await generateMarkdown(preparedData, config)
    case 'html':
      return await generateHTML(preparedData, config)
    default:
      throw new Error(`Unsupported format: ${config.format}`)
  }
}

// PDF generation with professional formatting
const generatePDF = async (data: PreparedData, config: ExportConfig): Promise<ExportResult> => {
  const doc = new jsPDF()
  
  // Add header with branding
  addPDFHeader(doc, config)
  
  // Add content sections
  for (const section of data.sections) {
    await addPDFSection(doc, section, config)
  }
  
  // Add charts and visualizations
  if (data.charts) {
    await addPDFCharts(doc, data.charts)
  }
  
  // Add footer with metadata
  addPDFFooter(doc, config)
  
  return {
    content: doc.output('blob'),
    filename: generateFilename(data, config),
    mimeType: 'application/pdf'
  }
}
```

## **File Structure**
```
src/features/therapy/cbt/
├── cbt-export-button.tsx              // Export UI component
└── index.ts                            // Export utilities

src/lib/cbt/
├── export-utils.ts                     // Export processing logic
└── index.ts                           // Public exports

src/lib/therapy/
├── cbt-data-parser.ts                  // CBT data extraction
├── cbt-template.ts                    // Export templates
└── therapy-prompts.ts                  // Therapeutic content
```

## **Usage Examples**

### **CBT Session Export**
```typescript
// Export CBT session to PDF
const exportCBTSession = async (sessionId: string) => {
  const exportButton = document.getElementById('export-cbt-btn')
  exportButton.disabled = true
  
  try {
    const response = await fetch(`/api/export/cbt/${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        format: 'pdf',
        includeMetadata: true,
        language: getCurrentLanguage()
      })
    })
    
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    
    // Trigger download
    const a = document.createElement('a')
    a.href = url
    a.download = `cbt-session-${sessionId}.pdf`
    a.click()
    
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Export failed:', error)
    showError('Failed to export session')
  } finally {
    exportButton.disabled = false
  }
}
```

### **Batch Export with Progress**
```typescript
// Export multiple sessions with progress tracking
const batchExportSessions = async (sessionIds: string[], format: ExportFormat) => {
  const progress = { completed: 0, total: sessionIds.length }
  
  for (const sessionId of sessionIds) {
    try {
      await exportSession(sessionId, format)
      progress.completed++
      
      // Update progress UI
      updateProgressBar(
        (progress.completed / progress.total) * 100,
        `Exported ${progress.completed} of ${progress.total} sessions`
      )
    } catch (error) {
      console.error(`Failed to export session ${sessionId}:`, error)
      // Continue with remaining sessions
    }
  }
  
  showSuccess(`Successfully exported ${progress.completed} sessions`)
}
```

### **Data Analysis Export**
```typescript
// Export data for external analysis
const exportForAnalysis = async (userId: string, dateRange: [Date, Date]) => {
  const exportConfig = {
    format: 'json' as const,
    includeMetadata: true,
    anonymize: true, // Remove personal identifiers
    dateRange,
    language: 'en'
  }
  
  const response = await fetch('/api/export/user-data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, config: exportConfig })
  })
  
  const data = await response.json()
  
  // Process anonymized data for research
  const analysisData = processForResearch(data)
  return analysisData
}
```

## **Professional Templates**

### **CBT Session Template**
```markdown
# CBT Session Report
**Session ID:** {{sessionId}}  
**Date:** {{date}}  
**Duration:** {{duration}}  

## Session Overview
{{overview}}

## Emotional Analysis
{{emotionChart}}

## Thought Patterns
{{thoughtAnalysis}}

## Key Insights
{{insights}}

## Progress Assessment
{{progress}}

## Next Steps
{{recommendations}}
```

### **Therapeutic Summary Template**
```html
<!DOCTYPE html>
<html>
<head>
  <title>Therapeutic Summary - {{patientName}}</title>
  <style>
    .header { background: #f8f9fa; padding: 20px; }
    .section { margin: 20px 0; }
    .chart { width: 100%; max-width: 600px; }
    .insight { background: #e8f5e8; padding: 15px; border-left: 4px solid #28a745; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Therapeutic Summary</h1>
    <p>Generated on {{generationDate}}</p>
  </div>
  
  <div class="section">
    <h2>Progress Overview</h2>
    {{progressOverview}}
  </div>
  
  <div class="section">
    <h2>Emotional Trends</h2>
    <canvas id="emotionChart" class="chart"></canvas>
  </div>
  
  <div class="section">
    <h2>Key Insights</h2>
    <div class="insight">
      {{keyInsights}}
    </div>
  </div>
</body>
</html>
```

## **Privacy and Security**

### **Data Anonymization**
```typescript
// Anonymize sensitive data for research exports
const anonymizeData = (data: ExportData): AnonymizedData => {
  return {
    ...data,
    userId: hashId(data.userId),
    sessionId: hashId(data.sessionId),
    personalInfo: removePersonalInfo(data.personalInfo),
    location: generalizeLocation(data.location),
    timestamps: normalizeTimestamps(data.timestamps)
  }
}

// Hash identifiers for privacy
const hashId = (id: string): string => {
  return crypto.createHash('sha256').update(id).digest('hex').substring(0, 16)
}
```

### **Access Control**
```typescript
// Export permission validation
const canExport = (user: User, dataType: ExportType): boolean => {
  const permissions = {
    'cbt-session': user.hasPermission('export-cbt'),
    'chat-transcript': user.hasPermission('export-chat'),
    'session-report': user.hasPermission('export-reports'),
    'memory-data': user.hasPermission('export-memories')
  }
  
  return permissions[dataType] || false
}

// Rate limiting for exports
const exportRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 exports per window
  message: 'Too many export requests, please try again later'
})
```

## **Performance Optimization**

### **Large Dataset Handling**
```typescript
// Process large datasets efficiently
const processLargeDataset = async (data: LargeDataset): Promise<ExportData> => {
  const CHUNK_SIZE = 1000
  const chunks = splitIntoChunks(data, CHUNK_SIZE)
  const results = []
  
  for (const chunk of chunks) {
    const processed = await processChunk(chunk)
    results.push(processed)
    
    // Allow UI to update
    await new Promise(resolve => setTimeout(resolve, 0))
  }
  
  return mergeResults(results)
}

// Memory-efficient streaming for large exports
const streamLargeExport = async (query: ExportQuery): Promise<ReadableStream> => {
  return new ReadableStream({
    async start(controller) {
      const cursor = createExportCursor(query)
      
      while (await cursor.hasNext()) {
        const batch = await cursor.next()
        controller.enqueue(batch)
      }
      
      controller.close()
    }
  })
}
```

### **Caching Strategy**
```typescript
// Export result caching
const exportCache = new Cache({
  ttl: 60 * 60 * 1000, // 1 hour
  maxSize: 100, // Maximum 100 cached exports
  keyGenerator: (config: ExportConfig) => {
    return `${config.format}-${config.type}-${hash(config.filters)}`
  }
})

// Cache frequently requested exports
const getCachedExport = async (config: ExportConfig): Promise<ExportResult> => {
  const cacheKey = exportCache.generateKey(config)
  let result = await exportCache.get(cacheKey)
  
  if (!result) {
    result = await generateExport(config)
    await exportCache.set(cacheKey, result)
  }
  
  return result
}
```

## **Quality Assurance**

### **Export Validation**
```typescript
// Validate export data integrity
const validateExport = (data: ExportData, format: ExportFormat): ValidationResult => {
  const validations = {
    completeness: checkDataCompleteness(data),
    format: validateFormat(data, format),
    privacy: checkPrivacyCompliance(data),
    accuracy: verifyDataAccuracy(data)
  }
  
  return {
    isValid: Object.values(validations).every(v => v.passed),
    errors: Object.values(validations).flatMap(v => v.errors),
    warnings: Object.values(validations).flatMap(v => v.warnings)
  }
}

// Format-specific validation
const validateFormat = (data: ExportData, format: ExportFormat): ValidationResult => {
  switch (format) {
    case 'pdf':
      return validatePDFData(data)
    case 'json':
      return validateJSONData(data)
    case 'csv':
      return validateCSVData(data)
    default:
      return { passed: true, errors: [], warnings: [] }
  }
}
```

### **Testing Coverage**
```typescript
// Export functionality testing
describe('Data Export', () => {
  it('should export CBT session to PDF', async () => {
    const session = await createTestCBTSession()
    const exportResult = await exportCBTSession(session.id, 'pdf')
    
    expect(exportResult.format).toBe('pdf')
    expect(exportResult.content).toBeInstanceOf(Blob)
    expect(exportResult.filename).toMatch(/cbt-session.*\.pdf/)
  })
  
  it('should anonymize data for research exports', async () => {
    const userData = createTestUserData()
    const anonymized = anonymizeData(userData)
    
    expect(anonymized.userId).not.toBe(userData.userId)
    expect(anonymized.personalInfo).toEqual({})
  })
  
  it('should validate export permissions', async () => {
    const user = createTestUser({ permissions: ['export-cbt'] })
    expect(canExport(user, 'cbt-session')).toBe(true)
    expect(canExport(user, 'chat-transcript')).toBe(false)
  })
})
```

## **Dependencies**
- **jsPDF** - PDF generation and formatting
- **html2canvas** - HTML to image conversion for PDFs
- **papaparse** - CSV parsing and generation
- **marked** - Markdown parsing and rendering
- **chart.js** - Chart and visualization generation
- **date-fns** - Date formatting and localization
