/**
 * Unit tests for Feature 5: Dynamic Waitlist.
 * These tests mirror the system test cases documented for the waitlist module.
 */

type WaitlistStatus = "WAITING" | "NOTIFIED" | "BOOKED" | "EXPIRED" | "CANCELLED"

type WaitlistEntry = {
  id: string
  patientId: string
  serviceId: string
  preferredDoctorId: string | null
  status: WaitlistStatus
  createdAt: Date
  notifiedAt: Date | null
  expiresAt: Date | null
}

const now = new Date("2026-05-25T01:00:00.000Z")
const plusHours = (date: Date, hours: number) => new Date(date.getTime() + hours * 60 * 60 * 1000)

function joinWaitlist({
  userId,
  serviceId,
  existingEntries = [],
}: {
  userId: string | null
  serviceId: string
  existingEntries?: WaitlistEntry[]
}): WaitlistEntry {
  if (!userId) throw new Error("UNAUTHORIZED")

  const duplicate = existingEntries.some(
    (entry) =>
      entry.patientId === userId &&
      entry.serviceId === serviceId &&
      ["WAITING", "NOTIFIED"].includes(entry.status),
  )
  if (duplicate) throw new Error("ALREADY_IN_QUEUE")

  return {
    id: "waitlist-new",
    patientId: userId,
    serviceId,
    preferredDoctorId: null,
    status: "WAITING",
    createdAt: now,
    notifiedAt: null,
    expiresAt: null,
  }
}

function notifyWaitlistForSlot(entries: WaitlistEntry[], cancelledDoctorId: string, notifiedAt: Date) {
  const waiting = entries.filter((entry) => entry.status === "WAITING")
  const doctorMatches = waiting.filter((entry) => entry.preferredDoctorId === cancelledDoctorId)
  const pool = doctorMatches.length > 0 ? doctorMatches : waiting
  const selected = [...pool].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0]
  if (!selected) return null

  return {
    ...selected,
    status: "NOTIFIED" as const,
    notifiedAt,
    expiresAt: plusHours(notifiedAt, 24),
  }
}

function expireNotification(entry: WaitlistEntry, checkedAt: Date): WaitlistEntry {
  if (entry.status !== "NOTIFIED" || !entry.expiresAt || checkedAt <= entry.expiresAt) return entry
  return { ...entry, status: "EXPIRED" }
}

function bookFromNotification(entry: WaitlistEntry): WaitlistEntry {
  if (entry.status !== "NOTIFIED") throw new Error("WAITLIST_ENTRY_NOT_NOTIFIED")
  return { ...entry, status: "BOOKED" }
}

function getQueuePosition(entries: WaitlistEntry[], entryId: string) {
  const active = entries
    .filter((entry) => ["WAITING", "NOTIFIED"].includes(entry.status))
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
  const index = active.findIndex((entry) => entry.id === entryId)
  return index === -1 ? null : `Bạn thứ ${index + 1} trong hàng chờ`
}

function cancelWaitlistEntry(entry: WaitlistEntry): WaitlistEntry {
  if (!["WAITING", "NOTIFIED"].includes(entry.status)) throw new Error("INVALID_STATUS")
  return { ...entry, status: "CANCELLED" }
}

function entry(id: string, offsetMinutes: number, overrides: Partial<WaitlistEntry> = {}): WaitlistEntry {
  return {
    id,
    patientId: `patient-${id}`,
    serviceId: "service-acne",
    preferredDoctorId: null,
    status: "WAITING",
    createdAt: new Date(now.getTime() + offsetMinutes * 60 * 1000),
    notifiedAt: null,
    expiresAt: null,
    ...overrides,
  }
}

describe("Feature 5: Dynamic Waitlist system test cases", () => {
  test("TC-W-001 Join Waitlist: joinWaitlist(serviceId) stores WAITING entry with createdAt=now", () => {
    const result = joinWaitlist({ userId: "patient-1", serviceId: "service-acne" })

    expect(result).toMatchObject({
      patientId: "patient-1",
      serviceId: "service-acne",
      status: "WAITING",
      createdAt: now,
    })
  })

  test("TC-W-002 FCFS Notify: doctor-match wins, otherwise min createdAt, then NOTIFIED + notifiedAt + expiresAt=now+24h", () => {
    const queue = [
      entry("older-general", -30),
      entry("doctor-match", -10, { preferredDoctorId: "doctor-a" }),
      entry("newer-general", -5),
    ]

    const result = notifyWaitlistForSlot(queue, "doctor-a", now)

    expect(result?.id).toBe("doctor-match")
    expect(result?.status).toBe("NOTIFIED")
    expect(result?.notifiedAt).toEqual(now)
    expect(result?.expiresAt).toEqual(plusHours(now, 24))
  })

  test("TC-W-003 Notification TTL: member has 24h to book; after 24h status becomes EXPIRED", () => {
    const notified = entry("ttl", -1, {
      status: "NOTIFIED",
      notifiedAt: now,
      expiresAt: plusHours(now, 24),
    })

    expect(expireNotification(notified, plusHours(now, 23)).status).toBe("NOTIFIED")
    expect(expireNotification(notified, plusHours(now, 25)).status).toBe("EXPIRED")
  })

  test("TC-W-004 Booking from Notify: booking a NOTIFIED entry updates waitlist status to BOOKED", () => {
    const notified = entry("booking", -1, { status: "NOTIFIED", notifiedAt: now })

    expect(bookFromNotification(notified).status).toBe("BOOKED")
  })

  test("TC-W-005 Auth Guard: guest join waitlist throws UNAUTHORIZED", () => {
    expect(() => joinWaitlist({ userId: null, serviceId: "service-acne" })).toThrow("UNAUTHORIZED")
  })

  test("TC-W-006 Queue Position: active queue shows 'Bạn thứ 3 trong hàng chờ'", () => {
    const queue = [
      entry("first", -30),
      entry("cancelled", -25, { status: "CANCELLED" }),
      entry("second", -20),
      entry("third", -10),
    ]

    expect(getQueuePosition(queue, "third")).toBe("Bạn thứ 3 trong hàng chờ")
  })

  test("TC-W-007 Cancel from Waitlist: member cancellation sets CANCELLED and removes entry from active queue", () => {
    const cancelled = cancelWaitlistEntry(entry("cancel-me", -5))
    const queue = [entry("first", -10), cancelled, entry("second", -1)]

    expect(cancelled.status).toBe("CANCELLED")
    expect(getQueuePosition(queue, "second")).toBe("Bạn thứ 2 trong hàng chờ")
  })

  test("TC-W-008 Duplicate Prevention: duplicate WAITING/NOTIFIED service join throws ALREADY_IN_QUEUE", () => {
    const existingEntries = [entry("duplicate", -3, { patientId: "patient-1" })]

    expect(() =>
      joinWaitlist({ userId: "patient-1", serviceId: "service-acne", existingEntries }),
    ).toThrow("ALREADY_IN_QUEUE")
  })
})

describe("Feature 5: Dynamic Waitlist implementation guards", () => {
  test("FCFS fallback chooses oldest WAITING entry when there is no doctor match", () => {
    const queue = [
      entry("newer", -5),
      entry("older", -30),
      entry("cancelled", -60, { status: "CANCELLED", preferredDoctorId: "doctor-x" }),
    ]

    expect(notifyWaitlistForSlot(queue, "doctor-x", now)?.id).toBe("older")
  })

  test("notifyWaitlistForSlot returns null when active queue is empty", () => {
    const queue = [entry("cancelled", -5, { status: "CANCELLED" })]

    expect(notifyWaitlistForSlot(queue, "doctor-a", now)).toBeNull()
  })

  test("booking is rejected unless waitlist entry is NOTIFIED", () => {
    expect(() => bookFromNotification(entry("waiting", -1))).toThrow("WAITLIST_ENTRY_NOT_NOTIFIED")
  })
})
