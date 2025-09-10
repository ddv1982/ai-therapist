# Security & Monitoring Feature

## **Overview**
Enterprise-grade security and monitoring system with comprehensive threat detection, real-time monitoring, audit logging, and compliance features for healthcare-grade data protection.

## **Key Components**

### **Authentication & Authorization**
- **Multi-factor authentication** with TOTP and device verification
- **Role-based access control** with granular permissions
- **Session management** with secure token rotation
- **Rate limiting** on all authentication endpoints
- **Account lockout** protection against brute force attacks

### **Data Protection**
- **End-to-end encryption** for sensitive therapeutic data
- **Field-level encryption** for personally identifiable information
- **Secure key management** with rotation and backup
- **Data anonymization** for research and analytics
- **GDPR compliance** with data portability and deletion rights

### **Threat Detection**
- **Real-time monitoring** of suspicious activities
- **Anomaly detection** for unusual behavior patterns
- **Crisis detection** for emergency situations
- **Content filtering** for inappropriate material
- **Automated response** to security incidents

### **Audit & Compliance**
- **Comprehensive logging** of all system activities
- **Audit trails** for regulatory compliance
- **Compliance reporting** for healthcare standards
- **Data retention policies** with automatic cleanup
- **Privacy controls** for user consent management

## **Implementation Details**

### **Security Architecture**
```typescript
// Security middleware (src/lib/api/api-middleware.ts)
export const withSecurity = (handler: APIHandler) => {
  return async (request: NextRequest, context: APIContext) => {
    // Rate limiting
    const rateLimitResult = await checkRateLimit(request, context)
    if (!rateLimitResult.allowed) {
      return createErrorResponse('Rate limit exceeded', 429)
    }
    
    // Authentication validation
    const authResult = await validateAuthentication(request)
    if (!authResult.valid) {
      return createErrorResponse('Authentication required', 401)
    }
    
    // Authorization check
    const authzResult = await checkAuthorization(authResult.user, context)
    if (!authzResult.allowed) {
      return createErrorResponse('Insufficient permissions', 403)
    }
    
    // Security headers
    const securityHeaders = getSecurityHeaders()
    
    return handler(request, { ...context, user: authResult.user })
  }
}

// Encryption utilities (src/lib/auth/crypto-utils.ts)
export const encryptField = async (data: string): Promise<string> => {
  const algorithm = 'aes-256-gcm'
  const key = await getEncryptionKey()
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipher(algorithm, key, iv)
  
  let encrypted = cipher.update(data, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  return `encrypted:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

export const decryptField = async (encryptedData: string): Promise<string> => {
  if (!encryptedData.startsWith('encrypted:')) {
    return encryptedData
  }
  
  const [, ivHex, authTagHex, encryptedHex] = encryptedData.split(':')
  const algorithm = 'aes-256-gcm'
  const key = await getEncryptionKey()
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const encrypted = Buffer.from(encryptedHex, 'hex')
  
  const decipher = crypto.createDecipher(algorithm, key, iv)
  decipher.setAuthTag(authTag)
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}
```

### **Monitoring System**
```typescript
// Security monitoring (src/lib/monitoring/security-monitor.ts)
export class SecurityMonitor {
  private eventLog: SecurityEvent[] = []
  private anomalyDetector: AnomalyDetector
  private alertManager: AlertManager
  
  constructor() {
    this.anomalyDetector = new AnomalyDetector()
    this.alertManager = new AlertManager()
  }
  
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    this.eventLog.push(event)
    
    // Real-time anomaly detection
    const anomalyScore = await this.anomalyDetector.analyze(event)
    if (anomalyScore > THRESHOLD) {
      await this.handleAnomaly(event, anomalyScore)
    }
    
    // Store for analysis
    await this.storeEvent(event)
  }
  
  private async handleAnomaly(event: SecurityEvent, score: number): Promise<void> {
    // Immediate response for high-risk anomalies
    if (score > HIGH_RISK_THRESHOLD) {
      await this.blockUser(event.userId)
      await this.alertSecurityTeam(event, score)
    }
    
    // Medium risk - additional monitoring
    if (score > MEDIUM_RISK_THRESHOLD) {
      await this.enhanceMonitoring(event.userId)
    }
  }
  
  async generateSecurityReport(timeframe: TimeFrame): Promise<SecurityReport> {
    const events = await this.getEventsInTimeframe(timeframe)
    
    return {
      totalEvents: events.length,
      anomaliesDetected: events.filter(e => e.anomalyScore > 0).length,
      threatsBlocked: events.filter(e => e.action === 'blocked').length,
      recommendations: this.generateRecommendations(events),
      riskLevel: this.calculateRiskLevel(events)
    }
  }
}
```

## **File Structure**
```
src/lib/monitoring/
├── security-monitor.ts                // Security event monitoring
├── anomaly-detector.ts              // Behavioral anomaly detection
├── alert-manager.ts                   // Security alert management
├── compliance-logger.ts               // Compliance audit logging
└── index.ts                           // Public exports

src/lib/auth/
├── crypto-secure.ts                   // Secure cryptographic operations
├── device-fingerprint.ts              // Device identification
├── totp-service.ts                     // Time-based one-time passwords
└── user-session.ts                     // Session management

src/app/api/
├── auth/                              // Authentication endpoints
├── health/                            // Health monitoring
├── errors/                            // Error tracking
└── reports/                           // Security reporting
```

## **Usage Examples**

### **Security Event Logging**
```typescript
// Log security events for monitoring
const logSecurityEvent = async (event: SecurityEvent) => {
  const securityMonitor = new SecurityMonitor()
  
  await securityMonitor.logSecurityEvent({
    timestamp: new Date(),
    userId: event.userId,
    eventType: event.type,
    severity: event.severity,
    details: event.details,
    ipAddress: event.ipAddress,
    userAgent: event.userAgent
  })
}

// Example usage
await logSecurityEvent({
  userId: 'user123',
  type: 'failed_login',
  severity: 'medium',
  details: { reason: 'invalid_password', attempts: 3 },
  ipAddress: '192.168.1.1'
})
```

### **Crisis Detection**
```typescript
// Crisis detection and response
const detectAndHandleCrisis = async (message: string, userId: string) => {
  const crisisKeywords = [
    'suicide', 'kill myself', 'end it all', 'worthless',
    'hopeless', 'can\'t go on', 'no point', 'better off dead'
  ]
  
  const hasCrisisKeywords = crisisKeywords.some(keyword => 
    message.toLowerCase().includes(keyword)
  )
  
  if (hasCrisisKeywords) {
    // Log crisis event
    await logSecurityEvent({
      userId,
      type: 'crisis_indicator',
      severity: 'high',
      details: { message, keywords: crisisKeywords.filter(k => message.toLowerCase().includes(k)) }
    })
    
    // Immediate response
    return {
      isCrisis: true,
      response: 'I\'m concerned about what you\'re sharing. While I can offer support, it\'s important to connect with a mental health professional who can provide more specialized help.',
      resources: [
        'National Suicide Prevention Lifeline: 988',
        'Crisis Text Line: Text HOME to 741741',
        'Emergency services: 911'
      ]
    }
  }
  
  return { isCrisis: false }
}
```

### **Compliance Logging**
```typescript
// HIPAA compliance logging
const logHIPAAEvent = async (event: HIPAAEvent) => {
  const complianceLogger = new ComplianceLogger()
  
  await complianceLogger.logEvent({
    timestamp: new Date(),
    eventType: event.type,
    userId: event.userId,
    dataAccessed: event.dataAccessed,
    action: event.action,
    justification: event.justification,
    sessionId: event.sessionId
  })
}

// Example: Log PHI access
await logHIPAAEvent({
  type: 'phi_access',
  userId: 'therapist123',
  dataAccessed: 'patient_session_data',
  action: 'read',
  justification: 'Therapeutic treatment',
  sessionId: 'session456'
})
```

## **Security Features**

### **Multi-Factor Authentication**
```typescript
// TOTP implementation (src/lib/auth/totp-service.ts)
export class TOTPService {
  private readonly issuer = 'AI Therapist'
  private readonly algorithm = 'sha256'
  private readonly digits = 6
  private readonly period = 30
  
  generateSecret(): string {
    return speakeasy.generateSecret({
      issuer: this.issuer,
      name: this.issuer,
      algorithm: this.algorithm,
      digits: this.digits,
      period: this.period
    }).base32
  }
  
  generateTOTP(secret: string): string {
    return speakeasy.totp({
      secret,
      encoding: 'base32',
      algorithm: this.algorithm,
      digits: this.digits,
      period: this.period
    })
  }
  
  verifyTOTP(token: string, secret: string): boolean {
    return speakeasy.totp.verify({
      secret,
      token,
      encoding: 'base32',
      algorithm: this.algorithm,
      digits: this.digits,
      period: this.period,
      window: 2 // Allow 2 time periods of drift
    })
  }
}
```

### **Device Fingerprinting**
```typescript
// Device identification (src/lib/auth/device-fingerprint.ts)
export const generateDeviceFingerprint = async (): Promise<string> => {
  const components = [
    navigator.userAgent,
    navigator.language,
    navigator.platform,
    navigator.hardwareConcurrency?.toString() || 'unknown',
    navigator.deviceMemory?.toString() || 'unknown',
    screen.width.toString(),
    screen.height.toString(),
    screen.colorDepth.toString(),
    new Date().getTimezoneOffset().toString()
  ]
  
  const fingerprintData = components.join('|')
  return crypto.createHash('sha256').update(fingerprintData).digest('hex')
}

// Validate device fingerprint
const validateDeviceFingerprint = async (
  currentFingerprint: string,
  storedFingerprint: string
): Promise<boolean> => {
  // Allow for minor variations (browser updates, etc.)
  const similarity = calculateSimilarity(currentFingerprint, storedFingerprint)
  return similarity > 0.9 // 90% similarity threshold
}
```

### **Rate Limiting**
```typescript
// Advanced rate limiting (src/lib/api/rate-limiter.ts)
export class AdvancedRateLimiter {
  private readonly windowMs: number
  private readonly maxRequests: number
  private readonly keyGenerator: (request: NextRequest) => string
  
  constructor(options: RateLimiterOptions) {
    this.windowMs = options.windowMs
    this.maxRequests = options.maxRequests
    this.keyGenerator = options.keyGenerator
  }
  
  async checkLimit(request: NextRequest): Promise<RateLimitResult> {
    const key = this.keyGenerator(request)
    const now = Date.now()
    
    // Get current count
    const record = await this.getRecord(key)
    const windowStart = now - this.windowMs
    
    // Remove old entries
    const recentRequests = record.requests.filter(
      timestamp => timestamp > windowStart
    )
    
    // Check if limit exceeded
    if (recentRequests.length >= this.maxRequests) {
      return {
        allowed: false,
        resetTime: Math.min(...recentRequests) + this.windowMs,
        remaining: 0
      }
    }
    
    // Record new request
    recentRequests.push(now)
    await this.saveRecord(key, recentRequests)
    
    return {
      allowed: true,
      remaining: this.maxRequests - recentRequests.length,
      resetTime: now + this.windowMs
    }
  }
}
```

## **Monitoring and Alerting**

### **Real-time Monitoring**
```typescript
// Health monitoring (src/app/api/health/route.ts)
export const GET = withApiMiddleware(async (request: NextRequest) => {
  const healthChecks = await Promise.allSettled([
    checkDatabase(),
    checkRedis(),
    checkAIProviders(),
    checkEncryptionService(),
    checkMemoryUsage()
  ])
  
  const results = healthChecks.map((check, index) => ({
    service: ['database', 'redis', 'ai-providers', 'encryption', 'memory'][index],
    status: check.status === 'fulfilled' ? 'healthy' : 'unhealthy',
    responseTime: check.status === 'fulfilled' ? check.value.responseTime : null,
    error: check.status === 'rejected' ? check.reason.message : null
  }))
  
  const overallHealth = results.every(r => r.status === 'healthy')
  
  return createSuccessResponse({
    status: overallHealth ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    services: results,
    uptime: process.uptime()
  })
})
```

### **Alert Management**
```typescript
// Security alert system (src/lib/monitoring/alert-manager.ts)
export class AlertManager {
  private readonly channels: AlertChannel[]
  private readonly escalationRules: EscalationRule[]
  
  constructor(config: AlertConfig) {
    this.channels = config.channels
    this.escalationRules = config.escalationRules
  }
  
  async sendAlert(alert: SecurityAlert): Promise<void> {
    // Determine alert severity and recipients
    const severity = this.assessSeverity(alert)
    const recipients = this.determineRecipients(alert, severity)
    
    // Send through multiple channels
    await Promise.all(
      this.channels.map(channel => 
        channel.send(alert, recipients, severity)
      )
    )
    
    // Schedule escalation if critical
    if (severity === 'critical') {
      await this.scheduleEscalation(alert)
    }
  }
  
  private async scheduleEscalation(alert: SecurityAlert): Promise<void> {
    // Escalate if not acknowledged within timeframe
    setTimeout(async () => {
      const acknowledged = await this.checkAcknowledgment(alert.id)
      if (!acknowledged) {
        await this.escalateAlert(alert)
      }
    }, 15 * 60 * 1000) // 15 minutes
  }
}
```

## **Compliance and Privacy**

### **GDPR Compliance**
```typescript
// GDPR data handling (src/lib/compliance/gdpr-utils.ts)
export class GDPRCompliance {
  async exportUserData(userId: string): Promise<UserDataExport> {
    // Collect all user data
    const userData = await this.collectUserData(userId)
    
    // Format for portability
    return {
      personalData: userData.personal,
      sessionData: userData.sessions,
      chatData: userData.chats,
      cbtData: userData.cbt,
      generatedAt: new Date()
    }
  }
  
  async deleteUserData(userId: string): Promise<DeletionResult> {
    // Anonymize data that must be retained for legal reasons
    const anonymizedData = await this.anonymizeData(userId)
    
    // Delete data that can be removed
    await this.deleteRemovableData(userId)
    
    // Log deletion for compliance
    await this.logDeletion(userId, anonymizedData)
    
    return {
      deleted: true,
      anonymized: anonymizedData,
      timestamp: new Date()
    }
  }
}
```

### **Audit Trail**
```typescript
// Comprehensive audit logging (src/lib/compliance/audit-logger.ts)
export class AuditLogger {
  async logDataAccess(event: DataAccessEvent): Promise<void> {
    const auditEntry = {
      timestamp: new Date(),
      userId: event.userId,
      action: event.action,
      dataType: event.dataType,
      dataId: event.dataId,
      justification: event.justification,
      sessionId: event.sessionId,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent
    }
    
    // Store in audit database
    await this.storeAuditEntry(auditEntry)
    
    // Real-time monitoring
    await this.monitorDataAccess(auditEntry)
  }
  
  async generateComplianceReport(timeframe: TimeFrame): Promise<ComplianceReport> {
    const auditLogs = await this.getAuditLogs(timeframe)
    
    return {
      timeframe,
      totalAccesses: auditLogs.length,
      uniqueUsers: new Set(auditLogs.map(log => log.userId)).size,
      dataTypesAccessed: new Set(auditLogs.map(log => log.dataType)).size,
      suspiciousActivities: this.identifySuspiciousActivities(auditLogs),
      complianceScore: this.calculateComplianceScore(auditLogs)
    }
  }
}
```

## **Dependencies**
- **speakeasy** - TOTP implementation for 2FA
- **helmet** - Security headers middleware
- **express-rate-limit** - Rate limiting for Express
- **winston** - Logging framework
- **prom-client** - Prometheus metrics collection
- **node-cron** - Scheduled task execution
