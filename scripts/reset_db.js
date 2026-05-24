const { exec } = require("child_process")
const { promisify } = require("util")
const execAsync = promisify(exec)

async function resetDatabase() {
  try {
    console.log("=== Step 1: Delete migration history ===")
    const dbUrl =
      "postgresql://postgres.whryockfrblzjrlibuna:longha2020%40123@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"

    // Use environment variable to disable pager
    const env = {
      ...process.env,
      PAGER: "",
      PGPAGER: "",
    }

    const sqlCommand = `echo "DELETE FROM _prisma_migrations;" | psql "${dbUrl}"`

    const { stdout, stderr } = await execAsync(sqlCommand, { env, timeout: 30000 })
    console.log("Output:", stdout)
    if (stderr) console.error("Error:", stderr)

    console.log("\n=== Step 2: Re-deploy migrations ===")
    const { stdout: deployOut, stderr: deployErr } = await execAsync("npx prisma migrate deploy", {
      cwd: "/home/longha/Desktop/clinic_booking_main",
      timeout: 60000,
    })
    console.log("Deploy output:", deployOut)
    if (deployErr) console.error("Deploy error:", deployErr)

    console.log("\n=== Done ===")
  } catch (error) {
    console.error("Error:", error.message)
    process.exit(1)
  }
}

resetDatabase()
