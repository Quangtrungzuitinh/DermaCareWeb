import "server-only"

import { google } from "googleapis"
import { Readable } from "stream"

function requireDriveEnv() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n")
  const parentFolderId = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID

  const hasOauth = Boolean(clientId && clientSecret && refreshToken)
  const hasServiceAccount = Boolean(clientEmail && privateKey)

  if (!parentFolderId || (!hasOauth && !hasServiceAccount)) {
    throw new Error("GOOGLE_DRIVE_NOT_CONFIGURED")
  }

  return { clientEmail, clientId, clientSecret, parentFolderId, privateKey, refreshToken }
}

function escapeDriveQueryValue(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'")
}

function getDriveClient() {
  const { clientEmail, clientId, clientSecret, privateKey, refreshToken } = requireDriveEnv()

  if (clientId && clientSecret && refreshToken) {
    const auth = new google.auth.OAuth2(clientId, clientSecret)
    auth.setCredentials({ refresh_token: refreshToken })
    return google.drive({ version: "v3", auth })
  }

  if (!clientEmail || !privateKey) {
    throw new Error("GOOGLE_DRIVE_NOT_CONFIGURED")
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/drive"],
  })

  return google.drive({ version: "v3", auth })
}

export function getDriveParentFolderId() {
  return requireDriveEnv().parentFolderId
}

export async function uploadFileToDrive(params: {
  buffer: Buffer
  fileName: string
  mimeType: string
  parentFolderId: string
}): Promise<{ fileId: string; thumbnailUrl: string | null }> {
  const drive = getDriveClient()
  const res = await drive.files.create({
    requestBody: { name: params.fileName, parents: [params.parentFolderId] },
    media: { mimeType: params.mimeType, body: Readable.from(params.buffer) },
    fields: "id,thumbnailLink",
    supportsAllDrives: true,
  })

  if (!res.data.id) throw new Error("GOOGLE_DRIVE_UPLOAD_FAILED")

  return { fileId: res.data.id, thumbnailUrl: res.data.thumbnailLink ?? null }
}

export async function getDriveFileStream(fileId: string): Promise<Readable> {
  const drive = getDriveClient()
  const res = await drive.files.get(
    { fileId, alt: "media", supportsAllDrives: true },
    { responseType: "stream" },
  )
  return res.data as unknown as Readable
}

export async function trashDriveFile(fileId: string): Promise<void> {
  const drive = getDriveClient()
  await drive.files.update({ fileId, requestBody: { trashed: true }, supportsAllDrives: true })
}

export async function getOrCreateFolder(params: { name: string; parentId: string }): Promise<string> {
  const drive = getDriveClient()
  const safeName = escapeDriveQueryValue(params.name)
  const safeParent = escapeDriveQueryValue(params.parentId)
  const existing = await drive.files.list({
    q: `name='${safeName}' and '${safeParent}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: "files(id)",
    spaces: "drive",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  })

  const existingId = existing.data.files?.[0]?.id
  if (existingId) return existingId

  const folder = await drive.files.create({
    requestBody: {
      name: params.name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [params.parentId],
    },
    fields: "id",
    supportsAllDrives: true,
  })

  if (!folder.data.id) throw new Error("GOOGLE_DRIVE_FOLDER_CREATE_FAILED")
  return folder.data.id
}
