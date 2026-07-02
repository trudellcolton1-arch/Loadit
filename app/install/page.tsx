import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Install the Loadit App (Beta)",
  description: "Direct install of the Loadit iOS beta on registered devices, plus TestFlight and Android links.",
  robots: { index: false },
};

const ITMS =
  "itms-services://?action=download-manifest&url=" +
  encodeURIComponent("https://loadit.net/app/manifest.plist");

export default function InstallPage() {
  return (
    <>
      <Navbar />
      <main className="pt-16">
        <section className="section-py container-px">
          <div className="mx-auto max-w-md space-y-4">
            <div className="glass rounded-4xl p-7 text-center">
              <span className="font-mono text-[0.6rem] uppercase tracking-[0.25em] text-rail-400">
                Loadit Beta
              </span>
              <h1 className="mt-2 text-2xl font-semibold text-white">Install the app</h1>

              <a
                href={ITMS}
                className="mt-6 block w-full rounded-full bg-rail-500 px-6 py-4 text-sm font-semibold text-void transition-all hover:shadow-glow"
              >
                Install on iPhone (direct) →
              </a>
              <p className="mt-3 text-[0.7rem] leading-relaxed text-white/35">
                Open this page in Safari on your iPhone, tap install, then approve
                the prompt. Works on devices registered with our developer
                account (ad-hoc). After installing: Settings → General → VPN &amp;
                Device Management → trust the profile if asked.
              </p>

              <div className="mt-6 border-t border-white/8 pt-6">
                <a
                  href="/app/loadit.apk"
                  className="block w-full rounded-full bg-rail-500 px-6 py-4 text-sm font-semibold text-void transition-all hover:shadow-glow"
                >
                  Download for Android (.apk) →
                </a>
                <p className="mt-2 text-[0.7rem] text-white/35">
                  Works on any Android phone — open the file and approve
                  &quot;install from browser&quot; when prompted.
                </p>
              </div>

              <div className="mt-6 border-t border-white/8 pt-6">
                <a
                  href="https://testflight.apple.com/join/XxdDFBeF"
                  className="block w-full rounded-full border border-white/15 px-6 py-4 text-sm font-medium text-white transition-all hover:bg-white/5"
                >
                  Join the TestFlight beta (public)
                </a>
                <p className="mt-2 text-[0.7rem] text-white/35">
                  Activates for everyone once Apple&apos;s one-time beta review completes.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
