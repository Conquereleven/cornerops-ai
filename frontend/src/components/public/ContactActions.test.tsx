import { describe, expect, test } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ContactActions } from "./CornerTechSite";

const BOOKING = "https://calendar.example.test/book";
const WHATSAPP = "https://wa.me/000000000";
const EMAIL = "hello@example.test";

const links = () => screen.getAllByRole("link");
const primary = () => links().filter((link) => link.classList.contains("ct-primary"));

describe("ContactActions", () => {
  test("with a verified booking link, Book a call is the single primary action", () => {
    render(<ContactActions bookingUrl={BOOKING} whatsappUrl={WHATSAPP} contactEmail={EMAIL} />);
    expect(primary()).toHaveLength(1);
    const book = screen.getByRole("link", { name: /Book a call/ });
    expect(book).toBe(primary()[0]);
    expect(book).toHaveAttribute("href", BOOKING);
    expect(book).toHaveAttribute("target", "_blank");
    expect(book).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByRole("link", { name: "Email us" })).toHaveAttribute("href", `mailto:${EMAIL}`);
    expect(screen.queryByRole("link", { name: /Discuss a project/ })).toBeNull();
    // Each destination appears once.
    expect(links().filter((link) => link.getAttribute("href") === WHATSAPP)).toHaveLength(1);
  });

  test("without a booking link, Discuss a project opens WhatsApp and is the primary action", () => {
    render(<ContactActions bookingUrl="" whatsappUrl={WHATSAPP} contactEmail={EMAIL} />);
    expect(screen.queryByRole("link", { name: /Book a call/ })).toBeNull();
    const discuss = screen.getByRole("link", { name: /Discuss a project/ });
    expect(primary()).toEqual([discuss]);
    expect(discuss).toHaveAttribute("href", WHATSAPP);
    expect(discuss).toHaveAttribute("target", "_blank");
    expect(discuss).toHaveAttribute("rel", "noopener noreferrer");
    expect(discuss).toHaveAccessibleName("Discuss a project on WhatsApp (opens in a new tab)");
  });

  test("without a booking link, there is no duplicate WhatsApp button and email stays secondary", () => {
    render(<ContactActions bookingUrl="" whatsappUrl={WHATSAPP} contactEmail={EMAIL} />);
    expect(links().filter((link) => link.getAttribute("href") === WHATSAPP)).toHaveLength(1);
    expect(screen.queryByRole("link", { name: /^WhatsApp/ })).toBeNull();
    const email = screen.getByRole("link", { name: "Email us" });
    expect(email).toHaveAttribute("href", `mailto:${EMAIL}`);
    expect(email).not.toHaveClass("ct-primary");
    expect(links()).toHaveLength(2);
  });

  test("keyboard order follows visual priority: primary first, then email", async () => {
    render(<ContactActions bookingUrl="" whatsappUrl={WHATSAPP} contactEmail={EMAIL} />);
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole("link", { name: /Discuss a project/ }));
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole("link", { name: "Email us" }));
  });

  test("decorative arrow icons are hidden from assistive technology", () => {
    const { container } = render(<ContactActions bookingUrl={BOOKING} whatsappUrl={WHATSAPP} contactEmail={EMAIL} />);
    container.querySelectorAll("svg").forEach((icon) => expect(icon).toHaveAttribute("aria-hidden", "true"));
  });

  test("with neither booking nor WhatsApp, email becomes the primary action", () => {
    render(<ContactActions bookingUrl="" whatsappUrl="" contactEmail={EMAIL} />);
    expect(primary()).toHaveLength(1);
    expect(within(primary()[0]).getByText("Email us")).toBeInTheDocument();
  });

  test("with no channel configured, nothing is rendered", () => {
    const { container } = render(<ContactActions bookingUrl="" whatsappUrl="" contactEmail="" />);
    expect(container).toBeEmptyDOMElement();
  });
});
