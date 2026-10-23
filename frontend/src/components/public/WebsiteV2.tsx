import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { ContactActions } from "./CornerTechSite";
import { websiteV2Content as content } from "../../config/publicContent";

export type PublicNavItem = { label: string; href: string };
export type ContactLinks = {
  bookingUrl: string;
  whatsappUrl: string;
  contactEmail: string;
};

const CONTACT_HREF = "/#contact";
const MENU_ID = "v2-menu";

type StatusKind = "available" | "development";

function Status({
  kind,
  large = false,
  children,
}: {
  kind: StatusKind;
  large?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={`v2-status v2-status--${kind}${large ? " v2-status--lg" : ""}`}
    >
      <i aria-hidden="true" />
      {children}
    </span>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="v2-eyebrow">{children}</p>;
}

function SectionHead({
  eyebrow,
  id,
  title,
  focusable = false,
  split = true,
  children,
}: {
  eyebrow: string;
  id: string;
  title: string;
  focusable?: boolean;
  split?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className={`v2-section-head${split ? " v2-section-head--split" : ""}`}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="v2-h2" id={id} tabIndex={focusable ? -1 : undefined}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function Brand() {
  return (
    <Link to="/" className="v2-brand" aria-label={content.frame.brandLabel}>
      <img src="/brand/logo-mark.png" width="32" height="26" alt="" />
      <span>
        Corner<span>TechAI</span>
      </span>
    </Link>
  );
}

function Band({
  eyebrow,
  id,
  title,
  copy,
  accent,
  children,
}: {
  eyebrow?: string;
  id: string;
  title: string;
  copy: string;
  accent: "action" | "accent";
  children: ReactNode;
}) {
  return (
    <section className="v2-section v2-section--tight" aria-labelledby={id}>
      <div className="v2-wrap">
        <div className={`v2-band v2-band--${accent}`}>
          <div className="v2-stack">
            {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
            <h2 className="v2-h2" id={id}>
              {title}
            </h2>
            <p className="v2-body">{copy}</p>
          </div>
          <div className="v2-actions">{children}</div>
        </div>
      </div>
    </section>
  );
}

function ContactLink({
  primary = false,
  children,
}: {
  primary?: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      className={`v2-btn${primary ? " v2-btn--primary" : ""}`}
      to={CONTACT_HREF}
    >
      {children}
    </Link>
  );
}

// Coded concept illustration: fictional names and IDs, no live data, no
// per-stage availability status (capabilities are not approved for publication).
function SyntheticIllustration() {
  const ill = content.illustration;
  return (
    <figure className="v2-illus" role="img" aria-label={ill.label}>
      <div className="v2-illus-head">
        <span className="v2-illus-caption">{ill.caption}</span>
        <span className="v2-illus-meta">{ill.meta}</span>
      </div>
      <ol className="v2-stages">
        <li className="v2-stage">
          <span className="v2-stage-name">{ill.request.name}</span>
          <p className="v2-bubble">
            <small>{ill.request.from}</small>
            {ill.request.text}
          </p>
        </li>
        <li className="v2-stage">
          <span className="v2-stage-name">{ill.record.name}</span>
          <p className="v2-rec-id">{ill.record.id}</p>
          <ul className="v2-checks">
            {ill.record.checks.map(([kind, text]) => (
              <li key={text} className={`v2-check--${kind}`}>
                {text}
              </li>
            ))}
          </ul>
        </li>
        <li className="v2-stage">
          <span className="v2-stage-name">{ill.history.name}</span>
          <ol className="v2-events">
            {ill.history.events.map(([time, event, detail]) => (
              <li key={event}>
                <span className="v2-event-time">{time}</span>
                <span>
                  <b>{event}</b> {detail}
                </span>
              </li>
            ))}
          </ol>
        </li>
        <li className="v2-stage">
          <span className="v2-stage-name">{ill.queue.name}</span>
          <div className="v2-queue-item">
            <span className="v2-rec-id">{ill.queue.id}</span>
            <span>{ill.queue.text}</span>
            <em>{ill.queue.note}</em>
          </div>
        </li>
      </ol>
      <p className="v2-illus-foot">{ill.foot}</p>
    </figure>
  );
}

export function V2Frame({
  nav,
  children,
}: {
  nav: PublicNavItem[];
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const location = useLocation();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Every navigation closes the menu; an in-app hash target (/#company,
  // /#contact) receives focus on its tabIndex=-1 heading, which also scrolls it
  // into view below the sticky header (scroll-margin in cornertech.css).
  useEffect(() => {
    setOpen(false);
    if (!location.hash) return;
    const target = document.getElementById(location.hash.slice(1));
    const heading = target?.querySelector<HTMLElement>('[tabindex="-1"]');
    (heading ?? target)?.focus();
  }, [location.key, location.hash]);

  const current = (href: string) =>
    !href.includes("#") && href === location.pathname ? "page" : undefined;

  return (
    <div className="ct-site ct-v2">
      <a className="v2-skip" href="#main-content">
        {content.frame.skip}
      </a>
      <header className="v2-header">
        <div className="v2-wrap v2-bar">
          <Brand />
          <button
            ref={toggle}
            type="button"
            className="v2-menu-toggle"
            aria-expanded={open}
            aria-controls={MENU_ID}
            aria-label={open ? content.frame.closeMenu : content.frame.openMenu}
            onClick={() => setOpen((value) => !value)}
          >
            <span className="v2-bars" aria-hidden="true" />
            <span aria-hidden="true">{content.frame.menu}</span>
          </button>
          <nav className="v2-nav" aria-label={content.frame.primaryNav}>
            <ul
              id={MENU_ID}
              className={open ? "v2-menu v2-menu--open" : "v2-menu"}
              onClick={(event) => {
                if ((event.target as HTMLElement).closest("a")) setOpen(false);
              }}
            >
              {nav.map((item) => (
                <li key={item.href}>
                  <Link to={item.href} aria-current={current(item.href)}>
                    {item.label}
                  </Link>
                </li>
              ))}
              <li className="v2-menu-cta">
                <ContactLink primary>{content.frame.cta}</ContactLink>
              </li>
            </ul>
          </nav>
          <Link className="v2-btn v2-btn--sm v2-header-cta" to={CONTACT_HREF}>
            {content.frame.cta}
          </Link>
        </div>
      </header>
      <main id="main-content" className="v2-main" tabIndex={-1}>
        {children}
      </main>
      <footer className="v2-footer">
        <div className="v2-wrap">
          <div className="v2-footer-grid">
            <div className="v2-stack">
              <Brand />
              <p>{content.frame.footerSummary}</p>
              <p className="v2-subtle">{content.frame.footerStatus}</p>
            </div>
            <nav className="v2-footer-nav" aria-label={content.frame.footerNav}>
              <ul>
                {nav.map((item) => (
                  <li key={item.href}>
                    <Link to={item.href} aria-current={current(item.href)}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          <p className="v2-footer-legal">
            © {new Date().getFullYear()} {content.frame.copyright}
          </p>
        </div>
      </footer>
    </div>
  );
}

export function V2Home({ contact }: { contact: ContactLinks }) {
  const home = content.home;
  const partnerHref = contact.contactEmail
    ? `mailto:${contact.contactEmail}?subject=${encodeURIComponent(home.contact.partner.subject)}`
    : "";
  return (
    <>
      <section className="v2-hero" aria-labelledby="v2-home-title">
        <div className="v2-wrap v2-hero-grid">
          <div className="v2-hero-copy">
            <Eyebrow>{home.hero.eyebrow}</Eyebrow>
            <h1 className="v2-display" id="v2-home-title" tabIndex={-1}>
              {content.routes.home.h1}
            </h1>
            <p className="v2-lede">{home.hero.lede}</p>
            <div className="v2-actions">
              <ContactLink primary>{content.frame.cta}</ContactLink>
            </div>
          </div>
          <div className="v2-flagship">
            <div className="v2-row">
              <Eyebrow>{home.flagship.eyebrow}</Eyebrow>
              <Status kind="development">{content.status.inDevelopment}</Status>
            </div>
            <p className="v2-flagship-name">{home.flagship.name}</p>
            <p>{home.flagship.copy}</p>
            <Link className="v2-link" to="/commerce">
              {home.flagship.link} <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="v2-section v2-light" aria-labelledby="v2-services-title">
        <div className="v2-wrap">
          <SectionHead
            eyebrow={home.services.eyebrow}
            id="v2-services-title"
            title={home.services.title}
          >
            <p className="v2-body">{home.services.copy}</p>
          </SectionHead>
          <ul className="v2-trio">
            {content.services.map((service, i) => (
              <li className="v2-card" key={service.title}>
                <div className="v2-row">
                  <span className="v2-idx">0{i + 1}</span>
                  <Status kind="available">{content.status.available}</Status>
                </div>
                <h3 className="v2-h3">{service.title}</h3>
                <p className="v2-body">{service.summary}</p>
              </li>
            ))}
          </ul>
          <p className="v2-after">
            <Link className="v2-link" to="/solutions">
              {home.services.link} <span aria-hidden="true">→</span>
            </Link>
          </p>
        </div>
      </section>

      <section
        className="v2-section v2-surface"
        aria-labelledby="v2-showcase-title"
      >
        <div className="v2-wrap">
          <SectionHead
            eyebrow={home.showcase.eyebrow}
            id="v2-showcase-title"
            title={home.showcase.title}
          >
            <div className="v2-stack">
              <p className="v2-body">{home.showcase.copy}</p>
              <Link className="v2-link" to="/commerce">
                {home.flagship.link} <span aria-hidden="true">→</span>
              </Link>
            </div>
          </SectionHead>
          <SyntheticIllustration />
        </div>
      </section>

      <section className="v2-section" aria-labelledby="v2-process-title">
        <div className="v2-wrap">
          <SectionHead
            eyebrow={home.process.eyebrow}
            id="v2-process-title"
            title={home.process.title}
          >
            <p className="v2-body">{home.process.copy}</p>
          </SectionHead>
          <ol className="v2-steps">
            {home.process.steps.map(([title, copy]) => (
              <li key={title}>
                <h3 className="v2-h3">{title}</h3>
                <p>{copy}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        className="v2-section v2-light"
        aria-labelledby="v2-principles-title"
      >
        <div className="v2-wrap v2-split">
          <SectionHead
            eyebrow={home.principles.eyebrow}
            id="v2-principles-title"
            title={home.principles.title}
            split={false}
          />
          <ul className="v2-principles">
            {home.principles.items.map(([title, copy]) => (
              <li key={title}>
                <h3 className="v2-h3">{title}</h3>
                <p className="v2-body">{copy}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="v2-section" aria-labelledby="v2-segments-title">
        <div className="v2-wrap v2-split">
          <SectionHead
            eyebrow={home.segments.eyebrow}
            id="v2-segments-title"
            title={home.segments.title}
            split={false}
          />
          <div className="v2-stack">
            <p className="v2-body">{home.segments.copy}</p>
            <ul className="v2-tags">
              {home.segments.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section
        id="company"
        className="v2-section v2-light"
        aria-labelledby="v2-company-title"
      >
        <div className="v2-wrap v2-split">
          <SectionHead
            eyebrow={home.company.eyebrow}
            id="v2-company-title"
            title={home.company.title}
            focusable
            split={false}
          />
          <div className="v2-stack">
            <p className="v2-lede v2-lede--wide">{home.company.copy}</p>
            <dl className="v2-facts">
              {home.company.facts.map(([term, value, kind]) => (
                <div key={term}>
                  <dt>{term}</dt>
                  <dd>
                    {kind ? (
                      <Status kind={kind as StatusKind}>{value}</Status>
                    ) : (
                      value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section
        id="contact"
        className="v2-section"
        aria-labelledby="v2-contact-title"
      >
        <div className="v2-wrap">
          <SectionHead
            eyebrow={home.contact.eyebrow}
            id="v2-contact-title"
            title={home.contact.title}
            focusable
          />
          <div className="v2-intents">
            <article
              className="v2-intent v2-intent--project"
              aria-labelledby="v2-intent-project"
            >
              <h3 className="v2-h3" id="v2-intent-project">
                {home.contact.project.title}
              </h3>
              <p className="v2-body">{home.contact.project.copy}</p>
              <ContactActions {...contact} />
            </article>
            {partnerHref && (
              <article
                className="v2-intent v2-intent--partner"
                aria-labelledby="v2-intent-partner"
              >
                <h3 className="v2-h3" id="v2-intent-partner">
                  {home.contact.partner.title}
                </h3>
                <p className="v2-body">{home.contact.partner.copy}</p>
                <div className="v2-actions">
                  <a className="v2-btn" href={partnerHref}>
                    {home.contact.partner.action}
                  </a>
                </div>
              </article>
            )}
          </div>
          <p className="v2-contact-note">{home.contact.note}</p>
        </div>
      </section>
    </>
  );
}

export function V2Commerce() {
  const commerce = content.commerce;
  return (
    <>
      <section className="v2-hero" aria-labelledby="v2-commerce-title">
        <div className="v2-wrap v2-hero-grid">
          <div className="v2-hero-copy">
            <Eyebrow>{commerce.eyebrow}</Eyebrow>
            <h1 className="v2-display" id="v2-commerce-title" tabIndex={-1}>
              {content.routes.commerce.h1}
            </h1>
            <p>
              <Status kind="development" large>
                {content.status.notYetAvailable}
              </Status>
            </p>
            <p className="v2-lede">{commerce.lede}</p>
            <div className="v2-actions">
              <ContactLink primary>{content.frame.cta}</ContactLink>
              <ContactLink>{commerce.partnerAction}</ContactLink>
            </div>
          </div>
          <div className="v2-glance">
            <Eyebrow>{commerce.glance.title}</Eyebrow>
            <dl>
              {commerce.glance.rows.map(([term, value]) => (
                <div key={term}>
                  <dt>{term}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className="v2-section" aria-labelledby="v2-problem-title">
        <div className="v2-wrap">
          <SectionHead
            eyebrow={commerce.problem.eyebrow}
            id="v2-problem-title"
            title={commerce.problem.title}
          />
          <ol className="v2-problems">
            {commerce.problem.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </div>
      </section>

      <section className="v2-section v2-surface" aria-labelledby="v2-idea-title">
        <div className="v2-wrap">
          <SectionHead
            eyebrow={commerce.idea.eyebrow}
            id="v2-idea-title"
            title={commerce.idea.title}
          >
            <p className="v2-body">{commerce.idea.copy}</p>
          </SectionHead>
          <SyntheticIllustration />
        </div>
      </section>

      <section className="v2-section v2-light" aria-labelledby="v2-meaning-title">
        <div className="v2-wrap v2-split">
          <SectionHead
            eyebrow={commerce.meaning.eyebrow}
            id="v2-meaning-title"
            title={commerce.meaning.title}
            split={false}
          />
          <p className="v2-lede v2-lede--wide">{commerce.meaning.copy}</p>
        </div>
      </section>

      <Band
        eyebrow={commerce.partner.eyebrow}
        id="v2-partner-title"
        title={commerce.partner.title}
        copy={commerce.partner.copy}
        accent="accent"
      >
        <ContactLink>{commerce.partnerAction}</ContactLink>
      </Band>

      <Band
        eyebrow={commerce.now.eyebrow}
        id="v2-now-title"
        title={commerce.now.title}
        copy={commerce.now.copy}
        accent="action"
      >
        <ContactLink primary>{content.frame.cta}</ContactLink>
      </Band>
    </>
  );
}

export function V2Solutions() {
  const solutions = content.solutions;
  return (
    <>
      <section className="v2-hero" aria-labelledby="v2-solutions-title">
        <div className="v2-wrap v2-hero-grid">
          <div className="v2-hero-copy">
            <Eyebrow>{solutions.eyebrow}</Eyebrow>
            <h1 className="v2-h1" id="v2-solutions-title" tabIndex={-1}>
              {content.routes.solutions.h1}
            </h1>
            <p className="v2-lede">{solutions.lede}</p>
            <div className="v2-actions">
              <ContactLink primary>{content.frame.cta}</ContactLink>
            </div>
          </div>
          <div className="v2-glance">
            <Eyebrow>{solutions.overview}</Eyebrow>
            <dl>
              {content.services.map((service, i) => (
                <div key={service.title}>
                  <dt>0{i + 1}</dt>
                  <dd>
                    {service.title}{" "}
                    <Status kind="available">{content.status.available}</Status>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className="v2-section v2-light" aria-labelledby="v2-detail-title">
        <div className="v2-wrap">
          <SectionHead
            eyebrow={solutions.detail.eyebrow}
            id="v2-detail-title"
            title={solutions.detail.title}
          />
          <div>
            {content.services.map((service, i) => (
              <article
                className="v2-svc"
                key={service.title}
                aria-labelledby={`v2-svc-${i + 1}`}
              >
                <span className="v2-idx">0{i + 1}</span>
                <div className="v2-stack">
                  <h3 className="v2-h3" id={`v2-svc-${i + 1}`}>
                    {service.title}
                  </h3>
                  <span>
                    <Status kind="available">{content.status.available}</Status>
                  </span>
                </div>
                <div className="v2-stack">
                  <p className="v2-body">{service.detail}</p>
                  <ul className="v2-scope">
                    {service.scope.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="v2-section v2-surface"
        aria-labelledby="v2-engagement-title"
      >
        <div className="v2-wrap">
          <SectionHead
            eyebrow={solutions.engagement.eyebrow}
            id="v2-engagement-title"
            title={solutions.engagement.title}
          >
            <div className="v2-stack">
              <span className="v2-illus-label">{solutions.engagement.label}</span>
              <p className="v2-body">{solutions.engagement.copy}</p>
            </div>
          </SectionHead>
          <ol className="v2-phases">
            {solutions.engagement.phases.map(([verb, title, copy]) => (
              <li key={title}>
                <span className="v2-verb">{verb}</span>
                <h3 className="v2-h3">{title}</h3>
                <p>{copy}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="v2-section v2-light" aria-labelledby="v2-promise-title">
        <div className="v2-wrap">
          <SectionHead
            eyebrow={solutions.commitments.eyebrow}
            id="v2-promise-title"
            title={solutions.commitments.title}
          />
          <div className="v2-promise">
            <div className="v2-will">
              <h3 className="v2-h3">{solutions.commitments.willTitle}</h3>
              <ul>
                {solutions.commitments.will.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="v2-wont">
              <h3 className="v2-h3">{solutions.commitments.wontTitle}</h3>
              <ul>
                {solutions.commitments.wont.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="v2-section" aria-labelledby="v2-faq-title">
        <div className="v2-wrap">
          <SectionHead
            eyebrow={solutions.faq.eyebrow}
            id="v2-faq-title"
            title={solutions.faq.title}
          />
          <dl className="v2-faq">
            {solutions.faq.items.map(([question, answer]) => (
              <div key={question}>
                <dt>{question}</dt>
                <dd>{answer}</dd>
              </div>
            ))}
          </dl>
          <p className="v2-after">
            <Link className="v2-link" to="/commerce">
              {content.home.flagship.link} <span aria-hidden="true">→</span>
            </Link>
          </p>
        </div>
      </section>

      <Band
        id="v2-start-title"
        title={solutions.start.title}
        copy={solutions.start.copy}
        accent="action"
      >
        <ContactLink primary>{content.frame.cta}</ContactLink>
      </Band>
    </>
  );
}
