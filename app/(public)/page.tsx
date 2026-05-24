import { LandingNav } from "@/components/landing/LandingNav"
import { HeroSection } from "@/components/landing/HeroSection"
import { ServicesSection } from "@/components/landing/ServicesSection"
import { DoctorsSection } from "@/components/landing/DoctorsSection"
import { TestimonialsSection } from "@/components/landing/TestimonialsSection"
import { CTABandSection } from "@/components/landing/CTABandSection"
import { FooterSection } from "@/components/landing/FooterSection"

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-canvas selection:bg-navy selection:text-white">
      <LandingNav />
      <HeroSection />
      <ServicesSection />
      <DoctorsSection />
      <TestimonialsSection />
      <CTABandSection />
      <FooterSection />
    </main>
  )
}
