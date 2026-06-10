import { render, screen } from "@testing-library/react";
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
});
