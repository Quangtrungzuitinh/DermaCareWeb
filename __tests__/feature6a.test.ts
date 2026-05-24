/**
 * Unit tests for Feature 6-A: Treatment Plan Management
 * Tests business logic that can run without DB (pure logic).
 * Integration tests require a live Supabase instance.
 */

// ─── Business rule helpers (extracted logic for testability) ──────────────────

function calcPlanProgress(completed: number, target: number) {
  if (target <= 0) throw new Error("target must be > 0")
  return Math.min(100, Math.round((completed / target) * 100))
}

function canIncrementSession(completed: number, target: number | null): true | string {
  if (!target) return "NO_PLAN"
  if (completed >= target) return "PLAN_COMPLETED"
  return true
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Feature 6-A: Treatment Plan progress", () => {
  test("0/4 = 0%", () => expect(calcPlanProgress(0, 4)).toBe(0))
  test("2/4 = 50%", () => expect(calcPlanProgress(2, 4)).toBe(50))
  test("3/4 = 75%", () => expect(calcPlanProgress(3, 4)).toBe(75))
  test("4/4 = 100%", () => expect(calcPlanProgress(4, 4)).toBe(100))
  test("over target clamps to 100%", () => expect(calcPlanProgress(5, 4)).toBe(100))
  test("target=0 throws", () => expect(() => calcPlanProgress(0, 0)).toThrow())
})

describe("Feature 6-A: canIncrementSession guard", () => {
  test("no plan returns NO_PLAN", () => expect(canIncrementSession(0, null)).toBe("NO_PLAN"))
  test("completed < target returns true", () => expect(canIncrementSession(2, 4)).toBe(true))
  test("completed === target returns PLAN_COMPLETED", () =>
    expect(canIncrementSession(4, 4)).toBe("PLAN_COMPLETED"))
  test("completed > target returns PLAN_COMPLETED", () =>
    expect(canIncrementSession(5, 4)).toBe("PLAN_COMPLETED"))
})
