---
name: frontend-patterns
description: "Use when implementing frontend component patterns, state management architectures, performance optimizations, or reviewing UI code."
metadata:
  origin: ECC
---

# Frontend Development Patterns

Modern frontend patterns for React and Next.js applications focusing on component architecture, state management, render performance, and ergonomic hooks.

## When to Activate

- Designing React components (compound components, composition patterns)
- Architecting client-side state (Context + Reducer, Zustand, custom hooks)
- Optimizing render cycles (memoization, lazy loading, virtualization)
- Standardizing form handling and validation pipelines
- Establishing robust React Error Boundaries

---

## 1. Component Composition & Compound Components

Prefer flexible composition over deeply nested prop-drilling:

```typescript
import React, { createContext, useContext, useState } from 'react'

// Compound Component Pattern: Tabs
interface TabsContextType {
  activeTab: string
  setActiveTab: (id: string) => void
}
const TabsContext = createContext<TabsContextType | null>(null)

export function Tabs({ defaultTab, children }: { defaultTab: string; children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState(defaultTab)
  return <TabsContext.Provider value={{ activeTab, setActiveTab }}>{children}</TabsContext.Provider>
}

export function TabTrigger({ id, children }: { id: string; children: React.ReactNode }) {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error('TabTrigger must be used inside Tabs')
  const isActive = ctx.activeTab === id

  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={() => ctx.setActiveTab(id)}
      className={`px-4 py-2 font-medium ${isActive ? 'border-b-2 border-blue-600 text-blue-600' : 'text-zinc-600'}`}
    >
      {children}
    </button>
  )
}

export function TabPanel({ id, children }: { id: string; children: React.ReactNode }) {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error('TabPanel must be used inside Tabs')
  if (ctx.activeTab !== id) return null
  return <div role="tabpanel" className="p-4">{children}</div>
}
```

---

## 2. Essential Custom Hooks

### Debounced Value Hook
```typescript
import { useState, useEffect } from 'react'

export function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
```

### Context + Reducer State Management
For complex component trees where prop drilling degrades maintainability:
```typescript
type CartAction = { type: 'ADD'; item: string } | { type: 'REMOVE'; id: string }

function cartReducer(state: string[], action: CartAction): string[] {
  switch (action.type) {
    case 'ADD': return [...state, action.item]
    case 'REMOVE': return state.filter(i => i !== action.id)
    default: return state
  }
}
```

---

## 3. Render Performance & Optimization

### Pragmatic Memoization
Memoize only when operations are demonstrably expensive or referential stability is required:
```typescript
// PASS: Stable callback passed to memoized child
const handleSelect = useCallback((id: string) => {
  setSelectedId(id)
}, [])

// PASS: Sorting array copy (Array.sort mutates in-place)
const sortedItems = useMemo(() => {
  return [...items].sort((a, b) => b.score - a.score)
}, [items])
```

### Route & Component Code Splitting
```typescript
import { lazy, Suspense } from 'react'

const AnalyticsChart = lazy(() => import('./AnalyticsChart'))

export function Dashboard() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse bg-zinc-100 rounded" />}>
      <AnalyticsChart />
    </Suspense>
  )
}
```

---

## 4. Controlled Form Validation with Zod

```typescript
import { useState } from 'react'
import { z } from 'zod'

const ProfileSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address')
})

export function ProfileForm() {
  const [formData, setFormData] = useState({ username: '', email: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const result = ProfileSchema.safeParse(formData)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach(issue => {
        fieldErrors[issue.path[0] as string] = issue.message
      })
      setErrors(fieldErrors)
      return
    }
    setErrors({})
    console.log('Valid data:', result.data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <input
          value={formData.username}
          onChange={e => setFormData({ ...formData, username: e.target.value })}
          className="border p-2 rounded w-full"
        />
        {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
      </div>
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
    </form>
  )
}
```

---

## 5. React Error Boundary

```typescript
import React, { Component, ReactNode, ErrorInfo } from 'react'

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Captured UI crash:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 border border-red-300 bg-red-50 rounded text-red-700">
          <p className="font-semibold">Something went wrong.</p>
          <button onClick={() => this.setState({ hasError: false })} className="mt-2 text-sm underline">
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
```

---

## Anti-Patterns to Avoid

| Anti-Pattern | Issue | Solution |
|---|---|---|
| Direct state mutation | Silent failure to re-render | Always use immutable updates or spread copies |
| Inline object literals in effects | Infinite render loops | Use primitive dependencies or `useRef` |
| Over-memoization | Overhead outweighs benefit | Profile before wrapping simple primitives in `useMemo` |
| Uncontrolled global state | Unpredictable re-renders | Localize state to the closest common ancestor |

> [!IMPORTANT]
> **Rule Adherence**: Always strictly follow the `frontend-patterns` conventions outlined above to ensure workspace consistency and prevent regressions.
