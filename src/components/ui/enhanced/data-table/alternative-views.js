/**
 * Interactive functionality for alternative table views
 * Handles expand/collapse for complex data views
 */

// Initialize alternative view interactions when the DOM is loaded
document.addEventListener('DOMContentLoaded', initializeAlternativeViews);

// Also initialize when new content is dynamically added (for React apps)
if (typeof window !== 'undefined' && window.MutationObserver) {
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Check if any added nodes contain alternative views
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const altViews = node.querySelectorAll ? 
              node.querySelectorAll('.alternative-view-container') : [];
            if (altViews.length > 0 || node.classList?.contains('alternative-view-container')) {
              initializeAlternativeViews();
            }
          }
        });
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

/**
 * Initialize all alternative view interactions
 */
function initializeAlternativeViews() {
  initializeExpandableRows();
  initializeCardInteractions();
  initializeKeyboardNavigation();
}

/**
 * Handle expandable row functionality
 */
function initializeExpandableRows() {
  const expandButtons = document.querySelectorAll('.expand-button:not([data-initialized])');
  
  expandButtons.forEach(button => {
    button.setAttribute('data-initialized', 'true');
    button.addEventListener('click', handleRowExpansion);
    
    // Keyboard support
    button.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleRowExpansion.call(this, e);
      }
    });
  });
}

/**
 * Handle row expansion/collapse
 */
function handleRowExpansion(event) {
  const button = event.target;
  const expandableRow = button.closest('.expandable-row');
  const details = expandableRow?.querySelector('.row-details');
  
  if (!details) return;
  
  const isExpanded = button.getAttribute('aria-expanded') === 'true';
  const newState = !isExpanded;
  
  // Update button state
  button.setAttribute('aria-expanded', newState.toString());
  
  // Toggle details visibility
  if (newState) {
    details.removeAttribute('hidden');
    details.style.display = 'block';
    
    // Smooth reveal animation
    details.style.opacity = '0';
    details.style.transform = 'translateY(-10px)';
    
    requestAnimationFrame(() => {
      details.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
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
  
  // Announce state change to screen readers
  announceStateChange(button, newState ? 'expanded' : 'collapsed');
}

/**
 * Enhanced card interactions and accessibility
 */
function initializeCardInteractions() {
  const cards = document.querySelectorAll('.structured-card:not([data-initialized])');
  
  cards.forEach(card => {
    card.setAttribute('data-initialized', 'true');
    
    // Add keyboard focus support
    if (!card.hasAttribute('tabindex')) {
      card.setAttribute('tabindex', '0');
    }
    
    // Add role for screen readers
    if (!card.hasAttribute('role')) {
      card.setAttribute('role', 'article');
    }
    
    // Add aria-label for better accessibility
    const primaryField = card.querySelector('.primary-field .field-value');
    if (primaryField && !card.hasAttribute('aria-label')) {
      card.setAttribute('aria-label', `Data record: ${primaryField.textContent?.trim()}`);
    }
    
    // Focus styling
    card.addEventListener('focus', function() {
      this.style.outline = '2px solid hsl(var(--primary))';
      this.style.outlineOffset = '2px';
    });
    
    card.addEventListener('blur', function() {
      this.style.outline = '';
      this.style.outlineOffset = '';
    });
  });
}

/**
 * Keyboard navigation for alternative views
 */
function initializeKeyboardNavigation() {
  const containers = document.querySelectorAll('.alternative-view-container:not([data-keyboard-initialized])');
  
  containers.forEach(container => {
    container.setAttribute('data-keyboard-initialized', 'true');
    container.addEventListener('keydown', handleContainerKeyNavigation);
  });
}

/**
 * Handle keyboard navigation within alternative view containers
 */
function handleContainerKeyNavigation(event) {
  const container = event.currentTarget;
  const focusableElements = container.querySelectorAll(
    '.structured-card, .expand-button, .expandable-row .row-summary, .therapeutic-definition-list'
  );
  
  if (focusableElements.length === 0) return;
  
  const currentIndex = Array.from(focusableElements).indexOf(event.target);
  let nextIndex;
  
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
}

/**
 * Announce state changes to screen readers
 */
function announceStateChange(element, state) {
  // Create a temporary announcement element
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = `Row details ${state}`;
  
  // Add to DOM briefly for screen reader announcement
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}


/**
 * Export functions for use in module environments
 */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initializeAlternativeViews,
    initializeExpandableRows,
    initializeCardInteractions,
    initializeKeyboardNavigation
  };
}