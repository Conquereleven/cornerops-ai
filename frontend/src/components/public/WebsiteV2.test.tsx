import { afterEach, describe, expect, test, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import {
  V2Commerce,
  V2Frame,
  V2Home,
  V2Solutions,
  type ContactLinks,
  type PublicNavItem,
} from "./WebsiteV2";
import { ContactActions } from "./CornerTechSite";
import { websiteV2Content as content } from "../../config/publicContent";

const BOOKING = "https://calendar.example.test/book";
const WHATSAPP = "https://wa.me/000000000";
const EMAIL = "hello@example.test";
const NO_BOOKING: ContactLinks = { bookingUrl: "", whatsappUrl: WHATSAPP, contactEmail: EMAIL };

const nav: PublicNavItem[] = [
  { label: content.navigation.commerce, href: "/products/commerce" },
  { label: content.navigation.solutions, href: "/solutions" },
  { label: content.navigation.company, href: "/#company" },
  { label: content.navigation.contact, href: "/#contact" },
];

const PAGES = [
  ["/", content.routes.home.h1],
  ["/products/commerce", content.routes.commerce.h1],
  ["/solutions", content.routes.solutions.h1],
] as const;

function renderAt(path: string, contact: ContactLinks = NO_BOOKING) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <V2Frame nav={nav}>
        <Routes>
          <Route path="/" element={<V2Home contact={contact} />} />
          <Route path="/products/commerce" element={<V2Commerce />} />
          <Route path="/solutions" element={<V2Solutions />} />
        </Routes>
      </V2Frame>
    </MemoryRouter>,
  );
}

const section = (heading: string) =>
  screen.getByRole("heading", { name: heading }).closest("section") as HTMLElement;
const primaryNav = () => screen.getByRole("navigation", { name: content.frame.primaryNav });

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Website V2 frame", () => {
  test.each(PAGES)("%s has one main, one h1 (tabIndex -1) and a working skip link", (path, h1) => {
    renderAt(path);
    const mains = screen.getAllByRole("main");
    expect(mains).toHaveLength(1);
    expect(mains[0]).toHaveAttribute("id", "main-content");
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent(h1);
    expect(headings[0]).toHaveAttribute("tabindex", "-1");
    expect(screen.getByRole("link", { name: content.frame.skip })).toHaveAttribute("href", "#main-content");
    expect(screen.getAllByRole("banner")).toHaveLength(1);
    expect(screen.getAllByRole("contentinfo")).toHaveLength(1);
    expect(document.querySelector(".ct-site.ct-v2")).not.toBeNull();
  });

  test("brand, navigation and header CTA resolve to real in-app targets", () => {
    renderAt("/solutions");
    for (const brand of screen.getAllByRole("link", { name: content.frame.brandLabel })) {
      expect(brand).toHaveAttribute("href", "/");
      expect(brand.querySelector("img")).toHaveAttribute("src", "/brand/logo-mark.png");
    }
    const links = within(primaryNav()).getAllByRole("link");
    expect(links.slice(0, 4).map((link) => link.getAttribute("href"))).toEqual(nav.map((item) => item.href));
    expect(within(primaryNav()).getByRole("link", { name: content.navigation.solutions })).toHaveAttribute("aria-current", "page");
    expect(within(primaryNav()).getByRole("link", { name: content.navigation.company })).not.toHaveAttribute("aria-current");
    const banner = screen.getByRole("banner");
    for (const cta of within(banner).getAllByRole("link", { name: content.frame.cta })) {
      expect(cta).toHaveAttribute("href", "/#contact");
    }
  });

  test("navigation moves between pages and exposes the approved Home section targets", async () => {
    const user = userEvent.setup();
    renderAt("/");
    await user.click(within(primaryNav()).getByRole("link", { name: content.navigation.commerce }));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(content.routes.commerce.h1);
    await user.click(within(primaryNav()).getByRole("link", { name: content.navigation.company }));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(content.routes.home.h1);
    expect(screen.getByRole("heading", { name: content.home.company.title })).toBeInTheDocument();
    expect(within(primaryNav()).getByRole("link", { name: content.navigation.company })).toHaveAttribute("href", "/#company");
    await user.click(within(primaryNav()).getByRole("link", { name: content.navigation.contact }));
    expect(screen.getByRole("heading", { name: content.home.contact.title })).toBeInTheDocument();
    expect(within(primaryNav()).getByRole("link", { name: content.navigation.contact })).toHaveAttribute("href", "/#contact");
  });

  test("mobile menu is a disclosure that closes on Escape (returning focus) and on link activation", async () => {
    const user = userEvent.setup();
    renderAt("/");
    const toggle = screen.getByRole("button", { name: content.frame.openMenu });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    const menu = document.getElementById(toggle.getAttribute("aria-controls") ?? "");
    expect(menu).not.toBeNull();
    expect(primaryNav()).toContainElement(menu);

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(toggle).toHaveAccessibleName(content.frame.closeMenu);
    expect(menu).toHaveClass("v2-menu--open");

    await user.keyboard("{Escape}");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveAccessibleName(content.frame.openMenu);
    expect(toggle).toHaveFocus();

    await user.click(toggle);
    await user.click(within(menu as HTMLElement).getByRole("link", { name: content.navigation.solutions }));
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(menu).not.toHaveClass("v2-menu--open");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(content.routes.solutions.h1);
  });
});

describe("Website V2 pages", () => {
  test("render statically: no network API is used and no form, frame or script is present", async () => {
    const fetchSentinel = vi.fn();
    vi.stubGlobal("fetch", fetchSentinel);
    const xhrOpen = vi.spyOn(XMLHttpRequest.prototype, "open");
    const socket = vi.fn();
    vi.stubGlobal("WebSocket", socket);
    const user = userEvent.setup();
    const { container } = renderAt("/");
    await user.click(within(primaryNav()).getByRole("link", { name: content.navigation.commerce }));
    await user.click(within(primaryNav()).getByRole("link", { name: content.navigation.solutions }));
    expect(fetchSentinel).not.toHaveBeenCalled();
    expect(xhrOpen).not.toHaveBeenCalled();
    expect(socket).not.toHaveBeenCalled();
    expect(container.querySelector("form, input, textarea, select, iframe, script, object, embed")).toBeNull();
  });

  test.each(PAGES)("%s contains no customer, private, provider or unsupported claim content", (path) => {
    const { container } = renderAt(path);
    const text = container.textContent ?? "";
    expect(text).not.toMatch(
      /Tres Leches|Command Center|sign in|log ?in|password|dashboard access|ISO ?\d|SOC ?2|certified|certification|enterprise|trusted by|guarantee|\d+\s?%|\b\d+x\b|Shopify|Stripe|OpenAI|Supabase|WooCommerce|Talabat|Amazon/i,
    );
    expect(text).not.toMatch(/@|\+971/); // contact values live only in hrefs
    expect([...container.querySelectorAll("img")].map((img) => img.getAttribute("src"))).toEqual(
      expect.arrayContaining(["/brand/logo-mark.png"]),
    );
    expect(container.querySelectorAll("img:not([src='/brand/logo-mark.png'])")).toHaveLength(0);
    expect(container.querySelectorAll("a[href^='/login'], a[href*='/api']")).toHaveLength(0);
  });

  test("Home shows Commerce as in development and exactly three available services", () => {
    renderAt("/");
    const hero = section(content.routes.home.h1);
    expect(within(hero).getByText(content.status.inDevelopment)).toBeInTheDocument();
    expect(within(hero).getByText(content.home.flagship.name)).toBeInTheDocument();
    expect(within(hero).getByRole("link", { name: new RegExp(content.home.flagship.link) })).toHaveAttribute("href", "/products/commerce");
    const services = within(section(content.home.services.title)).getAllByRole("listitem");
    expect(services).toHaveLength(3);
    services.forEach((card, i) => {
      expect(within(card).getByRole("heading", { level: 3 })).toHaveTextContent(content.services[i].title);
      expect(within(card).getByText(content.status.available)).toBeInTheDocument();
    });
    expect(screen.getByRole("link", { name: new RegExp(content.home.services.link) })).toHaveAttribute("href", "/solutions");
  });

  test("Home has process/principles/segments, and focusable Company and Contact targets", () => {
    renderAt("/");
    expect(section(content.home.process.title)).toBeInTheDocument();
    expect(section(content.home.principles.title)).toBeInTheDocument();
    expect(within(section(content.home.segments.title)).getAllByRole("listitem")).toHaveLength(6);
    for (const [id, title] of [["company", content.home.company.title], ["contact", content.home.contact.title]]) {
      const target = document.getElementById(id) as HTMLElement;
      expect(target.tagName).toBe("SECTION");
      expect(within(target).getByRole("heading", { level: 2, name: title })).toHaveAttribute("tabindex", "-1");
    }
  });

  test.each(["/", "/products/commerce"])("%s labels the concept illustration as synthetic data", (path) => {
    renderAt(path);
    expect(screen.getByRole("img", { name: /synthetic data/i })).toHaveTextContent(content.illustration.caption);
  });

  test("Commerce is truthful about status and omits unapproved capability detail", () => {
    const { container } = renderAt("/products/commerce");
    expect(screen.getByText(content.status.notYetAvailable)).toBeInTheDocument();
    expect(content.commerceCapabilities).toHaveLength(0);
    expect(container.querySelector("table")).toBeNull();
    expect(container.textContent).not.toMatch(/Storefront|Payment status|Channel connectors|Merchant operations console|Planned/);
    const hero = section(content.routes.commerce.h1);
    expect(within(hero).getByRole("link", { name: content.frame.cta })).toHaveAttribute("href", "/#contact");
    expect(within(hero).getByRole("link", { name: content.commerce.partnerAction })).toHaveAttribute("href", "/#contact");
  });

  test("Solutions lists three available services and a project CTA", () => {
    renderAt("/solutions");
    expect(screen.getAllByRole("article")).toHaveLength(3);
    content.services.forEach((service) =>
      expect(screen.getByRole("heading", { level: 3, name: service.title })).toBeInTheDocument(),
    );
    expect(within(section(content.routes.solutions.h1)).getByRole("link", { name: content.frame.cta })).toHaveAttribute("href", "/#contact");
    expect(screen.getByText(content.solutions.engagement.label)).toBeInTheDocument();
  });
});

describe("Website V2 contact hierarchy", () => {
  const contactSection = () => document.getElementById("contact") as HTMLElement;

  test("without booking: existing ContactActions (WhatsApp primary, Email secondary) plus a distinct design-partner email", () => {
    renderAt("/");
    const project = within(contactSection()).getByRole("article", { name: content.home.contact.project.title });
    const discuss = within(project).getByRole("link", { name: "Discuss a project on WhatsApp (opens in a new tab)" });
    expect(discuss).toHaveAttribute("href", WHATSAPP);
    expect(discuss).toHaveClass("ct-primary");
    const email = within(project).getByRole("link", { name: "Email us" });
    expect(email).toHaveAttribute("href", `mailto:${EMAIL}`);
    expect(email).not.toHaveClass("ct-primary");

    const partner = within(contactSection()).getByRole("article", { name: content.home.contact.partner.title });
    const partnerLinks = within(partner).getAllByRole("link");
    expect(partnerLinks).toHaveLength(1);
    expect(partnerLinks[0]).toHaveAccessibleName(content.home.contact.partner.action);
    expect(partnerLinks[0]).toHaveAttribute(
      "href",
      `mailto:${EMAIL}?subject=${encodeURIComponent(content.home.contact.partner.subject)}`,
    );
    expect(partnerLinks[0]).not.toHaveClass("ct-primary");

    expect(document.querySelectorAll(`a[href='${WHATSAPP}']`)).toHaveLength(1);
    expect(screen.queryByRole("link", { name: /^WhatsApp/ })).toBeNull();
    expect(contactSection().querySelectorAll(".ct-primary, .v2-btn--primary")).toHaveLength(1);
  });

  test("project actions are exactly the existing ContactActions output", () => {
    renderAt("/");
    const embedded = contactSection().querySelector(".ct-actions") as HTMLElement;
    const { container } = render(<ContactActions {...NO_BOOKING} />);
    expect(embedded.outerHTML).toBe((container.firstElementChild as HTMLElement).outerHTML);
  });

  test("with a verified booking link, Book a call leads and WhatsApp still appears once", () => {
    renderAt("/", { bookingUrl: BOOKING, whatsappUrl: WHATSAPP, contactEmail: EMAIL });
    const book = within(contactSection()).getByRole("link", { name: /Book a call/ });
    expect(book).toHaveAttribute("href", BOOKING);
    expect(book).toHaveClass("ct-primary");
    expect(document.querySelectorAll(`a[href='${WHATSAPP}']`)).toHaveLength(1);
  });

  test("without an email address the design-partner action is omitted, not faked", () => {
    renderAt("/", { bookingUrl: "", whatsappUrl: WHATSAPP, contactEmail: "" });
    expect(screen.queryByRole("article", { name: content.home.contact.partner.title })).toBeNull();
    expect(document.querySelectorAll("a[href^='mailto:']")).toHaveLength(0);
  });
});

describe("websiteV2Content contract", () => {
  test("exposes the keyed route, navigation and version copy Codex consumes", () => {
    for (const key of ["home", "commerce", "solutions"] as const) {
      const route = content.routes[key];
      expect(Object.keys(route).sort()).toEqual(["description", "h1", "title"]);
      Object.values(route).forEach((value) => expect(value.trim().length).toBeGreaterThan(0));
    }
    expect(content.navigation).toEqual({ commerce: "Commerce", solutions: "Solutions", company: "Company", contact: "Contact" });
    expect(content.contentVersion).toBe("content@1");
    expect(content.tokensVersion).toBe("tokens@1");
    expect(content.commerceCapabilities).toEqual([]);
  });

  test("publishes no internal approval or evidence metadata", () => {
    const keys: string[] = [];
    const collect = (value: unknown) => {
      if (value && typeof value === "object") {
        for (const [key, child] of Object.entries(value)) {
          if (!Array.isArray(value)) keys.push(key);
          collect(child);
        }
      }
    };
    collect(content);
    expect(keys.filter((key) => /evidence|approv|ledger|claimId|owner|hash/i.test(key))).toEqual([]);
  });
});
