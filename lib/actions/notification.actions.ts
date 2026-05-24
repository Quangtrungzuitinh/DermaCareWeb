"use server"

import {
  getMyNotificationFeed,
  markAllNotificationsRead,
  markNotificationRead,
  revokeNotification,
  sendBroadcast,
  sendManualNotification,
} from "@/services/notification.service"
import type { Role } from "@/lib/generated/prisma"
import type { NotificationFeed } from "@/services/notification.service"

export async function getMyNotificationFeedAction(limit?: number): Promise<NotificationFeed> {
  return getMyNotificationFeed(limit)
}

export async function markNotificationReadAction(id: string) {
  await markNotificationRead(id)
}

export async function markAllNotificationsReadAction() {
  await markAllNotificationsRead()
}

export async function sendManualNotificationAction(formData: FormData) {
  await sendManualNotification({
    recipientId: String(formData.get("recipientId") ?? ""),
    appointmentId: String(formData.get("appointmentId") ?? "") || null,
    title: String(formData.get("title") ?? ""),
    body: String(formData.get("body") ?? ""),
  })
}

export async function sendBroadcastAction(formData: FormData) {
  await sendBroadcast({
    target: String(formData.get("target") ?? "ALL") as Role | "ALL",
    title: String(formData.get("title") ?? ""),
    body: String(formData.get("body") ?? ""),
  })
}

export async function revokeNotificationAction(id: string) {
  await revokeNotification(id)
}
