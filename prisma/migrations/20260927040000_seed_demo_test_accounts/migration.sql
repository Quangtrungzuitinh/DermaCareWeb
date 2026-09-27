CREATE TABLE IF NOT EXISTS "demo_test_accounts" (
  "id" TEXT NOT NULL,
  "role" "Role" NOT NULL,
  "email" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "passwordHint" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "demo_test_accounts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "demo_test_accounts_email_key" ON "demo_test_accounts" ("email");
CREATE INDEX IF NOT EXISTS "demo_test_accounts_role_isActive_idx" ON "demo_test_accounts" ("role", "isActive");

INSERT INTO "demo_test_accounts" ("id","role","email","displayName","passwordHint") VALUES
 ('demo-account-patient','PATIENT'::"Role",'demo.patient@clinic.test','Tài khoản demo bệnh nhân','DemoRole!2026'),
 ('demo-account-staff','STAFF'::"Role",'demo.staff@clinic.test','Tài khoản demo nhân viên','DemoRole!2026'),
 ('demo-account-doctor','DOCTOR'::"Role",'demo.doctor@clinic.test','Tài khoản demo bác sĩ','DemoRole!2026'),
 ('demo-account-admin','ADMIN'::"Role",'demo.admin@clinic.test','Tài khoản demo quản trị viên','DemoRole!2026')
ON CONFLICT ("id") DO UPDATE SET "role"=EXCLUDED."role", "email"=EXCLUDED."email", "displayName"=EXCLUDED."displayName", "passwordHint"=EXCLUDED."passwordHint", "isActive"=true, "updatedAt"=CURRENT_TIMESTAMP;
