import { useEffect, useState } from "react";
import type { DashboardResponse } from "@molq/shared";
import {
	Activity,
	ArrowDownToLine,
	ArrowUpFromLine,
	CheckCircle2,
	ExternalLink,
	LayoutDashboard,
	RefreshCw,
	ShieldCheck,
	Unplug,
	Wallet,
	WalletCards,
} from "lucide-react";
import { BrowserRouter, NavLink, Navigate, Route, Routes } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExecutionTable } from "@/features/vault/ExecutionTable";
import { VaultSummary } from "@/features/vault/VaultSummary";
import { Sidebar } from "@/layouts/sidebar";
import { getDashboard } from "@/molq/api";
import { MOLQ_VAULT } from "@/molq/contracts";
import { useMolqVault } from "@/molq/use-molq-vault";

export default function App() {
	return (
		<BrowserRouter>
			<MolqApp />
		</BrowserRouter>
	);
}

function MolqApp() {
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
	const walletBalance = Number(vault.formatUsde(vault.walletBalance));
	const shieldPercent = total > 0 ? (shield / total) * 100 : 85;
	const liquidPercent = total > 0 ? (liquid / total) * 100 : 15;

	async function loadDashboard() {
		setRefreshing(true);
		setApiError(null);
		try {
			const [nextDashboard] = await Promise.all([getDashboard(), vault.refresh()]);
			setDashboard(nextDashboard);
		} catch (caught) {
			setApiError(normalizeApiError(caught));
		} finally {
			setRefreshing(false);
		}
	}

	const shared = {
		vault,
		dashboard,
		total,
		shield,
		liquid,
		position,
		walletBalance,
		shieldPercent,
		liquidPercent,
		amount,
		setAmount,
	};

	return (
		<div className="dark min-h-screen bg-background text-foreground">
			<div className="mx-auto flex min-h-screen max-w-[1680px]">
				<Sidebar />

				<div className="min-w-0 flex-1">
					<header className="sticky top-0 z-20 border-b border-border-edge bg-background/95 backdrop-blur-xl">
						<div className="flex h-20 items-center justify-between px-4 sm:px-8">
							<MobileNavigation />
							<div className="hidden items-center gap-2 text-xs text-label-secondary lg:flex">
								<img
									src="/images/mantle.svg"
									alt=""
									className="h-4 w-4 rounded-full"
								/>
								Mantle mainnet
							</div>
							<WalletControl vault={vault} />
						</div>
					</header>

					<main className="px-4 py-8 sm:px-8 lg:py-10">
						{apiError || vault.error ? (
							<div className="mb-6 rounded-lg border border-negative/30 bg-negative-secondary px-4 py-3 text-sm text-negative">
								{vault.error ?? apiError}
							</div>
						) : null}

						{vault.transactionHash ? (
							<a
								href={`https://mantlescan.xyz/tx/${vault.transactionHash}`}
								target="_blank"
								rel="noreferrer"
								className="mb-6 flex items-center justify-between rounded-lg border border-positive/20 bg-positive-secondary px-4 py-3 text-sm text-positive"
							>
								<span className="flex items-center gap-2">
									<CheckCircle2 className="h-4 w-4" />
									Transaction confirmed: {shorten(vault.transactionHash)}
								</span>
								<ExternalLink className="h-4 w-4" />
							</a>
						) : null}

						<Routes>
							<Route
								path="/"
								element={
									<DashboardPage
										{...shared}
										refreshing={refreshing}
										refresh={loadDashboard}
									/>
								}
							/>
							<Route path="/deposit" element={<DepositPage {...shared} />} />
							<Route
								path="/execution"
								element={<ExecutionPage dashboard={dashboard} />}
							/>
							<Route path="*" element={<Navigate to="/" replace />} />
						</Routes>
					</main>
				</div>
			</div>
		</div>
	);
}

type SharedPageProps = {
	vault: ReturnType<typeof useMolqVault>;
	dashboard: DashboardResponse | null;
	total: number;
	shield: number;
	liquid: number;
	position: number;
	walletBalance: number;
	shieldPercent: number;
	liquidPercent: number;
	amount: string;
	setAmount: (amount: string) => void;
};

function DashboardPage({
	vault,
	dashboard,
	total,
	shield,
	liquid,
	position,
	shieldPercent,
	liquidPercent,
	refreshing,
	refresh,
}: SharedPageProps & { refreshing: boolean; refresh: () => Promise<void> }) {
	return (
		<div className="space-y-8">
			<PageHeading
				eyebrow="USDe yield vault"
				title="Dashboard"
				description="Live vault capital, yield inputs, and execution readiness."
				action={
					<Button
						variant="outline"
						size="sm"
						disabled={refreshing || vault.isBusy}
						onClick={() => void refresh()}
						className="border-border-quaternary bg-fill-quaternary hover:bg-fill-accent-secondary hover:text-label-accent"
					>
						<RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
						Refresh
					</Button>
				}
			/>

			<VaultSummary
				total={total}
				position={position}
				connected={vault.isConnected}
				supplyApy={dashboard?.shieldMarket?.estimatedSupplyApy ?? 0}
				hedgeConfigured={dashboard?.hedgeExecution?.configured ?? false}
				hedgeEnabled={dashboard?.hedgeExecution?.tradingEnabled ?? false}
			/>

			<div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
				<AllocationPanel
					dashboard={dashboard}
					shield={shield}
					liquid={liquid}
					shieldPercent={shieldPercent}
					liquidPercent={liquidPercent}
				/>
				<div className="rounded-xl border border-border-edge bg-card px-6 py-6">
					<div className="text-sm text-label-secondary">Primary action</div>
					<h2 className="mt-2 text-2xl font-bold">Put USDe to work</h2>
					<p className="mt-3 text-sm leading-6 text-label-secondary">
						Receive mqUSDe shares while MolQ routes 85% into Aave V3.
					</p>
					<Button
						asChild
						className="mt-8 w-full rounded-lg bg-fill-accent-primary text-label-on-light"
					>
						<NavLink to="/deposit">
							<ArrowDownToLine className="mr-2 h-4 w-4" />
							Open deposit
						</NavLink>
					</Button>
					<NavLink
						to="/execution"
						className="mt-3 flex h-12 items-center justify-center rounded-lg border border-border-quaternary bg-fill-quaternary text-sm font-semibold"
					>
						View execution
					</NavLink>
				</div>
			</div>
		</div>
	);
}

function DepositPage({
	vault,
	dashboard,
	shield,
	liquid,
	walletBalance,
	shieldPercent,
	liquidPercent,
	amount,
	setAmount,
}: SharedPageProps) {
	return (
		<div className="space-y-8">
			<PageHeading
				eyebrow="Manage mqUSDe"
				title="Deposit"
				description="Deposit USDe into the verified vault or redeem your full position."
			/>

			<div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
				<AllocationPanel
					dashboard={dashboard}
					shield={shield}
					liquid={liquid}
					shieldPercent={shieldPercent}
					liquidPercent={liquidPercent}
				/>
				<div className="rounded-xl border border-border-edge bg-card px-5 py-6 sm:px-6">
					<div className="flex items-center gap-3">
						<img
							src="/images/usde.png"
							alt="USDe"
							className="h-10 w-10 object-contain"
						/>
						<div>
							<h2 className="text-2xl font-bold">Your position</h2>
							<p className="mt-1 text-sm text-label-secondary">
								{vault.isConnected
									? `${number(walletBalance)} USDe available`
									: "Connect a wallet on Mantle to continue."}
							</p>
						</div>
					</div>

					<div className="mt-6">
						<label
							htmlFor="amount"
							className="mb-2 block text-xs font-semibold text-label-secondary"
						>
							Deposit amount
						</label>
						<div className="relative">
							<Input
								id="amount"
								inputMode="decimal"
								value={amount}
								onChange={(event) => setAmount(event.target.value)}
								placeholder="0.00"
								className="h-14 rounded-lg border-border-quaternary bg-fill-quaternary pr-20 text-lg font-bold"
							/>
							<button
								type="button"
								onClick={() => setAmount(String(walletBalance))}
								className="absolute right-3 top-4 text-xs font-semibold text-label-accent"
							>
								MAX
							</button>
						</div>
					</div>

					<div className="mt-4 space-y-3">
						<Button
							className="w-full rounded-lg bg-fill-accent-primary font-bold text-label-on-light hover:bg-fill-accent-hover"
							disabled={vault.isBusy || vault.isWrongChain}
							onClick={() => void vault.deposit(amount)}
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
							className="w-full rounded-lg border-border-quaternary bg-fill-quaternary"
							disabled={vault.isBusy || vault.shareBalance === 0n}
							onClick={() => void vault.withdrawAll()}
						>
							<ArrowUpFromLine className="mr-2 h-4 w-4" />
							{vault.pendingAction === "withdraw"
								? "Withdrawing..."
								: "Withdraw full position"}
						</Button>
					</div>

					<div className="mt-6 border-t border-border-edge pt-4">
						<a
							href={`https://mantlescan.xyz/address/${MOLQ_VAULT}`}
							target="_blank"
							rel="noreferrer"
							className="flex items-center justify-between text-xs text-label-secondary hover:text-label-accent"
						>
							<span>Verified vault</span>
							<span className="flex items-center gap-2 font-mono">
								{shorten(MOLQ_VAULT)}
								<ExternalLink className="h-3.5 w-3.5" />
							</span>
						</a>
					</div>
				</div>
			</div>
		</div>
	);
}

function ExecutionPage({ dashboard }: { dashboard: DashboardResponse | null }) {
	return (
		<div className="space-y-8">
			<PageHeading
				eyebrow="Protocol routing"
				title="Execution"
				description="Live Aave reserve data and Bybit hedge operator status."
			/>
			<ExecutionTable dashboard={dashboard} />
		</div>
	);
}

function AllocationPanel({
	dashboard,
	shield,
	liquid,
	shieldPercent,
	liquidPercent,
}: {
	dashboard: DashboardResponse | null;
	shield: number;
	liquid: number;
	shieldPercent: number;
	liquidPercent: number;
}) {
	return (
		<div className="rounded-xl border border-border-edge bg-card px-5 py-6 sm:px-6">
			<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
				<div>
					<h2 className="text-2xl font-bold">Capital allocation</h2>
					<p className="mt-1 text-sm text-label-secondary">
						Live balances held by the verified ERC-4626 vault.
					</p>
				</div>
				<div className="rounded-full bg-fill-accent-secondary px-3 py-2 text-xs font-semibold text-label-accent">
					85 / 15 target
				</div>
			</div>

			<div className="mt-8 grid gap-8 lg:grid-cols-2">
				<Allocation
					label="Shield"
					amount={shield}
					percent={shieldPercent}
					description="Aave V3 USDe supply"
					color="bg-fill-accent-primary"
				/>
				<Allocation
					label="Liquid"
					amount={liquid}
					percent={liquidPercent}
					description="Available Alpha capital"
					color="bg-orange"
				/>
			</div>

			<div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-border-edge sm:grid-cols-4">
				<Detail label="Share token" value="mqUSDe" />
				<Detail
					label="Funding APY"
					value={`${dashboard?.alphaMarket?.estimatedFundingApy.toFixed(2) ?? "0.00"}%`}
				/>
				<Detail
					label="ETH mark"
					value={
						dashboard?.alphaMarket?.markPrice
							? money(dashboard.alphaMarket.markPrice)
							: "--"
					}
				/>
				<Detail
					label="Risk state"
					value={dashboard?.shieldMarket?.status === "live" ? "Normal" : "Fallback"}
				/>
			</div>
		</div>
	);
}

function PageHeading({
	eyebrow,
	title,
	description,
	action,
}: {
	eyebrow: string;
	title: string;
	description: string;
	action?: React.ReactNode;
}) {
	return (
		<section className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
			<div>
				<div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase text-label-accent">
					<ShieldCheck className="h-4 w-4" />
					{eyebrow}
				</div>
				<h1 className="text-4xl font-bold sm:text-5xl">{title}</h1>
				<p className="mt-3 max-w-2xl text-sm leading-6 text-label-secondary">
					{description}
				</p>
			</div>
			{action}
		</section>
	);
}

function MobileNavigation() {
	const items = [
		{ to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
		{ to: "/deposit", label: "Deposit", icon: WalletCards },
		{ to: "/execution", label: "Execution", icon: Activity },
	];
	return (
		<nav className="flex items-center gap-1 lg:hidden">
			{items.map(({ to, label, icon: Icon, end }) => (
				<NavLink
					key={to}
					to={to}
					end={end}
					title={label}
					aria-label={label}
					className={({ isActive }) =>
						`flex h-9 w-9 items-center justify-center rounded-lg ${
							isActive
								? "bg-fill-accent-secondary text-label-accent"
								: "text-label-secondary"
						}`
					}
				>
					<Icon className="h-4 w-4" />
				</NavLink>
			))}
		</nav>
	);
}

function WalletControl({ vault }: { vault: ReturnType<typeof useMolqVault> }) {
	if (vault.isWrongChain) {
		return (
			<Button
				size="sm"
				disabled={vault.isBusy}
				onClick={() => void vault.switchToMantle()}
				className="rounded-lg bg-fill-accent-primary text-label-on-light"
			>
				Switch to Mantle
			</Button>
		);
	}
	if (!vault.isConnected) {
		return (
			<Button
				size="sm"
				disabled={vault.isBusy}
				onClick={() => void vault.connect()}
				className="rounded-lg bg-fill-accent-primary font-bold text-label-on-light hover:bg-fill-accent-hover"
			>
				<Wallet className="mr-2 h-4 w-4" />
				Connect wallet
			</Button>
		);
	}
	return (
		<div className="flex items-center gap-2 rounded-lg border border-border-edge bg-card p-1 pl-3">
			<div className="font-mono text-xs text-label-secondary">
				{shorten(vault.address ?? "")}
			</div>
			<Button
				variant="ghost"
				size="iconxs"
				title="Disconnect wallet"
				aria-label="Disconnect wallet"
				className="rounded-md hover:bg-fill-quaternary"
				onClick={() => vault.disconnect()}
			>
				<Unplug className="h-3.5 w-3.5" />
			</Button>
		</div>
	);
}

function Allocation({
	label,
	amount,
	percent,
	description,
	color,
}: {
	label: string;
	amount: number;
	percent: number;
	description: string;
	color: string;
}) {
	return (
		<div>
			<div className="flex items-end justify-between gap-4">
				<div>
					<div className="text-sm text-label-secondary">{label}</div>
					<div className="mt-2 text-2xl font-bold">{money(amount)}</div>
				</div>
				<div className="font-mono text-sm">{percent.toFixed(1)}%</div>
			</div>
			<div className="mt-4 h-2 overflow-hidden rounded-full bg-fill-quaternary">
				<div
					className={`h-full rounded-full ${color}`}
					style={{ width: `${Math.min(percent, 100)}%` }}
				/>
			</div>
			<div className="mt-3 text-xs text-label-tertiary">{description}</div>
		</div>
	);
}

function Detail({ label, value }: { label: string; value: string }) {
	return (
		<div className="bg-fill-quaternary px-4 py-4">
			<div className="text-xs text-label-tertiary">{label}</div>
			<div className="mt-2 truncate text-sm font-bold">{value}</div>
		</div>
	);
}

function normalizeApiError(error: unknown): string {
	if (!(error instanceof Error)) return "The MolQ API is unavailable.";
	if (error.message.includes("rate limit") || error.message.includes("RPC Request failed")) {
		return "Mantle RPC is temporarily rate limited. Refresh in a moment.";
	}
	return error.message;
}

function money(value: number): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 2,
	}).format(Number.isFinite(value) ? value : 0);
}

function number(value: number): string {
	return new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 }).format(value);
}

function shorten(value: string): string {
	return value.length > 12 ? `${value.slice(0, 6)}...${value.slice(-4)}` : value;
}
