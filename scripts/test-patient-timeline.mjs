import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import net from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const args = new Set(process.argv.slice(2))

const runStatic = args.size === 0 || args.has('--static')
const runRoute = args.size === 0 || args.has('--route')

if (!runStatic && !runRoute) {
  throw new Error('Use --static, --route, or no flags.')
}

if (runStatic) {
  await testStaticImplementation()
}

if (runRoute) {
  await testRouteAuthRedirect()
}

console.log('Patient timeline tests passed.')

async function testStaticImplementation() {
  const actionPath = path.join(root, 'lib/actions/timeline.actions.ts')
  const pagePath = path.join(root, 'app/(patient)/dashboard/timeline/page.tsx')

  const action = await readFile(actionPath, 'utf8')
  const page = await readFile(pagePath, 'utf8')

  assertIncludes(action, "export async function getPatientTimeline()", 'exports getPatientTimeline')
  assertIncludes(action, "export async function getPatientTimelinePageData()", 'exports timeline page data action')
  assertIncludes(action, 'supabase.auth.getUser()', 'checks Supabase auth user')
  assertIncludes(action, 'where: { supabaseUserId: user.id }', 'loads profile by Supabase user id')
  assertIncludes(action, 'patientId,', 'scopes appointment query to current patient')
  assertIncludes(action, 'AppointmentStatus.CONFIRMED', 'includes CONFIRMED status')
  assertIncludes(action, 'AppointmentStatus.COMPLETED', 'includes COMPLETED status')
  assertIncludes(action, 'AppointmentStatus.NO_SHOW', 'includes NO_SHOW status')
  assertIncludes(action, "orderBy: { appointmentDate: 'desc' }", 'sorts newest appointments first')
  assertIncludes(action, 'doctor:', 'includes appointment doctor relation')
  assertIncludes(action, 'profile:', 'includes doctor profile relation')
  assertIncludes(action, 'medicalRecord:', 'includes appointment medicalRecord relation')
  assertIncludes(action, 'treatments:', 'includes medicalRecord treatments relation')
  assertIncludes(action, 'service: true', 'includes treatment service relation')
  assertIncludes(action, 'toISOString()', 'serializes Date values')

  assertDoesNotInclude(action, 'prisma.$executeRaw', 'does not bypass Prisma model APIs')
  assertDoesNotInclude(action, 'prisma.$queryRaw', 'does not use raw query APIs')

  assertIncludes(page, 'PatientShell', 'uses current patient dashboard shell')
  assertIncludes(page, "bg-[#e2e8f0]", 'uses required timeline line color')
  assertIncludes(page, "bg-[#1e3a5f]", 'uses required timeline dot color')
  assertIncludes(page, "bg-[#f0f4f8]", 'uses required card background color')
  assertIncludes(page, "COMPLETED: { label: 'Hoàn thành', bg: '#eff6ff', text: '#1d4ed8' }", 'uses COMPLETED badge colors')
  assertIncludes(page, "CONFIRMED: { label: 'Đã xác nhận', bg: '#f0fdf4', text: '#166534' }", 'uses CONFIRMED badge colors')
  assertIncludes(page, "NO_SHOW: { label: 'Không đến', bg: '#f8fafc', text: '#475569' }", 'uses NO_SHOW badge colors')
  assertIncludes(page, 'formatAppointmentDate', 'formats appointment date')
  assertIncludes(page, 'item.doctor.fullName', 'renders doctor profile name')
  assertIncludes(page, 'item.medicalRecord?.diagnosis', 'renders diagnosis with fallback')
  assertIncludes(page, 'treatment.service.name', 'renders treatment service tags')
  assertIncludes(page, 'EmptyState', 'renders empty state')

  const sidebar = await readFile(path.join(root, 'components/patient/PatientSidebar.tsx'), 'utf8')
  assertIncludes(sidebar, 'Dòng thời gian', 'adds timeline to current patient sidebar')
  assertIncludes(sidebar, 'to: "/dashboard/timeline"', 'links current sidebar to timeline route')
}

async function testRouteAuthRedirect() {
  const port = await getFreePort()
  const nextCli = path.join(root, 'node_modules/next/dist/bin/next')
  const child = spawn(process.execPath, [nextCli, 'start', '--port', String(port)], {
    cwd: root,
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  })

  let output = ''
  child.stdout.on('data', (chunk) => {
    output += chunk.toString()
  })
  child.stderr.on('data', (chunk) => {
    output += chunk.toString()
  })

  try {
    await waitForServer(port, child, () => output)

    const response = await fetch(`http://localhost:${port}/dashboard/timeline`, {
      redirect: 'manual',
    })

    assert.equal(response.status, 307, 'unauthenticated timeline route redirects')
    const location = response.headers.get('location') ?? ''
    assert.match(
      location,
      /\/auth\/login\?redirectTo=%2Fdashboard%2Ftimeline/,
      'redirect location preserves timeline destination',
    )
  } finally {
    killProcessTree(child.pid)
  }
}

function assertIncludes(source, needle, label) {
  assert.ok(source.includes(needle), `${label}: expected to find ${JSON.stringify(needle)}`)
}

function assertDoesNotInclude(source, needle, label) {
  assert.ok(!source.includes(needle), `${label}: did not expect ${JSON.stringify(needle)}`)
}

async function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.once('error', reject)
    server.listen(0, () => {
      const address = server.address()
      server.close(() => {
        if (!address || typeof address === 'string') {
          reject(new Error('Could not allocate a free port.'))
          return
        }
        resolve(address.port)
      })
    })
  })
}

async function waitForServer(port, child, getOutput) {
  const deadline = Date.now() + 45_000

  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`next start exited early with ${child.exitCode}\n${getOutput()}`)
    }

    try {
      const response = await fetch(`http://localhost:${port}/`, { redirect: 'manual' })
      if (response.status >= 200 && response.status < 500) return
    } catch {
      await delay(500)
    }
  }

  throw new Error(`Timed out waiting for next start on port ${port}\n${getOutput()}`)
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function killProcessTree(pid) {
  if (!pid) return

  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], {
      stdio: 'ignore',
      windowsHide: true,
    })
    return
  }

  try {
    process.kill(pid, 'SIGTERM')
  } catch {
    // Process already exited.
  }
}
