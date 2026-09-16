---
name: realtime-dual-path-state-deduplication
description: "Use when submitting mutations in realtime apps causes duplicate rows, or when WebSocket broadcast events race against RPC/HTTP response acknowledgments — implement symmetric state deduplication across direct mutation handlers and realtime socket listeners."
tier: local
target-stacks: ["angular", "typescript", "socket.io", "nestjs"]
metadata:
  origin: auto-extracted
---

# Realtime Dual-Path State Deduplication

**Extracted:** 2026-09-16  
**Context:** Prevents duplicate items in client-side reactive state (such as Angular Signals, NgRx, or Zustand) when both an RPC/HTTP mutation acknowledgment and a WebSocket room broadcast update the same collection.

## Problem
In real-time web applications, adding or updating an entity typically triggers two concurrent state ingestion paths:
1. **Direct Mutation Path**: The form submission waits for `await apiService.createItem(...)` and pushes the result to state: `items.update(list => [created, ...list])`.
2. **Realtime Broadcast Path**: The backend broadcasts `item:created` via WebSockets to all room members (including the originating client), which also pushes to state: `items.update(list => [broadcasted, ...list])`.

Due to network variance, the WebSocket broadcast frequently arrives *before* the RPC ACK resolves. If either handler appends without mutual deduplication, the newly created record is rendered twice in the UI ("submit 1 data, appears as 2").

## Solution
Implement **symmetric deduplication** on both the mutation submission callback and the realtime event listeners using a composite identity check:

```typescript
// 1. In Form Submission Handler (e.g., saveUser)
async saveUser() {
    const created = await this.userService.createUser(payload);

    this.users.update((current) => {
        const exists = current.some(
            (u) => (created.id && (u.id === created.id || (u as any)._id === created.id)) ||
                   (created.email && u.email?.toLowerCase() === created.email?.toLowerCase())
        );
        if (exists) {
            // Already ingested by incoming WebSocket broadcast
            return current;
        }
        return [created, ...current];
    });
}

// 2. In Realtime Socket Event Handler
this.socket.on('user:created', (payload: any) => {
    const data = payload?.data || payload;
    const newUser = data?.user || data;
    if (newUser && (newUser.id || newUser._id)) {
        const mapped: User = {
            id: newUser.id || newUser._id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            isActive: newUser.isActive !== undefined ? newUser.isActive : true,
            createdAt: newUser.createdAt || new Date().toISOString()
        };

        this.users.update((current) => {
            const exists = current.some(
                (u) => (mapped.id && (u.id === mapped.id || (u as any)._id === mapped.id)) ||
                       (mapped.email && u.email?.toLowerCase() === mapped.email?.toLowerCase())
            );
            if (exists) return current;
            return [mapped, ...current];
        });
    }
});
```

## Key Rules
1. **Never Unconditionally Prepend/Append**: Always test `current.some(...)` before mutating collection signals or arrays.
2. **Check Primary and Secondary Identity**: Check both system ID (`id` / `_id`) and unique business natural keys (e.g. `email` or `slug`).
3. **Handle Fast Socket Arrivals**: Expect the WebSocket broadcast to arrive before the HTTP/RPC response returns.

## When to Use
- When creating, cloning, or inserting entities in applications with active WebSocket/Socket.IO real-time sync.
- When an action causes duplicate entries to briefly or permanently appear in lists or datatables.
