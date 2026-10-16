import Nav from "@/components/Nav";
import SmoothScroll from "@/components/SmoothScroll";
import ScrollEffects from "@/components/ScrollEffects";
import SceneLoader from "@/components/three/SceneLoader";
import SectionProgress from "@/components/SectionProgress";
import Hero from "@/components/sections/Hero";
import Design from "@/components/sections/Design";
import Health from "@/components/sections/Health";
import Finish from "@/components/sections/Finish";
import Specs from "@/components/sections/Specs";
import Order from "@/components/sections/Order";
import Footer from "@/components/sections/Footer";

/*
 * This page is a Server Component: the section text is rendered to plain HTML
 * on the server, which is fast and SEO-friendly. Only the interactive pieces
 * (3D scene, scroll, nav, configurator) are "use client" components.
 *
 * Section order matters: it must match SECTION_IDS in lib/poses.ts, because
 * each section id drives one step of the 3D watch's scroll animation.
 */
export default function Home() {
  return (
    <>
      <SmoothScroll />
      <ScrollEffects />
      <SceneLoader />
      <Nav />
      <SectionProgress />

      <main>
        <Hero />
        <Design />
        <Health />
        <Finish />
        <Specs />
        <Order />
      </main>

      <Footer />
    </>
  );
}
