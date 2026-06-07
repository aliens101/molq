import type { DashboardResponse } from "@molq/shared";
import { ExternalLink, ShieldCheck, TrendingUp } from "lucide-react";
import { AAVE_USDE } from "@/molq/contracts";

export function ExecutionTable({ dashboard }: { dashboard: DashboardResponse | null }) {
	const rows = [
		{
			name: dashboard?.shieldMarket?.protocol ?? "Aave V3",
			market: "USDe supply",
			icon: ShieldCheck,
			token: true,
			accent: "text-label-accent",
			yield: `${dashboard?.shieldMarket?.estimatedSupplyApy.toFixed(2) ?? "0.00"}%`,
			exposure: compactToken(dashboard?.shieldMarket?.totalAssets),
			status: dashboard?.shieldMarket?.status ?? "fallback",
			href: `https://mantlescan.xyz/address/${AAVE_USDE}`,
		},
		{
			name: "Bybit",
			market: "ETHUSDT perpetual",
			icon: TrendingUp,
			token: false,
			accent: "text-orange",
			yield: `${dashboard?.alphaMarket?.estimatedFundingApy.toFixed(2) ?? "0.00"}%`,
			exposure: money(dashboard?.hedgeExecution?.currentShortNotionalUsd ?? 0),
			status: dashboard?.alphaMarket?.status ?? "fallback",
		},
	];

	return (
		<section
			id="execution"
			className="rounded-xl border border-border-edge bg-card px-5 py-5 sm:px-6"
		>
			<div className="flex items-center justify-between gap-4">
				<div>
					<h2 className="text-2xl font-bold">Execution venues</h2>
					<p className="mt-1 text-sm text-label-secondary">
						Live inputs and deployed capital routes.
					</p>
				</div>
				<div className="rounded-full bg-fill-quaternary px-3 py-2 text-xs text-label-secondary">
					Mantle + Bybit
				</div>
			</div>

			<div className="mt-6 hidden grid-cols-[1.4fr_1fr_1fr_110px_32px] gap-3 border-b border-border-edge pb-3 text-xs text-label-tertiary sm:grid">
				<div>Venue</div>
				<div>Market</div>
				<div>Yield / funding</div>
				<div>Status</div>
				<div />
			</div>

			<div className="divide-y divide-border-edge">
				{rows.map(
					({
						name,
						market,
						icon: Icon,
						token,
						accent,
						yield: rate,
						exposure,
						status,
						href,
					}) => (
						<div
							key={name}
							className="grid gap-4 py-5 sm:grid-cols-[1.4fr_1fr_1fr_110px_32px] sm:items-center sm:gap-3"
						>
							<div className="flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-fill-quaternary">
									{token ? (
										<img
											src="/images/usde.png"
											alt=""
											className="h-7 w-7 object-contain"
										/>
									) : (
										<Icon className={`h-5 w-5 ${accent}`} />
									)}
								</div>
								<div>
									<div className="font-bold">{name}</div>
									<div className="mt-1 text-xs text-label-tertiary">
										{exposure}
									</div>
								</div>
							</div>
							<div className="text-sm text-label-secondary">{market}</div>
							<div className="font-mono text-sm">{rate}</div>
							<div>
								<Status status={status} />
							</div>
							{href ? (
								<a
									href={href}
									target="_blank"
									rel="noreferrer"
									aria-label={`Open ${name}`}
									className="text-label-tertiary transition-colors hover:text-label-accent"
								>
									<ExternalLink className="h-4 w-4" />
								</a>
							) : (
								<div />
							)}
						</div>
					),
				)}
			</div>
		</section>
	);
}

function Status({ status }: { status: "live" | "fallback" }) {
	return (
		<span
			className={`inline-flex rounded px-2 py-1 text-xs ${
				status === "live"
					? "bg-positive-secondary text-positive"
					: "bg-orange-secondary text-orange"
			}`}
		>
			{status === "live" ? "Live" : "Fallback"}
		</span>
	);
}

function compactToken(value?: string): string {
	const amount = Number(value);
	return Number.isFinite(amount) && amount > 0
		? `${new Intl.NumberFormat("en-US", {
				notation: "compact",
				maximumFractionDigits: 2,
			}).format(amount)} USDe`
		: "--";
}

function money(value: number): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 0,
	}).format(value);
}
