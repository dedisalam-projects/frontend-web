---
paths:
  - "**/*.ts"
  - "**/*.tsx"
---

# TypeScript Standards

## 1. Type Safety & Strict Mode
- **Strict Compliance**: Maintain `strict: true` across all tsconfig configurations.
- **No `any`**: Strictly prohibit implicit or explicit `any`. Use `unknown` with type guards or discriminating unions instead.
- **Explicit Return Types**: Functions and public API methods must declare explicit return types.
- **Narrowing & Guards**: Use custom type guards (`value is Type`) or property checks (`in`) for runtime type narrowing.

## 2. Immutability & Modern Patterns
- **Readonly Data**: Use `readonly` for array types (`readonly T[]` or `ReadonlyArray<T>`) and interface properties that should not be mutated.
- **Const Assertions**: Use `as const` for literal values, lookup tables, and configuration tuples.
- **Utility Types**: Leverage standard utility types (`Pick`, `Omit`, `Partial`, `Record`, `Readonly`) rather than redefining redundant structures.

## 3. Robust Error Handling
- **Typed Errors**: Throw standard `Error` instances or domain error subclasses with descriptive messages.
- **Narrowing in Catch**: Always narrow caught errors using `if (error instanceof Error)` before accessing `.message`.
