---
paths:
  - "**/*.css"
  - "**/*.scss"
  - "**/*.html"
  - "**/*.ts"
---

# Web Performance, Security & Design Standards

## 1. Visual Excellence & Design System
- **Responsive Layout**: Mobile-first architecture supporting 320px to 1440px+ without unexpected horizontal overflow.
- **Design Tokens**: Centralize colors, spacing, and typography using CSS custom properties or design token files. Avoid ad-hoc magic numbers.
- **Typography & Theme**: Use modern typography (Google Fonts / self-hosted fonts like Inter, Roboto) and provide seamless Light / Dark theme support.

## 2. Core Web Vitals & Performance
- **Target Metrics**: LCP < 2.5s, INP < 200ms, CLS < 0.1, FCP < 1.5s.
- **Asset Optimization**:
  - Explicit `width` and `height` attributes on all `<img>` and video elements to prevent layout shifts.
  - Self-host fonts and critical web assets to eliminate external render-blocking roundtrips.
  - Dynamic imports for heavy non-critical dependencies (`await import(...)`).

## 3. Web Security Standards
- **Content Security Policy**: Configure strict CSP with nonces or SHA hashes for scripts.
- **XSS Prevention**: Never inject unsanitized HTML (`innerHTML`). Sanitize any third-party or rich-text content.
- **Secure Headers**: Enforce `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and strict `Referrer-Policy`.

## 4. Accessibility & Motion
- **WCAG 2.2 Level AA**: Ensure accessible color contrast (4.5:1 for normal text, 3:1 for large text).
- **Keyboard & Screen Readers**: All interactive elements must have semantic HTML or ARIA roles and visible focus indicators (`:focus-visible`).
- **Motion Safety**: Respect user system preferences via `@media (prefers-reduced-motion: reduce)`.
