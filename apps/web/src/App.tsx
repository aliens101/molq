import { useEffect, useMemo, useState } from "react";
import type { DashboardResponse } from "@molq/shared";
import {
	Activity,
	ArrowDownToLine,
	ArrowUpFromLine,
	CircleDollarSign,
	ExternalLink,
	RefreshCw,
	ShieldCheck,
	TrendingUp,
	Unplug,
	Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getDashboard } from "@/molq/api";
import { AAVE_USDE, MOLQ_VAULT } from "@/molq/contracts";
import { useMolqVault } from "@/molq/use-molq-vault";

export default function App() {
	const vault = useMolqVault();
	const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
	const [amount, setAmount] = useState("");
	const [apiError, setApiError] = useState<string | null>(null);
	const [refreshing, setRefreshing] = useState(false);

	useEffect(() => {
		void loadDashboard();
	}, []);

	const total = Number(vault.formatUsde(vault.totalAssets));
	const shield = Number(vault.formatUsde(vault.shieldAssets));
	const liquid = Number(vault.formatUsde(vault.liquidAssets));
	const position = Number(vault.formatUsde(vault.userAssets));
	const shieldPercent = total > 0 ? (shield / total) * 100 : 85;
	const alphaPercent = total > 0 ? (liquid / total) * 100 : 15;

	const stats = useMemo(
		() => [
			{
				label: "Vault TVL",
				value: money(total),
				sub: "Verified on Mantle",
				icon: CircleDollarSign,
			},
			{
				label: "Your position",
				value: vault.isConnected ? money(position) : "--",
				sub: vault.isConnected
					? `${compact(Number(vault.formatUsde(vault.shareBalance)))} mqUSDe`
					: "Connect wallet",
				icon: Wallet,
			},
			{
				label: "Aave supply APY",
				value: `${dashboard?.shieldMarket?.estimatedSupplyApy.toFixed(2) ?? "0.00"}%`,
				sub: "Live USDe reserve",
				icon: ShieldCheck,
			},
			{
				label: "Hedge execution",
				value: dashboard?.hedgeExecution?.configured ? "Configured" : "Offline",
				sub: dashboard?.hedgeExecution?.tradingEnabled ? "Trading enabled" : "Read only",
				icon: Activity,
			},
		],
		[dashboard, position, total, vault],
	);

	async function loadDashboard() {
		setRefreshing(true);
		setApiError(null);
		try {
			const [nextDashboard] = await Promise.all([getDashboard(), vault.refresh()]);
			setDashboard(nextDashboard);
		} catch (caught) {
			setApiError(caught instanceof Error ? caught.message : "The MolQ API is unavailable.");
		} finally {
			setRefreshing(false);
		}
	}

	async function submitDeposit() {
		await vault.deposit(amount);
	}

	return (
		<div className="min-h-screen bg-zinc-950 text-zinc-100">
			<header className="border-b border-zinc-800">
				<div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
					<div className="flex items-center gap-3">
						<div className="flex h-9 w-9 items-center justify-center bg-emerald-400 text-sm font-bold text-zinc-950">
							MQ
						</div>
						<div>
							<div className="font-semibold">MolQ</div>
							<div className="text-xs text-zinc-500">USDe yield vault on Mantle</div>
						</div>
					</div>
					<WalletControl vault={vault} />
				</div>
			</header>

			<main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
				<section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
					<div>
						<h1 className="text-3xl font-semibold">Vault</h1>
						<p className="mt-2 max-w-2xl text-sm text-zinc-400">
							USDe is issued as mqUSDe shares. The Shield sleeve supplies to Aave V3;
							the liquid sleeve remains available for delta-neutral execution.
						</p>
					</div>
					<Button
						variant="outline"
						size="sm"
						disabled={refreshing || vault.isBusy}
						onClick={() => void loadDashboard()}
					>
						<RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
						Refresh
					</Button>
				</section>

				{apiError || vault.error ? (
					<div className="border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-200">
						{vault.error ?? apiError}
					</div>
				) : null}

				{vault.transactionHash ? (
					<a
						href={`https://mantlescan.xyz/tx/${vault.transactionHash}`}
						target="_blank"
						rel="noreferrer"
						className="flex items-center justify-between border border-emerald-900 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-300"
					>
						<span>Latest transaction: {shorten(vault.transactionHash)}</span>
						<ExternalLink className="h-4 w-4" />
					</a>
				) : null}

				<section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
					{stats.map(({ label, value, sub, icon: Icon }) => (
						<Card key={label} className="rounded-md border-zinc-800 bg-zinc-900">
							<CardContent className="flex items-start justify-between p-5">
								<div className="min-w-0">
									<div className="text-xs text-zinc-500">{label}</div>
									<div className="mt-2 truncate text-2xl font-semibold">{value}</div>
									<div className="mt-1 text-xs text-zinc-500">{sub}</div>
								</div>
								<Icon className="h-5 w-5 shrink-0 text-emerald-400" />
							</CardContent>
						</Card>
					))}
				</section>

				<section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
					<Card className="rounded-md border-zinc-800 bg-zinc-900">
						<CardHeader>
							<CardTitle className="text-lg">Capital allocation</CardTitle>
							<CardDescription>Live balances held by the verified vault.</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<AllocationBar
								label="Shield"
								percent={shieldPercent}
								value={`${money(shield)} supplied to Aave V3`}
								color="bg-emerald-400"
							/>
							<AllocationBar
								label="Liquid"
								percent={alphaPercent}
								value={`${money(liquid)} available for Alpha`}
								color="bg-amber-400"
							/>
							<div className="grid grid-cols-3 gap-3 border-t border-zinc-800 pt-5">
								<Metric label="Target" value="85 / 15" />
								<Metric
									label="Funding APY"
									value={`${dashboard?.alphaMarket?.estimatedFundingApy.toFixed(2) ?? "0.00"}%`}
								/>
								<Metric
									label="ETH mark"
									value={
										dashboard?.alphaMarket?.markPrice
											? money(dashboard.alphaMarket.markPrice)
											: "--"
									}
								/>
							</div>
						</CardContent>
					</Card>

					<Card className="rounded-md border-zinc-800 bg-zinc-900">
						<CardHeader>
							<CardTitle className="text-lg">Manage position</CardTitle>
							<CardDescription>
								{vault.isConnected
									? `${compact(Number(vault.formatUsde(vault.walletBalance)))} USDe available`
									: "Connect a wallet on Mantle to deposit."}
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<label htmlFor="amount" className="mb-2 block text-xs text-zinc-400">
									Deposit amount
								</label>
								<div className="relative">
									<Input
										id="amount"
										inputMode="decimal"
										value={amount}
										onChange={(event) => setAmount(event.target.value)}
										placeholder="0.00"
										className="h-12 rounded-none border-zinc-700 bg-zinc-950 pr-16"
									/>
									<span className="absolute right-3 top-3.5 text-xs text-zinc-500">
										USDe
									</span>
								</div>
							</div>
							<Button
								className="w-full"
								disabled={vault.isBusy || vault.isWrongChain}
								onClick={() => void submitDeposit()}
							>
								<ArrowDownToLine className="mr-2 h-4 w-4" />
								{vault.pendingAction === "deposit"
									? "Confirming on Mantle..."
									: vault.isConnected
										? "Deposit USDe"
										: "Connect wallet"}
							</Button>
							<Button
								variant="outline"
								className="w-full"
								disabled={vault.isBusy || vault.shareBalance === 0n}
								onClick={() => void vault.withdrawAll()}
							>
								<ArrowUpFromLine className="mr-2 h-4 w-4" />
								{vault.pendingAction === "withdraw"
									? "Withdrawing..."
									: "Withdraw full position"}
							</Button>
							<div className="border-t border-zinc-800 pt-4 text-xs text-zinc-500">
								Vault{" "}
								<a
									href={`https://mantlescan.xyz/address/${MOLQ_VAULT}`}
									target="_blank"
									rel="noreferrer"
									className="font-mono text-zinc-300 hover:text-emerald-400"
								>
									{shorten(MOLQ_VAULT)}
								</a>
							</div>
						</CardContent>
					</Card>
				</section>

				<section>
					<div className="mb-3">
						<h2 className="text-lg font-semibold">Execution venues</h2>
						<p className="mt-1 text-xs text-zinc-500">
							Live market data and operational status for each sleeve.
						</p>
					</div>
					<div className="grid border border-zinc-800 bg-zinc-900 lg:grid-cols-2">
						<Venue
							icon={<ShieldCheck className="h-4 w-4 text-emerald-400" />}
							name={dashboard?.shieldMarket?.protocol ?? "Aave V3"}
							description="USDe reserve · Shield lending"
							status={dashboard?.shieldMarket?.status}
							href={`https://mantlescan.xyz/address/${AAVE_USDE}`}
							metrics={[
								["Supply APY", `${dashboard?.shieldMarket?.estimatedSupplyApy.toFixed(2) ?? "0.00"}%`],
								["Liquidity", compactToken(dashboard?.shieldMarket?.availableLiquidity)],
								["Reserve assets", compactToken(dashboard?.shieldMarket?.totalAssets)],
							]}
						/>
						<Venue
							icon={<TrendingUp className="h-4 w-4 text-amber-400" />}
							name="Bybit"
							description="ETHUSDT perpetual · Delta hedge"
							status={dashboard?.alphaMarket?.status}
							metrics={[
								[
									"Short notional",
									money(dashboard?.hedgeExecution?.currentShortNotionalUsd ?? 0),
								],
								[
									"Account equity",
									money(dashboard?.hedgeExecution?.accountEquityUsd ?? 0),
								],
								[
									"Unrealized PnL",
									money(dashboard?.hedgeExecution?.unrealizedPnlUsd ?? 0),
								],
							]}
						/>
					</div>
				</section>
			</main>
		</div>
	);
}

function WalletControl({ vault }: { vault: ReturnType<typeof useMolqVault> }) {
	if (vault.isWrongChain) {
		return (
			<Button size="sm" disabled={vault.isBusy} onClick={() => void vault.switchToMantle()}>
				Switch to Mantle
			</Button>
		);
	}
	if (!vault.isConnected) {
		return (
			<Button size="sm" disabled={vault.isBusy} onClick={() => void vault.connect()}>
				<Wallet className="mr-2 h-4 w-4" />
				Connect wallet
			</Button>
		);
	}
	return (
		<div className="flex items-center gap-2">
			<div className="hidden font-mono text-xs text-zinc-400 sm:block">
				{shorten(vault.address ?? "")}
			</div>
			<Button
				variant="outline"
				size="icon"
				title="Disconnect wallet"
				aria-label="Disconnect wallet"
				onClick={() => vault.disconnect()}
			>
				<Unplug className="h-4 w-4" />
			</Button>
		</div>
	);
}

function AllocationBar({
	label,
	percent,
	value,
	color,
}: {
	label: string;
	percent: number;
	value: string;
	color: string;
}) {
	return (
		<div>
			<div className="mb-2 flex justify-between text-sm">
				<span>{label}</span>
				<span>{percent.toFixed(1)}%</span>
			</div>
			<div className="h-2 bg-zinc-800">
				<div className={`h-full ${color}`} style={{ width: `${Math.min(percent, 100)}%` }} />
			</div>
			<div className="mt-2 text-xs text-zinc-500">{value}</div>
		</div>
	);
}

function Venue({
	icon,
	name,
	description,
	status,
	href,
	metrics,
}: {
	icon: React.ReactNode;
	name: string;
	description: string;
	status?: "live" | "fallback";
	href?: string;
	metrics: Array<[string, string]>;
}) {
	return (
		<div className="border-b border-zinc-800 p-5 last:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0">
			<div className="flex items-start justify-between gap-4">
				<div>
					<div className="flex items-center gap-2">
						{icon}
						<span className="text-sm font-medium">{name}</span>
						<Status status={status} />
					</div>
					<div className="mt-2 text-xs text-zinc-500">{description}</div>
				</div>
				{href ? (
					<a
						href={href}
						target="_blank"
						rel="noreferrer"
						className="text-zinc-500 hover:text-emerald-400"
						aria-label={`Open ${name} on Mantlescan`}
					>
						<ExternalLink className="h-4 w-4" />
					</a>
				) : null}
			</div>
			<div className="mt-5 grid grid-cols-3 gap-3">
				{metrics.map(([label, value]) => (
					<Metric key={label} label={label} value={value} />
				))}
			</div>
		</div>
	);
}

function Metric({ label, value }: { label: string; value: string }) {
	return (
		<div className="min-w-0">
			<div className="text-xs text-zinc-500">{label}</div>
			<div className="mt-1 truncate text-sm font-medium">{value}</div>
		</div>
	);
}

function Status({ status }: { status?: "live" | "fallback" }) {
	const live = status === "live";
	return (
		<span
			className={`border px-1.5 py-0.5 font-mono text-[10px] uppercase ${
				live ? "border-emerald-900 text-emerald-400" : "border-amber-900 text-amber-400"
			}`}
		>
			{live ? "live" : "fallback"}
		</span>
	);
}

function compactToken(value?: string): string {
	const amount = Number(value);
	return Number.isFinite(amount) && amount > 0 ? `${compact(amount)} USDe` : "--";
}

function compact(value: number): string {
	return new Intl.NumberFormat("en-US", {
		notation: "compact",
		maximumFractionDigits: 2,
	}).format(value);
}

function money(value: number): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 2,
	}).format(Number.isFinite(value) ? value : 0);
}

function shorten(value: string): string {
	return value.length > 12 ? `${value.slice(0, 6)}...${value.slice(-4)}` : value;
}
