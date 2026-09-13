---
description: "Analyze Angular 22 test coverage across dashboard, landing, auth, and shared-ui projects toward 80%+ threshold."
argument-hint: "[project: dashboard | landing | auth | shared-ui]"
---

# Angular Test Coverage

Analyze test coverage and generate missing unit tests across `frontend-web` projects (`dashboard`, `landing`, `auth`, `shared-ui`) targeting 80%+ branch and statement coverage.

## Step 1: Run Coverage per Project

Use Angular CLI Karma runner or Vitest:

| Target | Framework | Command |
|---|---|---|
| **Dashboard** | Karma/Jasmine | `npx ng test dashboard --no-watch --code-coverage` |
| **Landing** | Karma/Jasmine | `npx ng test landing --no-watch --code-coverage` |
| **Auth** | Karma/Jasmine | `npx ng test auth --no-watch --code-coverage` |
| **Shared UI** | Karma/Jasmine | `npx ng test shared-ui --no-watch --code-coverage` |
| **Vitest Fast Run** | Vitest | `npx vitest run --coverage` |

Report output will be generated under `coverage/<project-name>/index.html` or terminal summary.

## Step 2: Analyze Coverage Report

1. Inspect coverage summary percentages (Statements, Branches, Functions, Lines).
2. Identify files below 80% threshold.
3. Check for:
   - Untested Angular Signals (`computed`, `signal`, `input()`, `output()`).
   - Untested branch logic in component templates (`@if`, `@for`, `@switch`).
   - Error branches in HTTP service calls.

## Step 3: Modern Angular 22 Unit Testing Patterns

### 1. Standalone Component & Signal Inputs
```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserCardComponent } from './user-card.component';

describe('UserCardComponent', () => {
  let component: UserCardComponent;
  let fixture: ComponentFixture<UserCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(UserCardComponent);
    component = fixture.componentInstance;
  });

  it('should reflect signal input changes', () => {
    fixture.componentRef.setInput('username', 'dedisalam');
    fixture.detectChanges();
    expect(component.username()).toBe('dedisalam');
  });
});
```

### 2. HTTP Service Testing with `provideHttpClientTesting`
```typescript
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthService
      ]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should handle login failure', () => {
    service.login('user', 'wrong').subscribe({
      error: (err) => expect(err.status).toBe(401)
    });
    const req = httpMock.expectOne('/api/auth/login');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
  });
});
```

## Step 4: Verification & Gate

1. Re-run `ng test <project> --no-watch --code-coverage`.
2. Verify all tests pass with 0 failures.
3. Confirm statement and branch coverage are at or above 80%.
