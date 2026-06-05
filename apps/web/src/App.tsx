import { useEffect, useMemo, useState } from "react";
import type { DashboardResponse, MolqRiskMode } from "@molq/shared";
import {
	Activity,
	ArrowDownToLine,
	Bot,
	CircleDollarSign,
	RefreshCw,
	ShieldCheck,
	TrendingUp,
	Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { deposit, getDashboard, resetSimulation, runAgentCycle } from "@/molq/api";

const RISK_MODES: Array<{ id: MolqRiskMode; label: string; description: string }> = [
	{ id: "conservative", label: "Conservative", description: "90 / 10" },
	{ id: "balanced", label: "Balanced", description: "85 / 15" },
	{ id: "growth", label: "Growth", description: "75 / 25" },
];

export default function App() {
	const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
	const [amount, setAmount] = useState("1000");
	const [riskMode, setRiskMode] = useState<MolqRiskMode>("balanced");
	const [busy, setBusy] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		void perform("load", getDashboard);
	}, []);

	const stats = useMemo(() => {
		const portfolio = dashboard?.portfolio;
		const market = dashboard?.market;
		return [
			{
				label: "Vault balance",
				value: money(portfolio?.balance ?? 0),
				sub: `${money(portfolio?.realizedProfit ?? 0)} realized`,
				icon: CircleDollarSign,
			},
			{
				label: "Estimated net APY",
				value: `${market?.estimatedNetApy.toFixed(2) ?? "0.00"}%`,
				sub: "After hedge cost",
				icon: TrendingUp,
			},
			{
				label: "Shield allocation",
				value: `${portfolio?.allocation.shieldPercent ?? 85}%`,
				sub: money(portfolio?.shieldBalance ?? 0),
				icon: ShieldCheck,
			},
			{
				label: "Hedge ratio",
				value: `${market?.hedgeRatio.toFixed(1) ?? "0.0"}%`,
				sub: `Risk score ${market?.riskScore ?? 0}/100`,
				icon: Activity,
			},
		];
	}, [dashboard]);

	async function perform(name: string, operation: () => Promise<DashboardResponse>) {
		setBusy(name);
		setError(null);
		try {
			setDashboard(await operation());
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : "The MolQ API is unavailable.");
		} finally {
			setBusy(null);
		}
	}

	function submitDeposit() {
		const value = Number(amount);
		if (!Number.isFinite(value) || value <= 0) {
			setError("Enter a deposit amount greater than zero.");
			return;
		}
		void perform("deposit", () => deposit(value, riskMode));
	}

	return (
		<div className="min-h-screen bg-zinc-950 text-zinc-100">
			<header className="border-b border-zinc-800">
				<div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
					<div className="flex items-center gap-3">
						<div className="flex h-9 w-9 items-center justify-center bg-emerald-400 text-sm font-bold text-zinc-950">
							MQ
						</div>
						<div>
							<div className="font-semibold">MolQ</div>
							<div className="text-xs text-zinc-500">Mantle CeDeFi yield agent</div>
						</div>
					</div>
					<div className="flex items-center gap-3">
						<div className="hidden items-center gap-2 text-xs text-zinc-400 sm:flex">
							<span className="h-2 w-2 rounded-full bg-emerald-400" />
							Mantle simulation
						</div>
						<Button size="sm">
							<Wallet className="mr-2 h-4 w-4" />
							Connect wallet
						</Button>
					</div>
				</div>
			</header>

			<main className="mx-auto max-w-7xl space-y-8 px-6 py-8">
				<section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
					<div>
						<h1 className="text-3xl font-semibold">Portfolio</h1>
						<p className="mt-2 max-w-2xl text-sm text-zinc-400">
							Basis yield is harvested from the Alpha sleeve and hardened into Shield.
						</p>
					</div>
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							disabled={busy !== null}
							onClick={() => void perform("reset", resetSimulation)}
						>
							<RefreshCw className="mr-2 h-4 w-4" />
							Reset
						</Button>
						<Button
							size="sm"
							disabled={busy !== null || !dashboard?.portfolio.balance}
							onClick={() => void perform("cycle", runAgentCycle)}
						>
							<Bot className="mr-2 h-4 w-4" />
							{busy === "cycle" ? "Running..." : "Run agent cycle"}
						</Button>
					</div>
				</section>

				{error ? (
					<div className="border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-200">
						{error}
					</div>
				) : null}

				<section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
					{stats.map(({ label, value, sub, icon: Icon }) => (
						<Card key={label} className="rounded-md border-zinc-800 bg-zinc-900">
							<CardContent className="flex items-start justify-between p-5">
								<div>
									<div className="text-xs text-zinc-500">{label}</div>
									<div className="mt-2 text-2xl font-semibold">{value}</div>
									<div className="mt-1 text-xs text-zinc-500">{sub}</div>
								</div>
								<Icon className="h-5 w-5 text-emerald-400" />
							</CardContent>
						</Card>
					))}
				</section>

				<section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
					<Card className="rounded-md border-zinc-800 bg-zinc-900">
						<CardHeader>
							<CardTitle className="text-lg">Capital allocation</CardTitle>
							<CardDescription>
								Current {dashboard?.portfolio.riskMode ?? "balanced"} risk policy
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-5">
							<div>
								<div className="mb-2 flex justify-between text-sm">
									<span>Shield</span>
									<span>
										{dashboard?.portfolio.allocation.shieldPercent ?? 85}%
									</span>
								</div>
								<div className="h-2 bg-zinc-800">
									<div
										className="h-full bg-emerald-400"
										style={{
											width: `${dashboard?.portfolio.allocation.shieldPercent ?? 85}%`,
										}}
									/>
								</div>
								<div className="mt-2 text-xs text-zinc-500">
									{money(dashboard?.portfolio.shieldBalance ?? 0)} lower-risk
									capital
								</div>
							</div>
							<div>
								<div className="mb-2 flex justify-between text-sm">
									<span>Alpha</span>
									<span>
										{dashboard?.portfolio.allocation.alphaPercent ?? 15}%
									</span>
								</div>
								<div className="h-2 bg-zinc-800">
									<div
										className="h-full bg-amber-400"
										style={{
											width: `${dashboard?.portfolio.allocation.alphaPercent ?? 15}%`,
										}}
									/>
								</div>
								<div className="mt-2 text-xs text-zinc-500">
									{money(dashboard?.portfolio.alphaBalance ?? 0)} basis strategy
									capital
								</div>
							</div>

							<div className="grid grid-cols-3 gap-3 border-t border-zinc-800 pt-5">
								<Metric
									label="Mantle yield"
									value={`${dashboard?.market.mantleYieldApy.toFixed(2) ?? "0.00"}%`}
								/>
								<Metric
									label="Funding yield"
									value={`${dashboard?.market.fundingApy.toFixed(2) ?? "0.00"}%`}
								/>
								<Metric
									label="Liquidity"
									value={`${dashboard?.market.liquidityScore ?? 0}/100`}
								/>
							</div>
						</CardContent>
					</Card>

					<Card className="rounded-md border-zinc-800 bg-zinc-900">
						<CardHeader>
							<CardTitle className="text-lg">Deposit USDe</CardTitle>
							<CardDescription>Configure the simulated vault policy.</CardDescription>
						</CardHeader>
						<CardContent className="space-y-5">
							<div>
								<label
									htmlFor="amount"
									className="mb-2 block text-xs text-zinc-400"
								>
									Amount
								</label>
								<div className="relative">
									<Input
										id="amount"
										type="number"
										min="1"
										step="1"
										value={amount}
										onChange={(event) => setAmount(event.target.value)}
										className="h-12 rounded-none border-zinc-700 bg-zinc-950 pr-16"
									/>
									<span className="absolute right-3 top-3.5 text-xs text-zinc-500">
										USDe
									</span>
								</div>
							</div>

							<div>
								<div className="mb-2 text-xs text-zinc-400">Risk mode</div>
								<div className="grid grid-cols-3 border border-zinc-700">
									{RISK_MODES.map((mode) => (
										<button
											key={mode.id}
											type="button"
											onClick={() => setRiskMode(mode.id)}
											className={`min-h-16 border-r border-zinc-700 px-2 py-2 text-left last:border-r-0 ${
												riskMode === mode.id
													? "bg-emerald-400 text-zinc-950"
													: "bg-zinc-950 text-zinc-300 hover:bg-zinc-800"
											}`}
										>
											<div className="text-xs font-medium">{mode.label}</div>
											<div className="mt-1 text-[11px] opacity-70">
												{mode.description}
											</div>
										</button>
									))}
								</div>
							</div>

							<Button
								className="w-full"
								disabled={busy !== null}
								onClick={submitDeposit}
							>
								<ArrowDownToLine className="mr-2 h-4 w-4" />
								{busy === "deposit" ? "Allocating..." : "Deposit and allocate"}
							</Button>
						</CardContent>
					</Card>
				</section>

				<section>
					<Card className="rounded-md border-zinc-800 bg-zinc-900">
						<CardHeader>
							<CardTitle className="text-lg">Agent decisions</CardTitle>
							<CardDescription>
								Every production decision will map to MolqDecisionLogger on Mantle.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="divide-y divide-zinc-800">
								{dashboard?.decisions.map((decision) => (
									<div
										key={decision.id}
										className="grid gap-2 py-4 md:grid-cols-[100px_100px_1fr_90px]"
									>
										<div className="text-xs font-medium uppercase text-emerald-400">
											{decision.action}
										</div>
										<div className="text-sm">{money(decision.amount)}</div>
										<div className="text-sm text-zinc-300">
											{decision.reason}
										</div>
										<div className="text-right text-xs text-zinc-500">
											Risk {decision.riskScore}
										</div>
									</div>
								))}
								{!dashboard ? (
									<div className="py-8 text-center text-sm text-zinc-500">
										{busy === "load"
											? "Loading MolQ agent..."
											: "No decisions available."}
									</div>
								) : null}
							</div>
						</CardContent>
					</Card>
				</section>
			</main>
		</div>
	);
}

function Metric({ label, value }: { label: string; value: string }) {
	return (
		<div>
			<div className="text-xs text-zinc-500">{label}</div>
			<div className="mt-1 text-sm font-medium">{value}</div>
		</div>
	);
}

function money(value: number): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 2,
	}).format(value);
}
