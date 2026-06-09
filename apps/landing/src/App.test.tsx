import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders MolQ landing page and main action", () => {
	render(<App />);
	expect(screen.getByRole("heading", { name: "MolQ" })).toBeInTheDocument();
	expect(screen.getAllByRole("link", { name: /launch/i }).length).toBeGreaterThan(0);
	expect(screen.getAllByText("Agent #112").length).toBeGreaterThan(0);
});
