---
name: motion-ui
description: "Use when implementing UI animations, page transitions, interactive hover effects, or motion design systems."
metadata:
  origin: ECC
---

# Motion System v4.2

Production-ready UI motion system for React / Next.js. Focused on **performance, accessibility, and usability** — not decoration.

## When to Use

Use this motion system when motion:
* Guides attention (e.g., onboarding, key actions)
* Communicates state (loading, success, error, transitions)
* Preserves spatial continuity (layout changes, navigation)

### Avoid Using Motion When
* It is purely decorative or distracting
* It reduces usability or clarity
* It impacts performance negatively (prefer responsiveness over smoothness)

---

## Core Rules & Setup

### Package & Imports
```bash
npm install motion
```

Always import from one source consistently — do **not** mix `motion/react` and `framer-motion`:
```ts
// Modern standard
import { motion, AnimatePresence, useReducedMotion, useScroll, useTransform } from "motion/react"
```

### Motion Tokens
```ts
// lib/motionTokens.ts
export const motionTokens = {
  duration: { fast: 0.18, normal: 0.35, slow: 0.6 },
  easing: {
    smooth: [0.22, 1, 0.36, 1] as [number, number, number, number],
    sharp:  [0.4,  0, 0.2, 1] as [number, number, number, number]
  },
  distance: { sm: 8, md: 16, lg: 24 }
}
```

### Performance & Accessibility
* **GPU-Accelerated**: Animate only `transform` and `opacity`. Avoid animating layout geometry (`width`, `height`, `top`, `left`).
* **Reduced Motion**: Always honor `useReducedMotion()` or `@media (prefers-reduced-motion: reduce)`.

```tsx
import { motion, useReducedMotion } from "motion/react"
import { motionTokens } from "@/lib/motionTokens"

export function FadeIn({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion()

  return (
    <motion.div
      initial={{ opacity: 0, y: reduce ? 0 : motionTokens.distance.md }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0.1 : motionTokens.duration.normal, ease: motionTokens.easing.smooth }}
    >
      {children}
    </motion.div>
  )
}
```

---

## Patterns & Architecture

| Scenario | Pattern | Best Practice |
|---|---|---|
| Hover / Tap feedback | `whileHover`, `whileTap` | Keep scale micro (`1.02` / `0.98`), duration `<= 0.15s` |
| Scroll reveal / Parallax | `whileInView`, `useScroll` + `useTransform` | Use `viewport={{ once: true }}` for performance |
| Conditional mount/unmount | `AnimatePresence` | Always specify `mode="wait"` or `mode="popLayout"` |
| Shared element transition | `layoutId` | Unique ID per mounted instance (`layoutId={`item-${id}`}`) |
| Layout shifts | `layout` prop | Use only on small local items (<300px); avoid full viewport reflow |

### AnimatePresence Mode Selection

Always set `mode` explicitly; default `"sync"` causes overlapping DOM elements:
* `mode="wait"`: Exit completes before entry begins. Essential for modals, dialogs, page transitions.
* `mode="popLayout"`: Exiting element pops out of document flow immediately. Essential for lists and tab switches.

---

## Key UI Examples

### 1. Interactive Button
```tsx
import { motion } from "motion/react"

export function ActionButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
      onClick={onClick}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm"
    >
      {children}
    </motion.button>
  )
}
```

### 2. Modal with AnimatePresence & Backdrop
```tsx
import { motion, AnimatePresence } from "motion/react"

export function Modal({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode
}) {
  return (
    <AnimatePresence mode="wait">
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-2xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="modal-title" className="text-xl font-bold">{title}</h2>
            <div className="mt-4">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

### 3. Staggered List
```tsx
import { motion } from "motion/react"

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } } // Keep ≤ 0.1s
}
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } }
}

export function StaggerList({ items }: { items: string[] }) {
  return (
    <motion.ul variants={listVariants} initial="hidden" animate="visible" className="space-y-2">
      {items.map((item, idx) => (
        <motion.li key={idx} variants={itemVariants} className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded">
          {item}
        </motion.li>
      ))}
    </motion.ul>
  )
}
```

### 4. Scroll Parallax
```tsx
import { useScroll, useTransform, motion } from "motion/react"

export function ScrollParallax() {
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], [0, -60])

  return <motion.div style={{ y }} className="relative will-change-transform" />
}
```

### 5. Skeleton Loading Pulse
```tsx
import { motion } from "motion/react"

export function SkeletonItem() {
  return (
    <motion.div
      className="bg-zinc-200 dark:bg-zinc-700 h-6 w-full rounded-md"
      animate={{ opacity: [0.4, 0.9, 0.4] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
    />
  )
}
```

---

## Anti-Patterns to Avoid
1. **Layout Property Animation**: Never animate `width`, `height`, `margin`, `top`, or `left`. Use `scale`, `x`, `y`, `opacity`.
2. **Missing `AnimatePresence mode`**: Omitting `mode` causes synchronous entrance/exit collisions.
3. **Missing `"use client"`**: In Next.js App Router, components with motion hooks require `"use client"`.
4. **Excessive Stagger Duration**: `staggerChildren` > 0.1s feels sluggish and unresponsive.
5. **Ignoring User Preferences**: Failing to test `prefers-reduced-motion` breaches accessibility guidelines.

> [!IMPORTANT]
> **Rule Adherence**: Always strictly follow the `motion-ui` conventions outlined above to ensure workspace consistency and prevent regressions.
