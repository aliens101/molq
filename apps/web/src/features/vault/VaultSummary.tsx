import { Activity, WalletCards, type LucideIcon } from "lucide-react";

interface VaultSummaryProps {
	total: number;
	position: number;
	connected: boolean;
	supplyApy: number;
	hedgeConfigured: boolean;
	hedgeEnabled: boolean;
}

export function VaultSummary({
	total,
	position,
	connected,
	supplyApy,
	hedgeConfigured,
	hedgeEnabled,
}: VaultSummaryProps) {
	const items: Array<{
		label: string;
		value: string;
		sub: string;
		icon?: LucideIcon;
		image?: string;
		token?: boolean;
	}> = [
		{
			label: "Vault TVL",
			value: money(total),
			sub: "USDe on Mantle",
			token: true,
		},
		{
			label: "Your position",
			value: connected ? money(position) : "--",
			sub: connected ? "mqUSDe redeemable value" : "Wallet not connected",
			icon: WalletCards,
		},
		{
			label: "Aave supply APY",
			value: `${supplyApy.toFixed(2)}%`,
			sub: "Live USDe reserve",
			image: "/images/aave.png",
		},
		{
			label: "Hedge operator",
			value: hedgeConfigured ? (hedgeEnabled ? "Armed" : "Read only") : "Offline",
			sub: "Bybit ETHUSDT",
			icon: Activity,
		},
	];

	return (
		<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
			{items.map(({ label, value, sub, icon: Icon, image, token }) => (
				<div key={label} className="rounded-xl border border-border-edge bg-card px-6 py-6">
					<div className="flex items-center justify-between text-sm text-label-secondary">
						<span>{label}</span>
						{token ? (
							<img src="/images/usde.png" alt="" className="h-5 w-5 object-contain" />
						) : image ? (
							<img src={image} alt="" className="h-5 w-5 object-contain" />
						) : Icon ? (
							<Icon className="h-4 w-4 text-label-accent" />
						) : null}
					</div>
					<div className="mt-3 truncate text-xl font-bold">{value}</div>
					<div className="mt-2 text-xs text-label-tertiary">{sub}</div>
				</div>
			))}
		</div>
	);
}

function money(value: number): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 2,
	}).format(Number.isFinite(value) ? value : 0);
}
