import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TransactionStepperDialog } from "./TransactionStepperDialog";

describe("TransactionStepperDialog", () => {
	it("shows the active approval and pending deposit steps", () => {
		render(
			<TransactionStepperDialog
				busy
				error={null}
				onClose={vi.fn()}
				flow={{
					action: "deposit",
					amount: "25",
					open: true,
					complete: false,
					steps: [
						{
							id: "network",
							label: "Mantle network",
							description: "Connected.",
							status: "complete",
						},
						{
							id: "approval",
							label: "Approve USDe",
							description: "Approve the vault.",
							status: "active",
						},
						{
							id: "deposit",
							label: "Deposit into MolQ",
							description: "Mint shares.",
							status: "pending",
						},
					],
				}}
			/>,
		);

		expect(screen.getByRole("dialog", { name: "Deposit USDe" })).toBeInTheDocument();
		expect(screen.getByText("Approve USDe")).toBeInTheDocument();
		expect(screen.getByText("Deposit into MolQ")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /close/i })).toBeDisabled();
	});

	it("shows completion and links to Mantlescan", () => {
		const hash = `0x${"1".repeat(64)}` as const;
		render(
			<TransactionStepperDialog
				busy={false}
				error={null}
				onClose={vi.fn()}
				flow={{
					action: "withdraw",
					amount: "10",
					open: true,
					complete: true,
					steps: [
						{
							id: "redeem",
							label: "Redeem mqUSDe",
							description: "Return USDe.",
							status: "complete",
							hash,
						},
					],
				}}
			/>,
		);

		expect(screen.getByRole("heading", { name: "Withdraw USDe complete" })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: /view transaction/i })).toHaveAttribute(
			"href",
			`https://mantlescan.xyz/tx/${hash}`,
		);
		expect(screen.getByRole("button", { name: "Done" })).toBeEnabled();
	});
});
