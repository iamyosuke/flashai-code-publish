import HeroSection from "@/components/hero-section";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Pricing from '../components/pricing';
import { Marquee } from "@/components/magicui/marquee";
import { TestimonialSection } from "./components/testimonials/testimonials";
import Features from "@/components/features";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <Features />
      <Pricing />
      <TestimonialSection />
    </>
  );
}
