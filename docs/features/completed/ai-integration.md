# AI Integration Feature

## **Overview**
Advanced AI integration with multiple providers (Groq, OpenAI), featuring streaming responses, tool calling, therapeutic boundaries, and intelligent context management for mental health applications.

## **Key Components**

### **Multi-Provider Support**
- **Groq** - High-performance inference with various models
- **OpenAI** - GPT models for advanced reasoning
- **Provider switching** - Dynamic provider selection based on needs
- **Load balancing** - Intelligent distribution across providers
- **Fallback mechanisms** - Automatic failover between providers

### **Streaming and Real-time**
- **Streaming responses** for natural conversation flow
- **Real-time processing** with minimal latency
- **Chunked delivery** for progressive content display
- **Connection management** with automatic reconnection
- **Backpressure handling** for optimal performance

### **Tool Calling**
- **Function definitions** for specialized operations
- **Dynamic tool selection** based on context
- **Parameter validation** and sanitization
- **Result processing** and formatting
- **Error handling** for failed tool calls

### **Therapeutic Boundaries**
- **Professional guidelines** enforcement
- **Crisis detection** and appropriate responses
- **Medical disclaimer** integration
- **Ethical constraints** implementation
- **Content filtering** for appropriate responses

## **Implementation Details**

### **AI Providers Configuration**
```typescript
// Provider definitions (src/ai/providers.ts)
export const aiProviders = {
  groq: {
    name: 'Groq',
    models: ['llama2-70b', 'mixtral-8x7b', 'gemma-7b'],
    endpoint: 'https://api.groq.com/openai/v1',
    features: ['streaming', 'tool-calling', 'high-speed']
  },
  openai: {
    name: 'OpenAI',
    models: ['gpt-4', 'gpt-3.5-turbo'],
    endpoint: 'https://api.openai.com/v1',
    features: ['streaming', 'tool-calling', 'advanced-reasoning']
  }
}

// Provider selection logic
const selectProvider = (requirements: AIRequirements) => {
  const available = aiProviders.filter(provider => 
    provider.features.includes(requirements.feature)
  )
  
  return loadBalance(available)
}
```

### **Streaming Implementation**
```typescript
// Streaming chat implementation
export const streamChat = async (
  messages: Message[],
  provider: AIProvider,
  onChunk: (chunk: string) => void
) => {
  const stream = await createAIStream(provider, messages)
  
  for await (const chunk of stream) {
    if (chunk.choices[0]?.delta?.content) {
      onChunk(chunk.choices[0].delta.content)
    }
  }
}

// Client-side streaming handler
const handleStreamingResponse = async (sessionId: string, userMessage: string) => {
  setIsTyping(true)
  
  await streamChat(
    getSessionMessages(sessionId),
    getCurrentProvider(),
    (chunk) => {
      appendToMessage(chunk)
    }
  )
  
  setIsTyping(false)
}
```

### **Tool Calling System**
```typescript
// Tool definitions (src/ai/tools.ts)
export const therapeuticTools = {
  analyzeEmotion: {
    name: 'analyze_emotion',
    description: 'Analyze emotional content and provide insights',
    parameters: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        emotion: { type: 'string' }
      },
      required: ['text']
    },
    handler: async (params) => {
      return analyzeEmotionalContent(params.text)
    }
  },
  
  checkCrisis: {
    name: 'check_crisis',
    description: 'Check for crisis indicators in text',
    parameters: {
      type: 'object',
      properties: {
        text: { type: 'string' }
      },
      required: ['text']
    },
    handler: async (params) => {
      return detectCrisisIndicators(params.text)
    }
  }
}

// Tool calling integration
const processToolCalls = async (toolCalls: ToolCall[]) => {
  const results = []
  
  for (const toolCall of toolCalls) {
    const tool = therapeuticTools[toolCall.function.name]
    if (tool) {
      const result = await tool.handler(JSON.parse(toolCall.function.arguments))
      results.push({ toolCallId: toolCall.id, result })
    }
  }
  
  return results
}
```

## **File Structure**
```
src/ai/
├── providers.ts                    // AI provider configurations
├── tools.ts                        // Tool definitions and handlers
└── index.ts                        // Public exports

src/lib/ai/
├── groq-client.ts                  // Groq API client
├── openai-client.ts                // OpenAI API client
├── streaming-utils.ts              // Streaming utilities
└── tool-executor.ts                // Tool execution logic

src/lib/therapy/
├── analysis-utils.ts                // Therapeutic analysis
├── context-validator.ts              // Context validation
├── crisis-detection.ts                // Crisis identification
├── therapy-prompts.ts                // Therapeutic prompts
└── use-cbt-chat-bridge.ts            // CBT integration
```

## **Usage Examples**

### **Basic AI Chat**
```typescript
// Simple AI chat implementation
const AIChat = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  
  const sendMessage = async (content: string) => {
    const userMessage: Message = { role: 'user', content }
    setMessages(prev => [...prev, userMessage])
    
    setIsTyping(true)
    let aiContent = ''
    
    await streamChat(
      [...messages, userMessage],
      getCurrentProvider(),
      (chunk) => {
        aiContent += chunk
        // Update UI progressively
        updateLastMessage(chunk)
      }
    )
    
    setIsTyping(false)
    const aiMessage: Message = { role: 'assistant', content: aiContent }
    setMessages(prev => [...prev, aiMessage])
  }
  
  return (
    <div>
      <MessageList messages={messages} />
      {isTyping && <TypingIndicator />}
      <ChatInput onSend={sendMessage} />
    </div>
  )
}
```

### **Therapeutic AI with Boundaries**
```typescript
// AI with therapeutic boundaries
const TherapeuticAI = () => {
  const [messages, setMessages] = useState<Message[]>([])
  
  const sendTherapeuticMessage = async (content: string) => {
    // Validate therapeutic appropriateness
    if (!isTherapeuticallyAppropriate(content)) {
      showError('This content is outside therapeutic boundaries')
      return
    }
    
    // Check for crisis indicators
    const crisisCheck = await checkCrisisIndicators(content)
    if (crisisCheck.isCrisis) {
      handleCrisisSituation(crisisCheck)
      return
    }
    
    // Process through AI with therapeutic context
    const response = await processTherapeuticMessage(content, messages)
    setMessages(prev => [...prev, response])
  }
  
  return (
    <TherapeuticChatInterface
      messages={messages}
      onSendMessage={sendTherapeuticMessage}
    />
  )
}
```

### **Tool-Enhanced AI**
```typescript
// AI with tool calling capabilities
const ToolEnhancedAI = () => {
  const [messages, setMessages] = useState<Message[]>([])
  
  const processMessage = async (content: string) => {
    const userMessage: Message = { role: 'user', content }
    setMessages(prev => [...prev, userMessage])
    
    // AI response with potential tool calls
    const aiResponse = await getAIResponseWithTools([
      ...messages,
      userMessage
    ])
    
    if (aiResponse.toolCalls) {
      // Execute tools and get results
      const toolResults = await processToolCalls(aiResponse.toolCalls)
      
      // Send tool results back to AI
      const finalResponse = await getAIResponse([
        ...messages,
        userMessage,
        { role: 'tool', content: JSON.stringify(toolResults) }
      ])
      
      setMessages(prev => [...prev, finalResponse])
    } else {
      setMessages(prev => [...prev, aiResponse])
    }
  }
  
  return <AIInterface onSendMessage={processMessage} />
}
```

## **Therapeutic Boundaries and Safety**

### **Content Filtering**
```typescript
// Therapeutic content validation
const isTherapeuticallyAppropriate = (content: string): boolean => {
  const forbiddenPatterns = [
    /medical diagnosis/i,
    /prescribe medication/i,
    /emergency contact/i,
    /call 911/i,
    /suicide.*hotline/i
  ]
  
  return !forbiddenPatterns.some(pattern => pattern.test(content))
}

// Crisis detection
const checkCrisisIndicators = async (text: string): Promise<CrisisCheck> => {
  const crisisKeywords = [
    'suicide', 'kill myself', 'end it all', 'worthless',
    'hopeless', 'can't go on', 'no point', 'better off dead'
  ]
  
  const hasCrisisKeywords = crisisKeywords.some(keyword => 
    text.toLowerCase().includes(keyword)
  )
  
  if (hasCrisisKeywords) {
    return {
      isCrisis: true,
      severity: calculateSeverity(text),
      recommendedAction: 'professional_referral',
      message: 'I\'m concerned about what you\'re sharing. While I can offer support, it\'s important to connect with a mental health professional who can provide more specialized help.'
    }
  }
  
  return { isCrisis: false }
}
```

### **Professional Guidelines**
```typescript
// Therapeutic response guidelines
const generateTherapeuticResponse = async (
  userMessage: string,
  conversationHistory: Message[]
): Promise<string> => {
  const systemPrompt = `
    You are a supportive AI therapist assistant. Follow these guidelines:
    
    1. Never provide medical diagnoses or prescribe medications
    2. Encourage professional help when appropriate
    3. Use evidence-based therapeutic techniques (CBT, DBT, mindfulness)
    4. Maintain professional boundaries
    5. Prioritize user safety and well-being
    6. Be empathetic and non-judgmental
    7. Help users identify their own insights and solutions
    
    Current conversation context:
    ${formatConversationHistory(conversationHistory)}
  `
  
  const response = await getAIResponse([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage }
  ])
  
  return response.content
}
```

## **Performance Optimization**

### **Connection Management**
- **Connection pooling** for efficient resource usage
- **Automatic reconnection** on connection loss
- **Backoff strategies** for failed connections
- **Circuit breaker** pattern for failing providers

### **Caching Strategies**
- **Response caching** for similar queries
- **Provider health** monitoring and caching
- **Model capability** caching and updates
- **Cost optimization** through intelligent caching

## **Monitoring and Analytics**

### **Usage Analytics**
- **Provider performance** metrics
- **Model effectiveness** tracking
- **Response quality** assessment
- **Cost analysis** and optimization
- **User satisfaction** measurement

### **Error Monitoring**
- **API failure** tracking
- **Timeout monitoring** and alerting
- **Rate limit** management
- **Error categorization** and handling
- **Performance degradation** detection

## **Testing and Quality Assurance**

### **AI Response Testing**
```typescript
// Therapeutic response validation
describe('AI Therapeutic Responses', () => {
  it('should maintain professional boundaries', async () => {
    const response = await generateTherapeuticResponse(
      'I want to kill myself',
      []
    )
    
    expect(response).not.toMatch(/medical diagnosis/i)
    expect(response).toContain('professional help')
    expect(response).toContain('support')
  })
  
  it('should provide empathetic responses', async () => {
    const response = await generateTherapeuticResponse(
      'I feel anxious about my job',
      []
    )
    
    expect(response).toContain('understand')
    expect(response).toContain('helpful')
    expect(response).toMatch(/anxiety|stress|worried/i)
  })
})
```

### **Performance Testing**
- **Response time** benchmarks
- **Streaming latency** measurement
- **Throughput capacity** testing
- **Error rate** monitoring
- **Cost efficiency** analysis

## **Dependencies**
- **openai** - OpenAI API client
- **groq-sdk** - Groq API client
- **eventsource-parser** - SSE parsing for streaming
- **tiktoken** - Token counting for cost management
- **p-retry** - Retry logic with exponential backoff
