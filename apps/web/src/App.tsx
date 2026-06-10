import { useEffect, useState } from "react";
import type { DashboardResponse } from "@molq/shared";
import {
	Activity,
	ArrowDownToLine,
	ArrowUpFromLine,
	BadgePlus,
	Bot,
	CheckCircle2,
	CircleDollarSign,
	Clock3,
	ExternalLink,
	Fingerprint,
	LayoutDashboard,
	RefreshCw,
	ShieldCheck,
	TrendingUp,
	Unplug,
	Wallet,
	WalletCards,
} from "lucide-react";
import { BrowserRouter, NavLink, Navigate, Route, Routes } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExecutionTable } from "@/features/vault/ExecutionTable";
import { GetUsdeDialog } from "@/features/vault/GetUsdeDialog";
import { TransactionStepperDialog } from "@/features/vault/TransactionStepperDialog";
import { VaultSummary } from "@/features/vault/VaultSummary";
import { Sidebar } from "@/layouts/sidebar";
import { getAgentStatus, getDashboard, type AgentStatusResponse } from "@/molq/api";
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
	const [agentStatus, setAgentStatus] = useState<AgentStatusResponse | null>(null);
	const [getUsdeOpen, setGetUsdeOpen] = useState(false);

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
			const [nextDashboard, nextAgentStatus] = await Promise.all([
				getDashboard(),
				getAgentStatus(),
				vault.refresh(),
			]);
			setDashboard(nextDashboard);
			setAgentStatus(nextAgentStatus);
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
			<TransactionStepperDialog
				flow={vault.transactionFlow ?? null}
				busy={vault.pendingAction !== null}
				error={vault.error}
				onClose={vault.closeTransactionFlow}
			/>
			<GetUsdeDialog open={getUsdeOpen} onClose={() => setGetUsdeOpen(false)} />
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
							<div className="flex min-w-0 items-center gap-2">
								<UsdeBalanceBadge
									balance={walletBalance}
									connected={vault.isConnected}
								/>
								<Button
									size="sm"
									variant="outline"
									onClick={() => setGetUsdeOpen(true)}
									className="rounded-lg border-border-quaternary bg-fill-quaternary px-3 font-bold hover:bg-fill-accent-secondary hover:text-label-accent"
								>
									<BadgePlus className="h-4 w-4 sm:mr-2" />
									<span className="hidden sm:inline">Get USDe</span>
								</Button>
								<WalletControl vault={vault} />
							</div>
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
								path="/performance"
								element={
									<PerformancePage dashboard={dashboard} status={agentStatus} />
								}
							/>
							<Route
								path="/execution"
								element={<ExecutionPage dashboard={dashboard} />}
							/>
							<Route
								path="/agent"
								element={<AgentPage status={agentStatus} dashboard={dashboard} />}
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

function PerformancePage({
	dashboard,
	status,
}: {
	dashboard: DashboardResponse | null;
	status: AgentStatusResponse | null;
}) {
	const history = status?.history ?? [];
	const successful = history.filter((report) => report.errors.length === 0).length;
	const modelDecisions = history.filter((report) => report.decision.source === "model").length;
	const rejectedCarry =
		(dashboard?.market.targetNetApy ?? 0) < (dashboard?.market.estimatedNetApy ?? 0);

	return (
		<div className="space-y-8">
			<PageHeading
				eyebrow="Verifiable strategy evidence"
				title="Performance"
				description="Active exposure, benchmark comparisons, and autonomous decision outcomes from the live Mantle deployment."
			/>

			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<PerformanceMetric
					label="Active projected APY"
					value={`${dashboard?.market.estimatedNetApy.toFixed(2) ?? "0.00"}%`}
					detail="Only currently deployed exposure"
					positive={(dashboard?.market.estimatedNetApy ?? 0) >= 0}
				/>
				<PerformanceMetric
					label="Aave reserve APY"
					value={`${dashboard?.market.mantleYieldApy.toFixed(2) ?? "0.00"}%`}
					detail="Unweighted USDe benchmark"
					positive
				/>
				<PerformanceMetric
					label="Target scenario APY"
					value={`${dashboard?.market.targetNetApy.toFixed(2) ?? "0.00"}%`}
					detail={rejectedCarry ? "Rejected by carry policy" : "Eligible opportunity"}
					positive={!rejectedCarry}
				/>
				<PerformanceMetric
					label="Active hedge"
					value={`${dashboard?.market.hedgeRatio.toFixed(0) ?? "0"}%`}
					detail={`${money(dashboard?.hedgeExecution?.currentShortNotionalUsd ?? 0)} short notional`}
					positive={(dashboard?.market.hedgeRatio ?? 0) > 0}
				/>
			</div>

			<div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
				<section className="rounded-lg border border-border-edge bg-card">
					<div className="border-b border-border-edge px-5 py-5 sm:px-6">
						<h2 className="text-xl font-bold">Live return composition</h2>
						<p className="mt-1 text-sm text-label-secondary">
							Projected annualized contribution from actual deployed exposure.
						</p>
					</div>
					<div className="grid gap-px bg-border-edge sm:grid-cols-3">
						<CompositionCell
							label="Aave shield"
							value={`${dashboard?.market.shieldContributionApy.toFixed(2) ?? "0.00"}%`}
							detail={`${dashboard?.portfolio.allocation.shieldPercent.toFixed(1) ?? "0.0"}% of TVL`}
						/>
						<CompositionCell
							label="Bybit hedge"
							value={`${dashboard?.market.hedgeContributionApy.toFixed(2) ?? "0.00"}%`}
							detail={
								dashboard?.market.hedgeRatio
									? "Funding contribution active"
									: "No short position open"
							}
						/>
						<CompositionCell
							label="Realized profit"
							value={money(dashboard?.portfolio.realizedProfit ?? 0)}
							detail="Excludes projected yield"
						/>
					</div>
					<div className="px-5 py-5 sm:px-6">
						<div
							className={`flex gap-3 border p-4 ${
								rejectedCarry
									? "border-positive/20 bg-positive-secondary text-positive"
									: "border-border-quaternary bg-fill-quaternary"
							}`}
						>
							<ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
							<p className="text-sm leading-6">
								{rejectedCarry
									? "MolQ is preserving positive Aave carry and keeping the hedge flat because current short funding would reduce expected return."
									: "Current funding meets the strategy threshold; hedge execution remains bounded by liquid capital and operator limits."}
							</p>
						</div>
					</div>
				</section>

				<section className="rounded-lg border border-border-edge bg-card px-5 py-6 sm:px-6">
					<h2 className="text-xl font-bold">Agent scorecard</h2>
					<p className="mt-1 text-sm text-label-secondary">
						Runtime history since the latest API restart.
					</p>
					<div className="mt-6 space-y-4">
						<FeeRow label="Observed cycles" value={String(history.length)} />
						<FeeRow label="Model decisions" value={String(modelDecisions)} />
						<FeeRow
							label="Successful cycles"
							value={
								history.length
									? `${Math.round((successful / history.length) * 100)}%`
									: "--"
							}
						/>
						<FeeRow
							label="On-chain logger"
							value={status?.logger?.authorized ? "Authorized" : "Unavailable"}
						/>
					</div>
					<NavLink
						to="/agent"
						className="mt-6 flex h-11 items-center justify-center border border-border-quaternary bg-fill-quaternary text-sm font-semibold hover:text-label-accent"
					>
						Inspect decision proof
					</NavLink>
				</section>
			</div>
		</div>
	);
}

function AgentPage({
	status,
	dashboard,
}: {
	status: AgentStatusResponse | null;
	dashboard: DashboardResponse | null;
}) {
	const lastRun = status?.lastRun;
	const identity = status?.identity;
	const loggerReady = Boolean(status?.logger?.enabled && status.logger.authorized);
	const bybitReady = Boolean(
		dashboard?.hedgeExecution?.configured && dashboard.hedgeExecution.tradingEnabled,
	);

	return (
		<div className="space-y-8">
			<PageHeading
				eyebrow="ERC-8004 autonomous operator"
				title="Agent"
				description="Policy state, identity provenance, and execution evidence for MolQ's constrained yield agent."
			/>

			<div className="grid gap-px overflow-hidden rounded-lg border border-border-edge bg-border-edge sm:grid-cols-2 xl:grid-cols-4">
				<AgentMetric
					icon={Bot}
					label="OpenAI policy"
					value={status?.modelConfigured ? "Connected" : "Fallback"}
					detail={
						status?.modelConfigured ? "Model proposals enabled" : "Deterministic policy"
					}
					ready={status?.modelConfigured ?? false}
				/>
				<AgentMetric
					icon={Fingerprint}
					label="ERC-8004 identity"
					value={identity ? `Agent #${identity.agentId}` : "Loading"}
					detail={identity?.registered ? "Registered on Mantle" : "Registry check"}
					ready={Boolean(identity?.registered)}
				/>
				<AgentMetric
					icon={ShieldCheck}
					label="Decision logger"
					value={loggerReady ? "Authorized" : "Disarmed"}
					detail={status?.logger?.message ?? "Checking signer"}
					ready={loggerReady}
				/>
				<AgentMetric
					icon={Activity}
					label="Bybit executor"
					value={bybitReady ? "Armed" : "Read only"}
					detail={dashboard?.hedgeExecution?.message ?? "Checking venue"}
					ready={bybitReady}
				/>
			</div>

			<div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
				<section className="rounded-lg border border-border-edge bg-card">
					<div className="flex items-start justify-between gap-4 border-b border-border-edge px-5 py-5 sm:px-6">
						<div>
							<h2 className="text-xl font-bold">Latest policy cycle</h2>
							<p className="mt-1 text-sm text-label-secondary">
								Model proposal after deterministic capital constraints.
							</p>
						</div>
						<div className="flex items-center gap-2 text-xs text-label-secondary">
							<Clock3 className="h-4 w-4" />
							{lastRun ? timeAgo(lastRun.completedAt) : "No cycle yet"}
						</div>
					</div>

					{lastRun ? (
						<div className="px-5 py-6 sm:px-6">
							<div className="flex flex-wrap items-center gap-3">
								<span className="rounded-md bg-fill-accent-secondary px-3 py-1.5 text-xs font-bold uppercase text-label-accent">
									{lastRun.decision.action.replaceAll("_", " ")}
								</span>
								<span className="text-xs text-label-secondary">
									{Math.round(lastRun.decision.confidence * 100)}% confidence
								</span>
								<span className="text-xs text-label-secondary">
									Risk {lastRun.decision.riskScore}/100
								</span>
							</div>
							<p className="mt-5 max-w-3xl text-base leading-7">
								{lastRun.decision.reason}
							</p>
							<div className="mt-6 grid gap-3 sm:grid-cols-2">
								<DecisionDetail
									label="Target hedge"
									value={money(lastRun.decision.targetHedgeNotionalUsd)}
								/>
								<DecisionDetail
									label="Decision source"
									value={lastRun.decision.model ?? lastRun.decision.source}
								/>
							</div>
							{lastRun.decisionTransactionHash ? (
								<a
									href={`https://mantlescan.xyz/tx/${lastRun.decisionTransactionHash}`}
									target="_blank"
									rel="noreferrer"
									className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-label-accent"
								>
									Verify decision
									<ExternalLink className="h-3.5 w-3.5" />
								</a>
							) : null}
						</div>
					) : (
						<div className="px-5 py-12 text-center sm:px-6">
							<Bot className="mx-auto h-8 w-8 text-label-tertiary" />
							<div className="mt-4 text-sm font-bold">Waiting for first cycle</div>
							<p className="mt-2 text-xs text-label-secondary">
								The operator API starts cycles; public users cannot trigger capital
								actions.
							</p>
						</div>
					)}
				</section>

				<section className="rounded-lg border border-border-edge bg-card px-5 py-6 sm:px-6">
					<div className="flex items-center gap-3">
						<CircleDollarSign className="h-5 w-5 text-label-accent" />
						<h2 className="text-xl font-bold">Business model</h2>
					</div>
					<div className="mt-7 text-5xl font-bold">10%</div>
					<div className="mt-2 text-sm text-label-secondary">
						of externally realized profit
					</div>
					<div className="mt-7 space-y-4 border-t border-border-edge pt-5 text-sm">
						<FeeRow label="Deposit fee" value="0%" />
						<FeeRow label="Withdrawal fee" value="0%" />
						<FeeRow label="Performance fee" value="10%" />
						<FeeRow label="Maximum on-chain" value="20%" />
					</div>
					<p className="mt-6 text-xs leading-5 text-label-tertiary">
						The fee is transferred only when realized Alpha profit is hardened back into
						the USDe vault. Principal is never used to calculate the fee.
					</p>
				</section>
			</div>

			{identity ? (
				<section className="flex flex-col justify-between gap-4 rounded-lg border border-border-edge bg-fill-quaternary px-5 py-5 sm:flex-row sm:items-center">
					<div>
						<div className="text-xs text-label-tertiary">Identity owner</div>
						<div className="mt-1 break-all font-mono text-xs">{identity.owner}</div>
					</div>
					<a
						href={`https://mantlescan.xyz/token/${identity.registry}?a=${identity.agentId}`}
						target="_blank"
						rel="noreferrer"
						className="inline-flex items-center gap-2 text-xs font-semibold text-label-accent"
					>
						Open ERC-8004 identity
						<ExternalLink className="h-3.5 w-3.5" />
					</a>
				</section>
			) : null}

			{status?.history?.length ? (
				<section className="rounded-lg border border-border-edge bg-card">
					<div className="border-b border-border-edge px-5 py-5 sm:px-6">
						<h2 className="text-xl font-bold">Recent execution evidence</h2>
						<p className="mt-1 text-sm text-label-secondary">
							Model outcomes, safety intervention, and immutable decision links.
						</p>
					</div>
					<div className="divide-y divide-border-edge">
						{status.history.slice(0, 8).map((report) => (
							<div
								key={report.decision.id}
								className="grid gap-4 px-5 py-5 sm:px-6 lg:grid-cols-[130px_1fr_130px]"
							>
								<div>
									<span className="inline-flex bg-fill-accent-secondary px-2 py-1 text-[10px] font-bold uppercase text-label-accent">
										{report.decision.action.replaceAll("_", " ")}
									</span>
									<div className="mt-2 text-xs text-label-tertiary">
										{timeAgo(report.completedAt)}
									</div>
								</div>
								<div>
									<p className="text-sm leading-6">{report.decision.reason}</p>
									{report.decision.safetyChecks.length ? (
										<p className="mt-2 text-xs text-orange">
											Policy: {report.decision.safetyChecks.join(" ")}
										</p>
									) : null}
									{report.errors.length ? (
										<p className="mt-2 text-xs text-negative">
											Execution: {report.errors.join(" ")}
										</p>
									) : null}
								</div>
								<div className="lg:text-right">
									<div className="text-xs text-label-secondary">
										Risk {report.decision.riskScore}/100
									</div>
									{report.decisionTransactionHash ? (
										<a
											href={`https://mantlescan.xyz/tx/${report.decisionTransactionHash}`}
											target="_blank"
											rel="noreferrer"
											className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-label-accent"
										>
											Verify
											<ExternalLink className="h-3 w-3" />
										</a>
									) : null}
								</div>
							</div>
						))}
					</div>
				</section>
			) : null}
		</div>
	);
}

function PerformanceMetric({
	label,
	value,
	detail,
	positive,
}: {
	label: string;
	value: string;
	detail: string;
	positive: boolean;
}) {
	return (
		<div className="rounded-lg border border-border-edge bg-card px-5 py-5">
			<div className="text-xs text-label-secondary">{label}</div>
			<div className="mt-3 flex items-center gap-2">
				<div className="font-mono text-2xl font-bold">{value}</div>
				<span
					className={`h-2 w-2 rounded-full ${positive ? "bg-positive" : "bg-orange"}`}
				/>
			</div>
			<div className="mt-2 text-xs text-label-tertiary">{detail}</div>
		</div>
	);
}

function CompositionCell({
	label,
	value,
	detail,
}: {
	label: string;
	value: string;
	detail: string;
}) {
	return (
		<div className="bg-card px-5 py-5">
			<div className="text-xs text-label-secondary">{label}</div>
			<div className="mt-2 font-mono text-xl font-bold">{value}</div>
			<div className="mt-2 text-xs text-label-tertiary">{detail}</div>
		</div>
	);
}

function AgentMetric({
	icon: Icon,
	label,
	value,
	detail,
	ready,
}: {
	icon: typeof Bot;
	label: string;
	value: string;
	detail: string;
	ready: boolean;
}) {
	return (
		<div className="min-w-0 bg-card px-5 py-5">
			<div className="flex items-center justify-between">
				<Icon className="h-4 w-4 text-label-secondary" />
				<span className={`h-2 w-2 rounded-full ${ready ? "bg-positive" : "bg-orange"}`} />
			</div>
			<div className="mt-5 text-xs text-label-tertiary">{label}</div>
			<div className="mt-1 text-lg font-bold">{value}</div>
			<div className="mt-2 truncate text-xs text-label-secondary" title={detail}>
				{detail}
			</div>
		</div>
	);
}

function DecisionDetail({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-lg bg-fill-quaternary px-4 py-4">
			<div className="text-xs text-label-tertiary">{label}</div>
			<div className="mt-2 truncate text-sm font-bold">{value}</div>
		</div>
	);
}

function FeeRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-center justify-between">
			<span className="text-label-secondary">{label}</span>
			<span className="font-mono font-bold">{value}</span>
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
					label="Short funding carry"
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
		{ to: "/performance", label: "Performance", icon: TrendingUp },
		{ to: "/execution", label: "Execution", icon: Activity },
		{ to: "/agent", label: "Agent", icon: Bot },
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

function UsdeBalanceBadge({ balance, connected }: { balance: number; connected: boolean }) {
	return (
		<div
			className="flex h-9 items-center gap-2 border border-border-edge bg-card px-2.5"
			title={
				connected ? `${number(balance)} USDe in wallet` : "Connect wallet to view balance"
			}
		>
			<img src="/images/usde.png" alt="USDe" className="h-5 w-5 object-contain" />
			<span className="font-mono text-xs font-bold">
				{connected ? number(balance) : "--"}
			</span>
			<span className="hidden text-[10px] font-semibold text-label-secondary xl:inline">
				USDe
			</span>
		</div>
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

function timeAgo(value: string): string {
	const elapsed = Date.now() - new Date(value).getTime();
	if (elapsed < 60_000) return "just now";
	if (elapsed < 3_600_000) return `${Math.floor(elapsed / 60_000)}m ago`;
	return `${Math.floor(elapsed / 3_600_000)}h ago`;
}
