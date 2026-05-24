import { requireRole } from "@/lib/auth/require-role"
import { DoctorOnboardingGuard } from "@/components/doctor/DoctorOnboardingGuard"

export default async function DoctorLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireRole(["DOCTOR"])
  const doctorProfile = profile.doctorProfile
  const needsOnboarding = !doctorProfile || doctorProfile.approvalStatus !== "APPROVED"

  return (
    <DoctorOnboardingGuard
      needsOnboarding={needsOnboarding}
      profileName={profile.fullName}
      profileEmail={profile.email}
      doctorProfile={
        doctorProfile
          ? {
              id: doctorProfile.id,
              licenseNumber: doctorProfile.licenseNumber,
              seniorityLevel: doctorProfile.seniorityLevel,
              specialty: doctorProfile.specialty,
              isActive: doctorProfile.isActive,
              approvalStatus: doctorProfile.approvalStatus,
            }
          : null
      }
    >
      {children}
    </DoctorOnboardingGuard>
  )
}
