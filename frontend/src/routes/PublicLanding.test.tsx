import { expect, test } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { PublicLanding } from "./PublicLanding";

const open = () =>
  render(
    <MemoryRouter>
      <PublicLanding />
    </MemoryRouter>,
  );

test("mobile menu announces state, closes on navigation and restores toggle focus on Escape", async () => {
  open();
  await userEvent.click(screen.getByRole("button", { name: "Open menu" }));
  expect(screen.getByRole("button", { name: "Close menu" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await userEvent.click(screen.getByRole("link", { name: "Industries" }));
  expect(screen.getByRole("button", { name: "Open menu" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await userEvent.click(screen.getByRole("button", { name: "Open menu" }));
  fireEvent.keyDown(window, { key: "Escape" });
  expect(screen.getByRole("button", { name: "Open menu" })).toHaveFocus();
});

test("public evidence labels distinguish reconstructed surfaces and internal work from client proof", () => {
  const { container } = open();
  expect(
    screen.getByRole("img", { name: /Illustrative Tres Leches system/ }),
  ).toBeInTheDocument();
  expect(screen.getByText("In development")).toBeInTheDocument();
  expect(screen.getByText("Internal system")).toBeInTheDocument();
  expect(container.textContent).not.toMatch(
    /CornerOps|ROI|revenue|testimonials/i,
  );
  expect(screen.getByRole("link", { name: /View project/ })).toHaveAttribute(
    "href",
    "#tres-leches-details",
  );
});
