import type { Metadata } from "next";
import { DemoClient } from "./DemoClient";

export const metadata: Metadata = {
  title: "Loadit × MoneyGram — Live Demo Flow",
  description:
    "Step through exactly how a Loadit user turns cash at a MoneyGram counter into Bitcoin in their own wallet — screen by screen.",
  alternates: { canonical: "/moneygram/demo" },
  robots: { index: false, follow: false },
};

export default function MoneyGramDemo() {
  return <DemoClient />;
}
