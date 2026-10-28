import { useState } from "react";
import { Catalog } from "../components/Catalog";
import { Contact } from "../components/Contact";
import { Footer } from "../components/Footer";
import { Hero } from "../components/Hero";
import { RequestForm } from "../components/RequestForm";
import { Services } from "../components/Services";
import type { ProjectType } from "../lib/validate";

export type Selection = {
  type: ProjectType;
  projectName: string;
  nonce: number;
};

export function Home() {
  const [selection, setSelection] = useState<Selection | null>(null);

  function choose(type: ProjectType, projectName = "") {
    setSelection({ type, projectName, nonce: Date.now() });
  }

  return (
    <>
      <a className="skip" href="#icerik">
        İçeriğe geç
      </a>
      <main id="icerik">
        <Hero />
        <Services onChoose={choose} />
        <Catalog selection={selection} onChoose={choose} />
        <RequestForm selection={selection} />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
