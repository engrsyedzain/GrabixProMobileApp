import Nav from './sections/Nav';
import Hero from './sections/Hero';
import Platforms from './sections/Platforms';
import Features from './sections/Features';
import HowItWorks from './sections/HowItWorks';
import Downloads from './sections/Downloads';
import Extension from './sections/Extension';
import Footer from './sections/Footer';
import {Analytics} from '@vercel/analytics/react';

export default function App() {
  return (
    <div className="min-h-screen">
      <Nav />
      <main>
        <Hero />
        <Platforms />
        <Features />
        <HowItWorks />
        <Downloads />
        <Extension />
      </main>
      <Footer />
      {/* Privacy-friendly page/visitor metrics; only reports once deployed to Vercel. */}
      <Analytics />
    </div>
  );
}
