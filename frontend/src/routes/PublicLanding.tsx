import { useEffect, useRef } from "react";
import {
  CompanyAndContact,
  FeaturedWork,
  Header,
  Hero,
  OperationalFriction,
  ProcessAndPrinciples,
  SystemsAndIndustries,
  WhatWeBuild,
} from "../components/public/CornerTechSite";
import "../styles/cornertech.css";

export function PublicLanding() {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const preference = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const update = () => {
      if (root.current)
        root.current.dataset.motion = preference?.matches ? "reduced" : "ready";
    };
    update();
    preference?.addEventListener("change", update);
    return () => preference?.removeEventListener("change", update);
  }, []);
  return (
    <main className="ct-site co-public" ref={root}>
      <a className="ct-skip" href="#main-content">
        Skip to content
      </a>
      <Header />
      <Hero />
      <WhatWeBuild />
      <OperationalFriction />
      <FeaturedWork />
      <SystemsAndIndustries />
      <ProcessAndPrinciples />
      <CompanyAndContact />
    </main>
  );
}
