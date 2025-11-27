# Moon Visual Improvement Requirements

## Overview

Improve the moon visual in the AI Therapist app to be more beautiful and artistic-looking.

## User Requirements

### Visual Style

- **Approach**: Artistic enhancement (beautiful/stylized, not photorealistic)
- **Goal**: More beautiful and realistic-looking moon while maintaining therapeutic aesthetic

### Specific Issues to Address

1. **Craters look fake** - Current procedural circle patterns are too obvious/artificial
2. **Lighting not realistic** - Needs better light/shadow transitions and depth

### Implicit Requirements (based on project context)

- Maintain dark-mode-only design aesthetic
- Keep therapeutic, calming visual style
- Preserve phase-accurate illumination functionality
- Support reduced motion preferences (existing feature)

## Technical Context

### Current Implementation

- Location: `src/features/chat/components/dashboard/realistic-moon.tsx`
- Technology: SVG with Framer Motion animations
- Features:
  - Radial gradients for 3D sphere effect
  - Procedural crater pattern (SVG circles)
  - Multi-layer glow animations
  - Breathing/pulsing effects
  - Background starfield

### Constraints (assumed reasonable defaults)

- **Performance**: Should work smoothly on mobile devices
- **Bundle size**: Prefer minimal increase (<50KB ideal)
- **Technology**: Can enhance SVG or add Canvas, avoid heavy Three.js unless necessary

## Research Findings

### Recommended Approaches for Artistic Enhancement

1. **SVG Turbulence Filters** - Add organic noise/texture to surface
2. **Improved Crater Patterns** - Vary sizes, add shadows, use irregular shapes
3. **Better Gradient System** - Multiple light sources, softer terminator line
4. **Canvas Hybrid** - Optional texture overlay for more realistic surface
5. **Lighting Improvements** - Subsurface scattering effect, rim lighting, atmospheric glow

### Reference Techniques

- CSS box-shadows for crater depth
- SVG feTurbulence for organic surface texture
- Layered gradients for light falloff
- Blur filters for soft shadow edges
