import type { Metadata } from "next";
import { WORLD } from "./_lib/world";
import { WorldHero } from "./_components/WorldHero";
import { FragmentationScene } from "./_components/FragmentationScene";
import { LoaditLayerDiagram } from "./_components/LoaditLayerDiagram";
import { IntentPanel } from "./_components/IntentPanel";
import { RouteBuilder } from "./_components/RouteBuilder";
import { InfrastructureStack } from "./_components/InfrastructureStack";
import { ForPeople, ForUnbanked, ForMerchants, ForBanks } from "./_components/Audiences";
import { ConsumerSide } from "./_components/ConsumerSide";
import { BusinessSide } from "./_components/BusinessSide";
import { DeveloperVision } from "./_components/DeveloperVision";
import { WorldMap } from "./_components/WorldMap";
import { RoadmapTimeline } from "./_components/RoadmapTimeline";
import { EndState } from "./_components/EndState";

export const metadata: Metadata = {
  title: { absolute: WORLD.title },
  description: WORLD.description,
  alternates: { canonical: "/" },
  openGraph: { title: WORLD.title, description: WORLD.description, url: WORLD.url },
};

/**
 * loadit.world — one continuous story, from today's fragmented financial
 * world to the end state where the rails disappear.
 */
export default function WorldHome() {
  return (
    <main id="top">
      <WorldHero />
      <FragmentationScene />
      <LoaditLayerDiagram />
      <IntentPanel />
      <RouteBuilder />
      <InfrastructureStack />
      <ForPeople />
      <ConsumerSide />
      <ForUnbanked />
      <ForMerchants />
      <ForBanks />
      <BusinessSide />
      <DeveloperVision />
      <WorldMap />
      <RoadmapTimeline />
      <EndState />
    </main>
  );
}
