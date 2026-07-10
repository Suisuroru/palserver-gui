import Nav from '@/components/Nav';
import Hero from '@/components/Hero';
import Stats from '@/components/Stats';
import Why from '@/components/Why';
import HowItWorks from '@/components/HowItWorks';
import Features from '@/components/Features';
import Audience from '@/components/Audience';
import Wishes, { WISHES } from '@/components/Wishes';
import GetStarted from '@/components/GetStarted';
import NiceDetails from '@/components/NiceDetails';
import Team from '@/components/Team';
import ClosingCta from '@/components/ClosingCta';
import Footer from '@/components/Footer';
import RevealObserver from '@/components/RevealObserver';

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: WISHES.map((w) => ({
    '@type': 'Question',
    name: w.q,
    acceptedAnswer: { '@type': 'Answer', text: `${w.head}${w.body}` },
  })),
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="bg" aria-hidden="true">
        <i className="a" />
        <i className="b" />
      </div>
      <Nav />
      <Hero />
      <main>
        <Stats />
        <Why />
        <HowItWorks />
        <Features />
        <Audience />
        <Wishes />
        <GetStarted />
        <NiceDetails />
        <Team />
        <ClosingCta />
      </main>
      <Footer />
      <RevealObserver />
    </>
  );
}
