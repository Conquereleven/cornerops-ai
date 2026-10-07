import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CreditCard,
  Menu,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { siteConfig } from "../../config/siteConfig";
import { publicContent as content } from "../../config/publicContent";

export function Brand() {
  return (
    <Link to="/" className="ct-brand" aria-label="Corner Tech AI home">
      <img src="/brand/logo-mark.png" width="32" height="26" alt="" />
      <span>
        Corner<span>TechAI</span>
      </span>
    </Link>
  );
}
export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 32);
    update();
    window.addEventListener("scroll", update, { passive: true });
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        document.getElementById("ct-menu-toggle")?.focus();
      }
    };
    window.addEventListener("keydown", escape);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("keydown", escape);
    };
  }, []);
  return (
    <header className={`ct-nav ${scrolled ? "ct-nav-scrolled" : ""}`}>
      <Brand />
      <nav
        id="ct-navigation"
        className={open ? "ct-nav-open" : ""}
        aria-label="Main"
        onClick={() => setOpen(false)}
      >
        {[
          ["Solutions", "solutions"],
          ["Industries", "industries"],
          ["Work", "work"],
          ["Company", "company"],
        ].map(([label, id]) => (
          <a key={id} href={`#${id}`}>
            {label}
          </a>
        ))}
        <Link className="ct-nav-signin" to="/login">
          Sign in
        </Link>
      </nav>
      <a className="ct-button ct-nav-contact" href="#contact">
        Talk to us
      </a>
      <button
        id="ct-menu-toggle"
        className="ct-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="ct-navigation"
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
    </header>
  );
}
export function Label({ children }: { children: React.ReactNode }) {
  return <div className="ct-label">{children}</div>;
}
export function Hero() {
  return (
    <>
      <section
        className="ct-hero ct-width"
        id="main-content"
        aria-labelledby="ct-title"
      >
        <div className="ct-hero-copy">
          <span className="visually-hidden">AI SYSTEMS FOR REAL BUSINESS</span>
          <h1 id="ct-title">
            Intelligence,
            <br />
            engineered
            <br />
            for <em>business.</em>
          </h1>
          <p>{content.hero}</p>
          <div className="ct-actions">
            <a className="ct-button ct-primary" href="#work">
              Explore our work <ArrowRight size={16} />
            </a>
            <a className="ct-button" href="#contact">
              Talk to us
            </a>
          </div>
        </div>
        <CornerTechIntelligence />
        <div className="ct-index">
          {[
            "AI Systems",
            "Automation",
            "Software",
            "Operations",
            "Commerce",
          ].map((item, i) => (
            <span key={item}>
              0{i + 1} {item}
            </span>
          ))}
          <span className="ct-index-end">One intelligent layer</span>
        </div>
      </section>
      <div className="ct-transition" aria-hidden="true">
        <img
          src="/brand/transition-source.svg"
          width="640"
          height="300"
          alt=""
        />
      </div>
    </>
  );
}
export function CornerTechIntelligence() {
  return (
    <figure className="ct-intelligence">
      <picture>
        <source
          media="(max-width: 600px)"
          srcSet="/brand/intelligence-mobile.svg"
        />
        <img
          src="/brand/intelligence-source.svg"
          width="640"
          height="480"
          alt="CornerTech Intelligence: one intelligent layer connecting Customers, Orders, Payments, Marketing, Inventory, Operations, Analytics and an AI Agent."
        />
      </picture>
      <figcaption className="visually-hidden">
        One intelligent layer connecting the business.
      </figcaption>
    </figure>
  );
}
export function WhatWeBuild() {
  return (
    <section id="solutions" className="ct-light ct-solutions">
      <div className="ct-width">
        <Label>What we build</Label>
        <div className="ct-editorial-heading">
          <h2>
            Software that thinks.
            <br />
            <span>Systems that work.</span>
          </h2>
          <p>
            From intelligent automation to custom software, we build the
            infrastructure businesses need to operate faster and scale with less
            friction.
          </p>
        </div>
        <div className="ct-primary-capability">
          <div>
            <Label>01 — Primary capability</Label>
            <h3>AI Agents</h3>
            <p>
              Systems that read inbound requests, interpret what needs to happen
              and execute routine steps across your tools, with clear controls
              for consequential actions.
            </p>
          </div>
          <div className="ct-agent" aria-label="Illustrative agent workflow">
            <div className="ct-micro-header">
              <span>Agent · order_ops</span>
              <span>• Running</span>
            </div>
            <ol>
              <li>
                <Check size={14} />
                Reading inbound request
              </li>
              <li className="ct-agent-active">
                Classifying intent · order change
              </li>
              <li>Updating order in system</li>
              <li>Notifying operations team</li>
            </ol>
            <small>Illustrative workflow</small>
          </div>
        </div>
        <div className="ct-secondary-capabilities">
          <article>
            <Label>02 — Capability</Label>
            <h3>Custom Software</h3>
            <p>
              Purpose-built applications and operational consoles designed
              around how the business actually runs.
            </p>
            <div className="ct-fragment">
              <div className="ct-micro-header">
                <span>Console · demand</span>
                <span>• Synced</span>
              </div>
              <div className="ct-bars" aria-hidden="true">
                {[22, 28, 24, 33, 30, 39, 38, 47].map((n, i) => (
                  <i key={i} style={{ height: n }} />
                ))}
              </div>
              <small>Illustrative operational view</small>
            </div>
          </article>
          <article>
            <Label>03 — Capability</Label>
            <h3>Automation</h3>
            <p>
              Connect processes across tools, teams and platforms into one
              reliable, observable flow.
            </p>
            <div className="ct-fragment">
              <div className="ct-micro-header">
                <span>Workflow · inbound</span>
                <span>• Active</span>
              </div>
              <div className="ct-workflow">
                {["Trigger", "Enrich", "Route", "Notify"].map((x) => (
                  <span key={x}>{x}</span>
                ))}
              </div>
              <small>Stage 1 of 4 · illustrative</small>
            </div>
          </article>
        </div>
        <div className="ct-support">
          <div className="ct-micro-header">
            <span>Supporting layers</span>
            <span>04 — 06</span>
          </div>
          {content.capabilities.map(([title, copy], i) => (
            <a href="#contact" className="ct-row" key={title}>
              <small>0{i + 4}</small>
              <h4>{title}</h4>
              <p>{copy}</p>
              <ArrowUpRight size={15} />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
export function OperationalFriction() {
  return (
    <section className="ct-light ct-friction">
      <div className="ct-width ct-split">
        <div>
          <Label>Operational friction</Label>
          <h2>
            Good teams.
            <br />
            <span>Unnecessary friction.</span>
          </h2>
          <p>
            When the business grows, manual work grows with it. We build systems
            around the places where time, context and opportunities get lost.
          </p>
        </div>
        <ul className="ct-simple-list">
          {content.friction.map((item, i) => (
            <li key={item}>
              <small>0{i + 1}</small>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
function SurfaceHeading({ title, status }: { title: string; status: string }) {
  return (
    <div className="ct-surface-heading">
      <span>{title}</span>
      <span>{status}</span>
    </div>
  );
}
export function ProductSurfaceComposition() {
  return (
    <div
      className="ct-product-composition"
      role="img"
      aria-label="Illustrative Tres Leches system: web ordering, WhatsApp conversation, kitchen operations and payment confirmation. These are reconstructed product examples, not live orders."
    >
      <div className="ct-product-order ct-surface">
        <SurfaceHeading title="Ordering · web" status="Example" />
        <div className="ct-order-body">
          <small>Build your order</small>
          <div className="ct-order-title">
            Saturday pickup{" "}
            <span>
              Pickup <b>Delivery</b>
            </span>
          </div>
          {[
            ["Classic Tres Leches", "Whole", "1"],
            ["Strawberry Tres Leches", "Half", "2"],
            ["Dulce de Leche", "Slice", "3"],
          ].map(([name, size, count]) => (
            <div className="ct-order-row" key={name}>
              <div>
                {name}
                <small>{size}</small>
              </div>
              <span>− &nbsp; {count} &nbsp; +</span>
            </div>
          ))}
          <div className="ct-order-bottom">
            <small>3 items · Sat, 4:00 PM</small>
            <span>Continue to checkout</span>
          </div>
        </div>
      </div>
      <div className="ct-product-chat ct-surface">
        <SurfaceHeading title="WhatsApp" status="Example" />
        <div className="ct-chat-body">
          <strong>Tres Leches</strong>
          <p>
            Hi! Could I order two strawberry tres leches for Saturday pickup?
          </p>
          <p className="ct-chat-reply">
            Of course. Choose size and pickup time here and we'll hold your
            slot.
          </p>
          <p className="ct-chat-link">Order link · Tres Leches</p>
          <p>Done, paid.</p>
          <p>Order confirmed · Pickup Saturday, 4:00 PM</p>
        </div>
      </div>
      <div className="ct-product-operations ct-surface">
        <SurfaceHeading title="Operations · kitchen" status="Example" />
        <div className="ct-kitchen">
          {[
            ["Received", "Strawberry · ×2", "Classic · ×1"],
            ["In production", "Dulce de Leche · ×3"],
            ["Ready", "Classic · ×2"],
          ].map(([label, ...orders]) => (
            <div key={label}>
              <small>{label}</small>
              {orders.map((order) => (
                <p key={order}>{order}</p>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="ct-product-payment ct-surface">
        <SurfaceHeading title="Checkout" status="Example" />
        <div className="ct-payment-body">
          <p className="ct-payment-selected">
            <CreditCard size={14} />
            Card <span>•</span>
          </p>
          <p>Transfer</p>
          <p>Cash on pickup</p>
          <small>
            <Check size={13} /> Payment confirmed
          </small>
        </div>
      </div>
    </div>
  );
}
export function FeaturedWork() {
  return (
    <section id="work" className="ct-work">
      <div className="ct-width ct-case-grid">
        <div className="ct-case-copy">
          <Label>Featured work</Label>
          <h2>{content.case.title}</h2>
          <p className="ct-case-lead">{content.case.framing}</p>
          <p>{content.case.copy}</p>
          <ol className="ct-case-layers">
            {content.case.layers.map((item, i) => (
              <li key={item}>
                <small>0{i + 1}</small>
                {item}
                <span>—</span>
              </li>
            ))}
          </ol>
          <a className="ct-button" href="#tres-leches-details">
            View project <ArrowRight size={16} />
          </a>
        </div>
        <ProductSurfaceComposition />
      </div>
      <div id="tres-leches-details" className="ct-width ct-case-note">
        <small>Project context</small>
        <p>
          A connected journey from WhatsApp enquiries across multiple numbers to
          digital ordering, checkout, payments and order-state management.
        </p>
        <p>
          Reconstructed interfaces illustrate the workflow. No live customer
          data or performance claims are shown.
        </p>
      </div>
    </section>
  );
}
export function SystemsAndIndustries() {
  return (
    <section className="ct-light ct-section">
      <div className="ct-width">
        <Label>Selected systems</Label>
        <h2>Built around real work.</h2>
        <div className="ct-system-rows">
          {content.systems.map(([title, status, copy]) => (
            <article className="ct-row" key={title}>
              <small>{status}</small>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
        <div id="industries" className="ct-industries">
          <div>
            <Label>Operating environments</Label>
            <h2>
              Different industries.
              <br />
              <span>A shared pattern.</span>
            </h2>
            <p>
              Fragmented workflows, systems and data. We connect the operation
              before adding more complexity.
            </p>
          </div>
          <ul className="ct-simple-list">
            {content.industries.map((item, i) => (
              <li key={item}>
                <small>0{i + 1}</small>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
export function ProcessAndPrinciples() {
  return (
    <section className="ct-section ct-width">
      <Label>How we work</Label>
      <h2>
        Close to the operation.
        <br />
        <span>Through to the build.</span>
      </h2>
      <ol className="ct-process">
        {content.process.map(([title, copy], i) => (
          <li key={title}>
            <small>0{i + 1}</small>
            <h3>{title}</h3>
            <p>{copy}</p>
          </li>
        ))}
      </ol>
      <div className="ct-principles ct-split">
        <div>
          <Label>Why Corner Tech AI</Label>
          <h2>
            Engineering meets
            <br />
            <span>operational thinking.</span>
          </h2>
        </div>
        <div>
          {content.principles.map(([title, copy]) => (
            <article key={title}>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </div>
      <div className="ct-technology">
        <Label>Technology behind the work</Label>
        <p>React / OpenAI / Supabase / APIs & integrations</p>
      </div>
    </section>
  );
}
export function CompanyAndContact() {
  return (
    <>
      <section id="company" className="ct-light ct-section">
        <div className="ct-width ct-split">
          <div>
            <Label>Company</Label>
            <h2>
              Technology should simplify
              <br />
              the business,
              <br />
              <span>not complicate it.</span>
            </h2>
          </div>
          <div>
            <p>We unify fragmented operations into intelligent systems.</p>
            <p>
              Corner Tech AI understands operations and builds software around
              how businesses actually work. Our approach connects data,
              workflow, AI and a clear command center, with reusable foundations
              for each operating environment.
            </p>
          </div>
        </div>
      </section>
      <section id="contact" className="ct-contact ct-width">
        <Label>Let’s build something useful</Label>
        <h2>
          Build the system
          <br />
          your business actually needs.
        </h2>
        <p>
          Bring us one workflow that takes too much time. We’ll help you
          identify what to build first.
        </p>
        <div className="ct-actions">
          {siteConfig.bookingUrl && (
            <a
              className="ct-button ct-primary"
              href={siteConfig.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Book a call <ArrowUpRight size={16} />
            </a>
          )}
          {siteConfig.contactEmail && (
            <a className="ct-button" href={`mailto:${siteConfig.contactEmail}`}>
              Email us
            </a>
          )}
          {siteConfig.whatsappUrl && (
            <a
              className="ct-button"
              href={siteConfig.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp <ArrowUpRight size={16} />
            </a>
          )}
        </div>
        <small>
          {siteConfig.contactEmail} · {siteConfig.whatsappNumber}
        </small>
      </section>
      <footer className="ct-footer ct-width">
        <Brand />
        <nav aria-label="Footer">
          <a href="#work">Work</a>
          <a href="#solutions">Capabilities</a>
          <a href="#contact">Contact</a>
          {siteConfig.privacyUrl && <a href={siteConfig.privacyUrl}>Privacy</a>}
          {siteConfig.termsUrl && <a href={siteConfig.termsUrl}>Terms</a>}
          <Link to="/login">Sign in</Link>
        </nav>
        <small>
          © {new Date().getFullYear()} {siteConfig.name}
        </small>
      </footer>
    </>
  );
}
