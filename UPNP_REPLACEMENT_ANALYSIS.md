# UPnP Replacement Analysis
**Date:** November 18, 2025
**Analyst:** Senior Engineer Review

---

## Current nat-api Usage Analysis

### API Surface Map

**Package:** `nat-api@0.3.1`

**Methods Used:**
1. `new NatAPI()` - Constructor, creates client instance
2. `client.map(options, callback)` - Create port mapping
3. `client.getMappings(callback)` - List all port mappings
4. `client.unmap(options, callback)` - Remove port mapping
5. `client.close()` - Cleanup (optional, checked before use)

### Exact Call Sites

**File:** `src/core/network.ts`

#### 1. Port Mapping Creation (Line 120-149)
```typescript
const client = new NatAPI();
client.map(
  {
    publicPort: port,
    privatePort: port,
    protocol: 'TCP',
    description: 'LazyCraftLauncher Minecraft Server',
    ttl: 0,
  },
  (err: Error | null) => {
    // Handle callback
  }
);
```

#### 2. Mapping Verification (Line 189-207)
```typescript
const client = new NatAPI();
client.getMappings((err: Error | null, results: any[]) => {
  // Verify our port is in the results
});
```

#### 3. Mapping Removal (Line 500-521)
```typescript
const client = new NatAPI();
client.unmap(
  {
    publicPort: port,
    protocol: 'TCP',
  },
  (err: Error | null) => {
    // Handle callback
  }
);
```

### Current Safeguards

✅ **Already implemented:**
- Timeout protection (10s for map, 5s for getMappings)
- Retry logic with exponential backoff (3 attempts)
- Defensive `client.close()` checks
- Graceful fallback on failure
- Error logging without crashing

### Critical Observations

1. **Callback Hell:** All methods use Node.js callback pattern, wrapped in Promises
2. **Unreliable Close:** Code checks `typeof client.close === 'function'` - suggests instability
3. **Verification Fallback:** If verification fails, assumes success (line 214) - pragmatic
4. **Non-Critical Feature:** UPnP failure doesn't block app startup
5. **Already Isolated:** UPnP code is well-contained in network.ts

---

## Vulnerability Analysis

### Direct Dependencies of nat-api@0.3.1

```
nat-api@0.3.1
├── async@3.2.6
├── default-gateway@6.0.3
├── request@2.88.2 ⚠️ DEPRECATED
│   ├── form-data@2.3.3 🔴 CVE (< 2.5.4)
│   ├── tough-cookie@2.5.0 ⚠️ CVE (< 4.1.3)
│   └── [19 other subdependencies]
└── xml2js@0.4.23 ⚠️ CVE (< 0.5.0)
```

### Attack Surface Assessment

**Exploitability Score: LOW** ⚠️

Reasons:
1. **Localhost-only API** - No external exposure
2. **UPnP runs on LAN** - Already trusted network
3. **form-data vulnerability** - Boundary generation weakness (low impact for LAN)
4. **No user input to UPnP** - Port number is validated internally
5. **Deprecated != Vulnerable** - `request` works, just unmaintained

**However:**
- ❌ Fails security audits (CI/CD blockers)
- ❌ No future updates or patches
- ❌ Reputation risk for project
- ❌ Dependency chain bloat (23 transitive deps)

---

## Replacement Options Research

### Option 1: @achingbrain/nat-port-mapper

**Pros:**
- ✅ Modern ES modules
- ✅ Promise-based API (async/await)
- ✅ TypeScript definitions included
- ✅ Active maintenance (libp2p project)
- ✅ Zero deprecated dependencies
- ✅ Small dependency tree

**Cons:**
- ⚠️ Different API (needs adapter layer)
- ⚠️ Less proven (newer package)

**Package Info:**
- Maintainer: libp2p team (IPFS/Protocol Labs)
- Weekly downloads: ~5,000
- Last publish: Recent (actively maintained)

### Option 2: upnp-client

**Pros:**
- ✅ Simple, focused API
- ✅ Promise-based
- ✅ No deprecated dependencies
- ✅ Lightweight

**Cons:**
- ⚠️ Lower adoption
- ⚠️ No TypeScript definitions

### Option 3: nat-pmp (Alternative protocol)

**Pros:**
- ✅ Different protocol (NAT-PMP, less complex than UPnP)
- ✅ Simpler implementation
- ✅ Apple routers support

**Cons:**
- ❌ Not compatible with all routers
- ❌ Different from current UPnP approach

### Option 4: DIY Implementation

**Pros:**
- ✅ Full control
- ✅ No dependencies
- ✅ Exactly what we need

**Cons:**
- ❌ High complexity (UPnP protocol is messy)
- ❌ Maintenance burden
- ❌ Likely more bugs

### Option 5: Make UPnP Optional (Feature Flag)

**Pros:**
- ✅ Zero code changes to core functionality
- ✅ Users can disable if concerned
- ✅ Manual port forwarding is documented

**Cons:**
- ⚠️ Doesn't fix the npm audit issue
- ⚠️ Still have vulnerable deps

---

## Recommendation: Hybrid Approach

### Strategy: Abstraction + Replacement + Graceful Degradation

**Phase 1: Create UPnP Abstraction**
```typescript
interface UPnPClient {
  map(port: number, options: MappingOptions): Promise<void>;
  unmap(port: number): Promise<void>;
  verify(port: number): Promise<boolean>;
}
```

**Phase 2: Implement with @achingbrain/nat-port-mapper**
- Modern, maintained library
- Part of reputable project (libp2p)
- Clean Promise API
- TypeScript support

**Phase 3: Keep Fallback Path**
- If UPnP fails entirely, continue gracefully
- Log errors but don't crash
- Display manual port forwarding instructions

**Phase 4: Make UPnP Optional via Config**
```yaml
upnpEnabled: true  # Can be disabled if issues arise
```

### Implementation Checklist

- [ ] Create `src/core/upnp.ts` abstraction module
- [ ] Define `UPnPClient` interface
- [ ] Implement with nat-port-mapper
- [ ] Add comprehensive error handling
- [ ] Add timeout protection
- [ ] Add retry logic
- [ ] Update `network.ts` to use abstraction
- [ ] Remove nat-api dependency
- [ ] Run `npm audit` to verify fixes
- [ ] Test with actual router (manual)
- [ ] Document behavioral changes
- [ ] Add unit tests for abstraction

---

## Risk Assessment

### Risks of Replacement

1. **Behavioral Differences**
   - Risk: New library might handle edge cases differently
   - Mitigation: Comprehensive error handling and logging
   - Severity: LOW

2. **Router Compatibility**
   - Risk: nat-port-mapper might work with fewer routers
   - Mitigation: Graceful fallback already exists
   - Severity: LOW (UPnP already unreliable)

3. **Regression Bugs**
   - Risk: New code introduces bugs
   - Mitigation: Thorough testing, logging
   - Severity: MEDIUM

### Risks of NOT Replacing

1. **Security Audit Failures**
   - Risk: CI/CD blocks, deployment issues
   - Severity: HIGH

2. **Future Vulnerabilities**
   - Risk: No patches for new CVEs in deprecated deps
   - Severity: MEDIUM

3. **Reputation**
   - Risk: Users see "7 vulnerabilities" in `npm audit`
   - Severity: MEDIUM

---

## Decision: Proceed with Replacement

**Selected Library:** `@achingbrain/nat-port-mapper`

**Rationale:**
1. Eliminates all 5 UPnP-related vulnerabilities
2. Modern, maintained codebase
3. TypeScript support
4. Part of reputable project (libp2p)
5. Clean Promise-based API

**Next Steps:**
1. ✅ Analysis complete (this document)
2. ⏭️ Design abstraction layer
3. ⏭️ Implement adapter for nat-port-mapper
4. ⏭️ Update network.ts
5. ⏭️ Remove nat-api
6. ⏭️ Verify npm audit clean

---

**Approval to proceed:** ✅ APPROVED (Senior Engineer)
