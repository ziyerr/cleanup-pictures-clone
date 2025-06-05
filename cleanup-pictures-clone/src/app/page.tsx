import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import SecondaryHero from '@/components/SecondaryHero';
import UseCases from '@/components/UseCases';
import Testimonials from '@/components/Testimonials';
import Partners from '@/components/Partners';
import Pricing from '@/components/Pricing';
import FAQ from '@/components/FAQ';
import APISection from '@/components/APISection';
import IPShowcaseCTA from '@/components/BackgroundRemovalCTA';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Header />
      <HeroSection />
      <SecondaryHero />
      <UseCases />
      <Testimonials />
      <Partners />
      <Pricing />
      <FAQ />
      <APISection />
      <IPShowcaseCTA />
      <Footer />
    </main>
  );
}
