import { Activity, ExternalLink, LayoutDashboard, ShieldCheck, WalletCards } from "lucide-react";
import { MOLQ_VAULT } from "@/molq/contracts";

const items = [
	{ label: "Overview", icon: LayoutDashboard, href: "#overview" },
	{ label: "Position", icon: WalletCards, href: "#position" },
	{ label: "Execution", icon: Activity, href: "#execution" },
];

export function Sidebar() {
	return (
		<aside className="hidden min-h-screen w-[224px] shrink-0 border-r border-border-edge bg-card px-4 py-5 lg:flex lg:flex-col">
			<div className="flex items-center gap-3 px-2">
				<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-fill-accent-primary font-bold text-label-on-light">
					MQ
				</div>
				<div>
					<div className="text-lg font-bold">MolQ</div>
					<div className="text-xs text-label-secondary">Mantle mainnet</div>
				</div>
			</div>

			<nav className="mt-10 space-y-1">
				{items.map(({ label, icon: Icon, href }, index) => (
					<a
						key={label}
						href={href}
						className={`flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors ${
							index === 0
								? "bg-fill-accent-secondary text-label-accent"
								: "text-label-secondary hover:bg-fill-quaternary hover:text-foreground"
						}`}
					>
						<Icon className="h-4 w-4" />
						{label}
					</a>
				))}
			</nav>

			<div className="mt-auto rounded-xl border border-border-edge bg-fill-quaternary p-4">
				<div className="flex items-center gap-2 text-sm font-bold">
					<ShieldCheck className="h-4 w-4 text-label-accent" />
					Verified vault
				</div>
				<p className="mt-2 text-xs leading-5 text-label-secondary">
					ERC-4626 custody with the Shield sleeve supplied to Aave V3.
				</p>
				<a
					href={`https://mantlescan.xyz/address/${MOLQ_VAULT}`}
					target="_blank"
					rel="noreferrer"
					className="mt-4 flex items-center gap-2 text-xs font-semibold text-label-accent"
				>
					View contract
					<ExternalLink className="h-3.5 w-3.5" />
				</a>
			</div>
		</aside>
	);
}
