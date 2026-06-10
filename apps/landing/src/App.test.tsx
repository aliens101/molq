import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import App from "./App";

test("renders MolQ landing page and main action", () => {
	vi.stubGlobal(
		"fetch",
		vi.fn(() => new Promise(() => undefined)),
	);
	render(<App />);
	expect(screen.getByRole("heading", { name: "MolQ autonomous USDe yield" })).toBeInTheDocument();
	expect(screen.getAllByRole("link", { name: /launch/i }).length).toBeGreaterThan(0);
	expect(screen.getAllByText("Agent #112").length).toBeGreaterThan(0);
	expect(screen.getByText("Experimental and not independently audited")).toBeInTheDocument();

	fireEvent.click(screen.getByRole("button", { name: "Get USDe" }));
	expect(screen.getByRole("dialog", { name: "Get USDe on Mantle" })).toBeInTheDocument();
	expect(screen.getByRole("link", { name: /merchant moe/i })).toHaveAttribute(
		"href",
		"https://merchantmoe.com/trade",
	);
});
