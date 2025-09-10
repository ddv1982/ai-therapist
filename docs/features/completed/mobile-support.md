# Mobile Support Feature

## **Overview**
Comprehensive mobile support with Progressive Web App (PWA) capabilities, responsive design, touch-optimized interfaces, and mobile-specific debugging tools for seamless mobile therapy experiences.

## **Key Components**

### **Progressive Web App (PWA)**
- **Web App Manifest** - Installable app experience
- **Service Worker** - Offline functionality and caching
- **App Icons** - Multiple sizes for different devices
- **Splash Screens** - Native app-like loading experience
- **Push Notifications** - Background notifications (future-ready)

### **Responsive Design**
- **Mobile-first approach** - Optimized for small screens
- **Breakpoint system** - Adaptive layouts for all screen sizes
- **Touch-friendly** - Large tap targets and gesture support
- **Orientation handling** - Portrait and landscape optimization
- **Safe area support** - Notch and rounded corner handling

### **Touch Optimization**
- **Gesture support** - Swipe, pinch, long-press interactions
- **Virtual keyboard** - Input field optimization
- **Touch feedback** - Haptic and visual feedback
- **Scroll performance** - Smooth scrolling on mobile
- **Touch accessibility** - Accessibility for touch interfaces

### **Mobile Debugging**
- **Device fingerprinting** - Mobile device identification
- **Debug information** - Mobile-specific diagnostics
- **Network analysis** - Connection quality monitoring
- **Performance tracking** - Mobile performance metrics
- **Error reporting** - Mobile-specific error handling

## **Implementation Details**

### **PWA Configuration**
```json
// Web App Manifest (public/manifest.json)
{
  "name": "AI Therapist",
  "short_name": "Therapist",
  "description": "AI-powered mental health support",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#6366f1",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/icons/maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

### **Service Worker Implementation**
```typescript
// Service Worker (public/sw.js)
const CACHE_NAME = 'ai-therapist-v1'
const urlsToCache = [
  '/',
  '/offline',
  '/static/js/bundle.js',
  '/static/css/main.css'
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  )
})

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request)
      })
      .catch(() => {
        // Return offline page if network fails
        return caches.match('/offline')
      })
  )
})
```

### **Mobile Component Optimization**
```typescript
// Mobile-optimized components (src/components/layout/mobile-debug-info.tsx)
const MobileDebugInfo = () => {
  const [deviceInfo, setDeviceInfo] = useState(null)
  const [networkInfo, setNetworkInfo] = useState(null)
  
  useEffect(() => {
    // Collect mobile device information
    const collectMobileInfo = async () => {
      const info = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        screenSize: `${window.screen.width}x${window.screen.height}`,
        devicePixelRatio: window.devicePixelRatio,
        connection: navigator.connection?.effectiveType,
        memory: navigator.deviceMemory,
        cores: navigator.hardwareConcurrency
      }
      
      setDeviceInfo(info)
      
      // Collect network information
      if (navigator.connection) {
        setNetworkInfo({
          effectiveType: navigator.connection.effectiveType,
          downlink: navigator.connection.downlink,
          rtt: navigator.connection.rtt,
          saveData: navigator.connection.saveData
        })
      }
    }
    
    collectMobileInfo()
  }, [])
  
  return (
    <div className="mobile-debug-info">
      <h3>Mobile Device Information</h3>
      <pre>{JSON.stringify(deviceInfo, null, 2)}</pre>
      
      {networkInfo && (
        <>
          <h3>Network Information</h3>
          <pre>{JSON.stringify(networkInfo, null, 2)}</pre>
        </>
      )}
    </div>
  )
}
```

## **File Structure**
```
src/components/layout/
├── mobile-debug-info.tsx              // Mobile diagnostics
└── index.ts                            // Layout exports

src/app/
├── manifest.ts                        // PWA manifest configuration
└── layout.tsx                         // Root layout with mobile support

public/
├── icons/
│   ├── icon-192.png                   // App icon 192x192
│   ├── icon-512.png                   // App icon 512x512
│   └── maskable-512.png               // Maskable icon for PWA
└── sw.js                              // Service worker
```

## **Usage Examples**

### **Mobile-First Component Design**
```typescript
// Mobile-first therapeutic component
const MobileTherapyInterface = () => {
  const [isMobile, setIsMobile] = useState(false)
  const [orientation, setOrientation] = useState('portrait')
  
  useEffect(() => {
    // Detect mobile device
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape')
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    window.addEventListener('orientationchange', checkMobile)
    
    return () => {
      window.removeEventListener('resize', checkMobile)
      window.removeEventListener('orientationchange', checkMobile)
    }
  }, [])
  
  return (
    <div className={cn(
      'therapy-interface',
      isMobile && 'mobile-therapy',
      orientation === 'landscape' && 'landscape-mode'
    )}>
      {isMobile ? (
        <MobileTherapyLayout>
          <TherapyContent />
        </MobileTherapyLayout>
      ) : (
        <DesktopTherapyLayout>
          <TherapyContent />
        </DesktopTherapyLayout>
      )}
    </div>
  )
}
```

### **Touch Gesture Support**
```typescript
// Touch gesture enabled components
const TouchEnabledChat = () => {
  const [messages, setMessages] = useState([])
  const touchStartRef = useRef(null)
  
  // Swipe to delete functionality
  const handleTouchStart = (e, messageId) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      messageId
    }
  }
  
  const handleTouchEnd = (e) => {
    if (!touchStartRef.current) return
    
    const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x
    const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y
    
    // Detect horizontal swipe
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        // Swipe right - mark as read
        markMessageAsRead(touchStartRef.current.messageId)
      } else {
        // Swipe left - delete message
        deleteMessage(touchStartRef.current.messageId)
      }
    }
    
    touchStartRef.current = null
  }
  
  return (
    <div className="touch-chat" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {messages.map(message => (
        <div key={message.id} className="message-swipeable">
          {message.content}
        </div>
      ))}
    </div>
  )
}
```

### **Virtual Keyboard Optimization**
```typescript
// Virtual keyboard friendly input
const MobileInput = () => {
  const [inputValue, setInputValue] = useState('')
  const [keyboardVisible, setKeyboardVisible] = useState(false)
  
  useEffect(() => {
    // Handle virtual keyboard visibility
    const handleResize = () => {
      const windowHeight = window.innerHeight
      const screenHeight = window.screen.height
      
      // Detect if keyboard is visible (viewport height significantly reduced)
      setKeyboardVisible(windowHeight < screenHeight * 0.7)
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  return (
    <div className={cn('mobile-input', keyboardVisible && 'keyboard-active')}>
      <textarea
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Type your message..."
        className="mobile-textarea"
        rows={keyboardVisible ? 3 : 1}
      />
      <button className="send-button" disabled={!inputValue.trim()}>
        Send
      </button>
    </div>
  )
}
```

### **PWA Installation Prompt**
```typescript
// PWA installation prompt
const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)
  
  useEffect(() => {
    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])
  
  const installApp = async () => {
    if (!deferredPrompt) return
    
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      console.log('User accepted PWA installation')
    } else {
      console.log('User dismissed PWA installation')
    }
    
    setDeferredPrompt(null)
    setShowPrompt(false)
  }
  
  if (!showPrompt) return null
  
  return (
    <div className="pwa-install-prompt">
      <p>Install AI Therapist for offline access and better performance</p>
      <button onClick={installApp}>Install App</button>
      <button onClick={() => setShowPrompt(false)}>Not Now</button>
    </div>
  )
}
```

## **Responsive Design System**

### **Breakpoint Management**
```typescript
// Responsive breakpoint system
const breakpoints = {
  mobile: '640px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1280px'
}

const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState('desktop')
  
  useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth
      
      if (width < 640) setBreakpoint('mobile')
      else if (width < 768) setBreakpoint('tablet')
      else if (width < 1024) setBreakpoint('desktop')
      else setBreakpoint('wide')
    }
    
    checkBreakpoint()
    window.addEventListener('resize', checkBreakpoint)
    
    return () => window.removeEventListener('resize', checkBreakpoint)
  }, [])
  
  return breakpoint
}

// Responsive component
const ResponsiveTherapyCard = ({ children }) => {
  const breakpoint = useBreakpoint()
  
  return (
    <div className={cn(
      'therapy-card',
      breakpoint === 'mobile' && 'mobile-card',
      breakpoint === 'tablet' && 'tablet-card'
    )}>
      {children}
    </div>
  )
}
```

### **Touch-Friendly Components**
```typescript
// Touch-optimized button component
const TouchButton = ({ children, onClick, disabled, variant = 'primary' }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'touch-button',
        `touch-button--${variant}`,
        'min-h-[44px]', // Minimum touch target size
        'min-w-[44px]',
        'px-4 py-3', // Comfortable touch padding
        'text-base', // Readable text size
        'rounded-lg', // Smooth corners
        'transition-all duration-200', // Smooth transitions
        'active:scale-95' // Touch feedback
      )}
      style={{
        touchAction: 'manipulation', // Optimize for touch
        WebkitTapHighlightColor: 'transparent', // Remove tap highlight
        WebkitTouchCallout: 'none' // Disable callout menu
      }}
    >
      {children}
    </button>
  )
}
```

## **Performance Optimization**

### **Mobile Performance**
- **Lazy loading** for heavy components
- **Image optimization** with responsive images
- **Code splitting** for mobile-specific bundles
- **Memory management** for low-memory devices
- **Battery optimization** for background operations

### **Network Efficiency**
- **Offline support** with service worker caching
- **Request batching** for mobile networks
- **Connection adaptation** based on network quality
- **Data compression** for limited bandwidth
- **Background sync** for poor connectivity

## **Accessibility Features**

### **Mobile Accessibility**
- **Screen reader support** with ARIA labels
- **Voice control** compatibility
- **Switch access** for motor impairments
- **Large text support** for visual impairments
- **High contrast mode** compatibility
- **Reduced motion** preferences

### **Touch Accessibility**
- **Large touch targets** (minimum 44x44 pixels)
- **Gesture alternatives** for all interactions
- **Haptic feedback** for touch interactions
- **Voice input** support for text entry
- **One-handed operation** support

## **Testing and Quality Assurance**

### **Mobile Testing**
- **Device testing** on various screen sizes
- **Touch testing** with gesture validation
- **Performance testing** on low-end devices
- **Network testing** with throttled connections
- **Battery testing** for power consumption

### **Cross-Platform Testing**
- **iOS Safari** compatibility
- **Android Chrome** optimization
- **WebView testing** for hybrid apps
- **PWA testing** for installable apps
- **Accessibility testing** for screen readers

## **Dependencies**
- **workbox** - Service worker and PWA utilities
- **react-intersection-observer** - Lazy loading and viewport detection
- **framer-motion** - Smooth animations and gestures
- **react-use-gesture** - Touch gesture recognition
- **react-responsive** - Responsive component utilities
