# Unit Test Plan

## Framework & Setup

**Framework:** Vitest (recommended for SvelteKit)
**Environment:** `happy-dom` for any DOM-related tests

```bash
npm install -D vitest @vitest/ui happy-dom
```

**vitest.config.ts:**
```typescript
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['src/**/*.test.ts']
  }
});
```

**package.json script:**
```json
"test": "vitest run",
"test:watch": "vitest"
```

---

## Test Suites

### 1. `src/lib/utils/sizes.test.ts` — Size Conversion Tables

Pure lookup functions with no dependencies. Highest test value, easiest to write.

#### `lookupClothingByDe(de)`
- Returns correct row for valid DE size (`"86"` → heightMin 81, heightMax 86)
- Returns correct row for mid-range size (`"128"` → us `"8"`)
- Returns correct row for largest size (`"176"`)
- Returns `undefined` for invalid size (`"100"`, `""`, `"abc"`)

#### `lookupClothingByEu(eu)`
- Returns same result as `lookupClothingByDe` (DE === EU for children)

#### `lookupClothingByUs(us)`
- Returns correct row for `"2T"`, `"4T"`, `"10"`, `"22"`
- Case-insensitive: `"2t"` matches `"2T"`
- Returns `undefined` for invalid US size

#### `lookupClothingByUk(uk)`
- Returns correct row for `"1.5-2Y"`, `"8-9Y"`, `"16-17Y"`
- Case-insensitive: `"1.5-2y"` matches `"1.5-2Y"`
- Returns `undefined` for invalid UK size

#### `lookupClothingByHeight(heightCm)`
- Returns correct row at lower boundary (`81` → size 86)
- Returns correct row at upper boundary (`86` → size 86)
- Returns correct row mid-range (`84` → size 86)
- Returns correct row at size boundary (`87` → size 92, not 86)
- Returns `undefined` for height below range (`80`)
- Returns `undefined` for height above range (`177`)

#### `resolveClothingSize(field, value)`
- Dispatches to `lookupClothingByDe` for field `"de"`
- Dispatches to `lookupClothingByEu` for field `"eu"`
- Dispatches to `lookupClothingByUs` for field `"us"`
- Dispatches to `lookupClothingByUk` for field `"uk"`

#### `lookupShoeByEu(eu)`
- Returns correct row for `"20"` (us `"4C"`, footLengthCm 12.5)
- Returns correct row for `"32"` (us `"1Y"` — child-to-youth transition)
- Returns correct row for `"40"`
- Returns `undefined` for `"19"`, `"41"`, `""`

#### `lookupShoeByUs(us)`
- Returns correct row for child sizes (`"4C"`, `"12C"`)
- Returns correct row for youth sizes (`"1Y"`, `"7Y"`)
- Case-insensitive: `"4c"` matches `"4C"`
- Returns `undefined` for invalid US shoe size

#### `lookupShoeByUk(uk)`
- Returns correct row for `"3.5"`, `"13"`, `"6"`
- Returns `undefined` for invalid UK shoe size

#### `resolveShoeSize(field, value)`
- Dispatches to correct lookup for each field (`"eu"`, `"us"`, `"uk"`)

#### `isShoeType(type)`
- Returns `true` for `"shoes"`
- Returns `false` for `"kleid"`, `"hemd"`, `"hose"`, `""`, `"Shoes"`

---

### 2. `src/lib/utils/growth.test.ts` — Growth Prediction Algorithm

Pure functions with complex branching logic. Critical business logic.

#### `getSizeForHeight(heightCm)`
- Returns `"86"` for 81, 83, 86 (lower boundary, mid, upper boundary)
- Returns `"92"` for 87 (boundary between sizes)
- Returns `"176"` for 171, 176
- Returns `"176+"` for 177, 200
- Returns `"<86"` for 80, 50
- Returns `null` only if unreachable (all ranges covered by the above)

#### `getSizeRange(size)`
- Returns `{ minCm: 81, maxCm: 86 }` for `"86"`
- Returns `{ minCm: 171, maxCm: 176 }` for `"176"`
- Returns `null` for `"180"`, `""`, `"abc"`

#### `getNextSize(currentSize)`
- Returns `"92"` for `"86"` (first → second)
- Returns `"176"` for `"170"` (second-to-last → last)
- Returns `null` for `"176"` (last size, no next)
- Returns `null` for `"abc"` (invalid size)

#### `predictGrowth(childId, childName, measurements, monthsAhead)`

**Returns null (insufficient data):**
- Empty measurements array
- Only 1 measurement with height
- Two measurements, but both have `heightCm: null`
- Two measurements less than 14 days apart
- Two measurements where height decreased (negative growth)

**Returns prediction (valid inputs):**

Helper: create measurements factory
```typescript
function makeMeasurements(data: Array<[daysAgo: number, heightCm: number, size?: string]>) {
  const now = new Date();
  return data.map(([daysAgo, heightCm, size]) => ({
    measuredAt: new Date(now.getTime() - daysAgo * 86400000),
    heightCm,
    clothingSizeDe: size ?? null
  }));
}
```

- **Growth rate calculation:** two measurements 60 days apart, heights 100→103
  - Expected rate: `(3 / 60) * 30.44 ≈ 1.52 cm/month`
- **Urgency "high":** child near top of size range (heightCm close to maxCm), will outgrow within 1 month
- **Urgency "medium":** will outgrow within `monthsAhead` (default 3)
- **Urgency "low":** will outgrow after `monthsAhead` but within `monthsAhead * 2`
- **Returns null (too far out):** outgrow date beyond `monthsAhead * 2`
- **Already outgrown:** heightCm exceeds current size's maxCm → urgency `"high"`, predictedOutgrowDate ≈ now
- **Uses clothingSizeDe when available:** if measurement has size `"104"`, uses that instead of calculating from height
- **Falls back to getSizeForHeight:** when clothingSizeDe is null
- **nextSize:** correctly returns next size up, or `null` for size `"176"`
- **Custom monthsAhead:** passing `monthsAhead=6` extends the window

---

### 3. `src/lib/server/roles.test.ts` — RBAC Utilities

Pure functions. Small but critical for security.

#### `hasRole(userRole, ...allowedRoles)`
- Returns `true` when role matches single allowed role (`"admin"`, `["admin"]`)
- Returns `true` when role matches one of multiple allowed roles (`"receptionist"`, `["admin", "receptionist"]`)
- Returns `false` when role doesn't match any (`"laundry"`, `["admin", "receptionist"]`)
- Returns `false` when userRole is `undefined`
- Returns `false` when userRole is `""` (empty string)
- Returns `true` for each valid role when it's in the allowed list

#### `requireRole(userRole, ...allowedRoles)`
- Does not throw when role is allowed
- Throws error (403) when role is not allowed
- Throws error (403) when userRole is `undefined`

#### `ROUTE_ACCESS` constant
- `/personnel` only allows `["admin"]`
- `/assignments` allows `["admin", "receptionist"]`
- `/dispatch` allows `["admin", "receptionist"]`
- Routes not listed (e.g., `/children`, `/todos`) are not in the map (open to all authenticated users)

---

### 4. `src/lib/server/password.test.ts` — Password Hashing

Async functions wrapping Scrypt. Tests verify the hash/verify contract.

#### `hashPassword(password)`
- Returns a non-empty string
- Returns different hash for same password on successive calls (salted)
- Returned hash is verifiable with `verifyPassword`

#### `verifyPassword(hash, password)`
- Returns `true` for correct password
- Returns `false` for incorrect password
- Returns `false` for empty password against a valid hash

---

### 5. `src/hooks.server.test.ts` — Request Middleware

Requires mocking `validateSession`, `lucia`, cookies, and SvelteKit `redirect`/`error`. Use `vi.mock()`.

#### Authentication flow
- Calls `validateSession(event)` on every request
- Allows `/login` without authentication (does not redirect)
- Allows `/api/auth/*` without authentication
- Redirects to `/login` (302) when `event.locals.user` is null and path is not `/login`

#### Role-based route protection
- Allows admin to access `/personnel`
- Blocks receptionist from accessing `/personnel` (403)
- Blocks laundry from accessing `/personnel` (403)
- Allows admin to access `/assignments`
- Allows receptionist to access `/assignments`
- Blocks laundry from accessing `/assignments` (403)
- Allows any authenticated role to access `/children` (not in ROUTE_ACCESS)
- Allows any authenticated role to access `/todos`
- Matches sub-routes: `/personnel/something` is also admin-only

---

### 6. `src/routes/personnel/+page.server.test.ts` — Personnel Actions

Requires mocking Prisma (`vi.mock('$lib/server/db')`).

#### `create` action
- Creates user with hashed password when all fields provided
- Returns `fail(400)` when any required field is missing (name, username, password, email, role)
- Returns `fail(400)` when username already exists
- Stores hashed password, not plaintext

#### `update` action
- Updates name, email, role, active status
- Hashes and updates password when provided
- Does not change password when password field is empty
- Returns `fail(400)` when id, name, email, or role is missing

#### `delete` action
- Deletes user by id
- Returns `fail(400)` when id is missing
- Prevents deleting the last admin (returns `fail(400)`)
- Allows deleting a non-admin user
- Allows deleting an admin when another admin exists

#### `toggleActive` action
- Toggles `active` from true to false and vice versa
- Returns `fail(400)` when id is missing
- Returns `fail(404)` when user not found
- Prevents deactivating the last active admin

---

### 7. `src/routes/children/+page.server.test.ts` — Children Actions

#### `create` action
- Creates child with firstName, lastName, birthDate (parsed as Date), gender
- Returns `fail(400)` when any required field is missing
- Requires admin role (calls `requireRole`)

#### `update` action
- Updates all child fields including notes and active status
- Handles `active` checkbox (`"on"` → true, missing → false)
- Returns `fail(400)` when required fields are missing
- Requires admin role

#### `addMeasurement` action
- Creates measurement linked to child
- Parses float fields correctly (`"100.5"` → 100.5)
- Stores `null` for empty/missing numeric fields
- Stores `null` for empty string fields (clothingSizeDe, etc.)
- Returns `fail(400)` when childId is missing

#### `addParent` action
- Creates parent contact with name, phone, email, relation
- Defaults relation to `"parent"` when not specified
- Returns `fail(400)` when childId or name is missing

#### `deleteParent` / `delete` actions
- Deletes by id
- Returns `fail(400)` when id is missing
- Requires admin role

---

### 8. `src/routes/todos/+page.server.test.ts` — Todo Actions

#### `create` action
- Creates todo with type, title, description, priority, assignedTo, dueDate
- Defaults priority to `"normal"`, description to `""`
- Parses dueDate string to Date, or null if empty
- Returns `fail(400)` when type or title is missing
- Requires admin or receptionist role

#### `update` action
- Updates all todo fields
- Returns `fail(400)` when id, type, or title is missing
- Requires admin or receptionist role

#### `updateStatus` action
- Updates only the status field
- Allows admin/receptionist to update any task's status
- Restricts laundry/mender to update only tasks assigned to them
- Returns `fail(403)` when laundry/mender tries to update unassigned task
- Returns `fail(400)` when id or status is missing

#### `delete` action
- Deletes todo by id
- Returns `fail(400)` when id is missing
- Requires admin or receptionist role

#### Priority sorting (load function)
- Sorts by priority order: urgent (0) → high (1) → normal (2) → low (3)
- Within same priority, sorts by dueDate ascending (nulls last)
- Within same priority and dueDate, sorts by createdAt descending

---

### 9. `src/routes/inventory/+page.server.test.ts` — Inventory Actions

#### `createBag` / `updateBag` actions
- Creates/updates bag with type, label, condition, notes
- Returns `fail(400)` when type or label is missing
- `createBag` requires admin; `updateBag` allows admin, laundry, mender

#### `createClothing` / `updateClothing` actions
- Creates/updates clothing piece with type, sizes, color, condition, season, bagId, notes
- Returns `fail(400)` when type is missing
- Handles optional bagId (empty string → `null`)
- Allows multiple size systems (DE, EU, US, UK)

#### `deleteBag` / `deleteClothing` actions
- Deletes by id; returns `fail(400)` when id missing
- Requires admin role

---

### 10. `src/routes/assignments/+page.server.test.ts` — Assignment Actions

#### `assignBag` action
- Creates BagAssignment linking bag to child
- Prevents duplicate assignment (bag already assigned → `fail(400)`)
- Returns `fail(400)` when bagId or childId is missing

#### `unassignBag` action
- Deletes BagAssignment by id
- Returns `fail(400)` when id is missing

#### `assignClothing` / `unassignClothing` actions
- Same pattern as bag assignment/unassignment
- Prevents duplicate clothing assignment

---

### 11. `src/lib/server/email.test.ts` — Email Operations

Requires mocking Prisma and Nodemailer.

#### `getSmtpSettings()`
- Returns existing settings when found
- Creates and returns default settings when none exist

#### `createTransporter()`
- Returns Nodemailer transporter when SMTP host is configured
- Returns `null` when SMTP host is empty/missing
- Uses port 465 → `secure: true`; other ports → `secure: false`

#### `sendEmail(to, subject, body, sentBy)`
- Sends email and logs with status `"sent"` on success
- Logs with status `"failed"` and returns error when SMTP not configured
- Logs with status `"failed"` and returns error when send throws
- Uses `smtpFrom` as sender; falls back to `smtpUser`

#### `sendGigReminders(gigId, sentBy)`
- Returns error when gig not found
- Sends email to each active user with open todos
- Email body contains gig name, formatted date (German locale), location
- Email body lists user's open todos with title, type, priority
- Returns results array with per-user success/failure

---

### 12. `src/routes/login/+page.server.test.ts` — Authentication

#### `login` action
- Redirects to dashboard on successful login
- Creates session via Lucia
- Returns `fail(400)` when username is missing
- Returns `fail(400)` when password is missing
- Returns `fail(400)` when user not found
- Returns `fail(400)` when account is inactive
- Returns `fail(400)` when password is incorrect

---

## Priority Order for Implementation

| Priority | Suite | Reason |
|----------|-------|--------|
| 1 | `sizes.test.ts` | Pure functions, zero dependencies, highest coverage/effort ratio |
| 2 | `growth.test.ts` | Pure functions, complex branching, critical business logic |
| 3 | `roles.test.ts` | Pure functions, security-critical |
| 4 | `password.test.ts` | Simple async, verifies hash contract |
| 5 | `personnel/+page.server.test.ts` | Last-admin protection is critical safety logic |
| 6 | `todos/+page.server.test.ts` | Role-restricted status updates, priority sorting |
| 7 | `children/+page.server.test.ts` | Measurement parsing, CRUD validation |
| 8 | `inventory/+page.server.test.ts` | CRUD validation |
| 9 | `assignments/+page.server.test.ts` | Duplicate assignment prevention |
| 10 | `email.test.ts` | Mock-heavy but important for reminder reliability |
| 11 | `hooks.server.test.ts` | Route protection (integration-like) |
| 12 | `login/+page.server.test.ts` | Auth flow (integration-like) |
