/**
 * React hook for alternative table views
 * Handles expand/collapse and accessibility for complex data views
 */

import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook to initialize alternative view functionality
 */
export function useAlternativeViews() {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleExpandClick = useCallback((event: Event) => {
    const button = event.target as HTMLButtonElement;
    const expandableRow = button.closest('.expandable-row');
    const details = expandableRow?.querySelector('.row-details') as HTMLElement;
    
    if (!details) return;
    
    const isExpanded = button.getAttribute('aria-expanded') === 'true';
    const newState = !isExpanded;
    
    // Update button state
    button.setAttribute('aria-expanded', newState.toString());
    
    // Toggle details visibility with animation
    if (newState) {
      details.removeAttribute('hidden');
      details.style.display = 'block';
      
      // Smooth reveal animation
      details.style.opacity = '0';
      details.style.transform = 'translateY(-10px)';
      details.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      
      requestAnimationFrame(() => {
        details.style.opacity = '1';
        details.style.transform = 'translateY(0)';
      });
    } else {
      details.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      details.style.opacity = '0';
      details.style.transform = 'translateY(-10px)';
      
      setTimeout(() => {
        details.setAttribute('hidden', '');
        details.style.display = 'none';
        details.style.transition = '';
        details.style.opacity = '';
        details.style.transform = '';
      }, 300);
    }
  }, []);

  const handleKeyNavigation = useCallback((event: KeyboardEvent) => {
    if (!containerRef.current) return;
    
    const focusableElements = containerRef.current.querySelectorAll(
      '.structured-card, .expand-button, .therapeutic-definition-list'
    ) as NodeListOf<HTMLElement>;
    
    if (focusableElements.length === 0) return;
    
    const currentIndex = Array.from(focusableElements).indexOf(event.target as HTMLElement);
    if (currentIndex === -1) return;
    
    let nextIndex: number;
    
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        nextIndex = (currentIndex + 1) % focusableElements.length;
        focusableElements[nextIndex].focus();
        break;
        
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        nextIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1;
        focusableElements[nextIndex].focus();
        break;
        
      case 'Home':
        event.preventDefault();
        focusableElements[0].focus();
        break;
        
      case 'End':
        event.preventDefault();
        focusableElements[focusableElements.length - 1].focus();
        break;
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Initialize expand buttons
    const expandButtons = container.querySelectorAll('.expand-button');
    expandButtons.forEach(button => {
      button.addEventListener('click', handleExpandClick as EventListener);
    });

    // Initialize cards with focus support
    const cards = container.querySelectorAll('.structured-card');
    cards.forEach(card => {
      if (!card.hasAttribute('tabindex')) {
        card.setAttribute('tabindex', '0');
      }
      if (!card.hasAttribute('role')) {
        card.setAttribute('role', 'article');
      }
    });

    // Add keyboard navigation
    container.addEventListener('keydown', handleKeyNavigation as EventListener);

    return () => {
      expandButtons.forEach(button => {
        button.removeEventListener('click', handleExpandClick as EventListener);
      });
      container.removeEventListener('keydown', handleKeyNavigation as EventListener);
    };
  }, [handleExpandClick, handleKeyNavigation]);

  return { containerRef };
}

/**
 * Alternative View Wrapper Component
 * Use this to wrap alternative view content with proper functionality
 */
import React from 'react';

interface AlternativeViewWrapperProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Sanitize HTML string by removing dangerous attributes and script tags
 * This is a basic sanitizer - in production, consider using DOMPurify
 */
function sanitizeHtml(html: string): string {
  // Remove script tags completely
  let sanitized = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  
  // Remove dangerous event handlers (onclick, onload, etc.)
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*[^\s>]+/gi, '');
  
  // Remove javascript: protocol URLs
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  return sanitized;
}

export function AlternativeViewWrapper({ children, className = '' }: AlternativeViewWrapperProps) {
  const { containerRef } = useAlternativeViews();
  
  return (
    <div 
      ref={containerRef} 
      className={`alternative-view-wrapper ${className}`}
      dangerouslySetInnerHTML={typeof children === 'string' ? { __html: sanitizeHtml(children) } : undefined}
    >
      {typeof children === 'string' ? null : children}
    </div>
  );
}