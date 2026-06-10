import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { AeroSimulator } from "@/components/sections/AeroSimulator";
import { AffiliateRouter } from "@/components/sections/AffiliateRouter";
import { Patents } from "@/components/sections/Patents";
import { Investors } from "@/components/sections/Investors";
import { Access } from "@/components/sections/Access";
import { Footer } from "@/components/Footer";

// Lean homepage: the live demo, the savings router, the moat, and the raise.
// Everything else lives on /platform, /technology, and the product pages.
export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <AeroSimulator />
        <AffiliateRouter />
        <Patents />
        <Investors />
        <Access />
      </main>
      <Footer />
    </>
  );
}
