---
name: automated-superadmin-seeding
description: "Use when designing backend authentication bootstrap, or when initial administrative users (superadmin) are missing after fresh database container initialization."
tier: local
target-stacks: ["nestjs", "mongodb", "docker", "typescript"]
metadata:
  origin: auto-extracted
---

# Automated Superadmin Seeding & Idempotent Bootstrap

**Extracted:** 2026-09-13  
**Context:** Automatic, idempotent provisioning of mandatory root/superadmin accounts in NestJS microservices and containerized datastores (MongoDB).

> [!CAUTION]
> **Safety Guardrail**: Modifying superadmin credentials or seeding administrative users in production environments requires explicit user confirmation and authorization. Ensure permissions and environment variables are strictly guarded.

## Problem
In containerized and microservice architectures, developers or CI pipelines frequently recreate datastore volumes (`docker compose down -v`). If initial admin seeding is isolated inside external manual scripts (e.g., `node scripts/seed.js`) or empty database init scripts (`mongo-init.js`), the mandatory `super_admin` account will be missing on application startup, causing authentication failures and breaking automated integration/E2E pipelines.

## Solution

Implement a two-tier, fail-safe idempotent bootstrapping architecture:

### 1. In-App Lifecycle Seeder (NestJS `OnApplicationBootstrap`)
Ensure the authentication or user service automatically verifies and seeds the superadmin on startup:

```typescript
import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class SuperadminSeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SuperadminSeederService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    await this.seedSuperadmin();
  }

  private async seedSuperadmin(): Promise<void> {
    const adminEmail = this.configService.get<string>('DEFAULT_SUPERADMIN_EMAIL') || 'superadmin@example.com';
    const adminPass = this.configService.get<string>('DEFAULT_SUPERADMIN_PASSWORD') || 'Admin123!';

    const existingAdmin = await this.userModel.findOne({
      $or: [{ email: adminEmail }, { role: 'super_admin' }]
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPass, 10);
      await this.userModel.create({
        email: adminEmail,
        password: hashedPassword,
        name: 'Super Administrator',
        role: 'super_admin',
        isActive: true,
      });
      this.logger.log(`🎉 Automated Seeding: Superadmin created successfully (${adminEmail})`);
    } else {
      this.logger.log(`ℹ️ Automated Seeding: Superadmin already provisioned (${existingAdmin.email})`);
    }
  }
}
```

### 2. Container Init Hook (`mongo-init.js`)
Ensure `infrastructure/docker/mongodb/mongo-init.js` provisions the initial administrative document if pre-seeding before application startup is required:

```javascript
db = db.getSiblingDB('user_db');
db.createCollection('users');

const adminExists = db.users.findOne({ email: 'superadmin@example.com' });
if (!adminExists) {
  db.users.insertOne({
    email: 'superadmin@example.com',
    password: '<pre-computed-bcrypt-hash>',
    name: 'Super Administrator',
    role: 'super_admin',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });
}
```

## When to Use
- When configuring user/identity services in multi-container development or staging setups.
- When E2E test suites report missing superadmin credentials following database resets.
- When moving database seeding from manual scripts into production-ready resilient service lifecycles.


> [!IMPORTANT]
> **Rule Adherence**: Always strictly follow the `automated-superadmin-seeding` conventions outlined above to ensure workspace consistency and prevent regressions.
