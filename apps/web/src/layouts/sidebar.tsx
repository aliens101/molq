import {
	Activity,
	Bot,
	ExternalLink,
	LayoutDashboard,
	ShieldCheck,
	TrendingUp,
	WalletCards,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { MOLQ_VAULT } from "@/molq/contracts";

const items = [
	{ to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
	{ to: "/deposit", label: "Deposit", icon: WalletCards },
	{ to: "/performance", label: "Performance", icon: TrendingUp },
	{ to: "/execution", label: "Execution", icon: Activity },
	{ to: "/agent", label: "Agent", icon: Bot },
];

export function Sidebar() {
	return (
		<aside className="sticky top-0 hidden h-screen w-[224px] shrink-0 self-start overflow-hidden border-r border-border-edge bg-card px-4 py-5 lg:flex lg:flex-col">
			<NavLink to="/" className="flex items-center gap-3 px-2">
				<img
					src="/android-chrome-192x192.png"
					alt=""
					className="h-10 w-10 rounded-lg object-cover"
				/>
				<div>
					<div className="text-lg font-bold">MolQ</div>
					<div className="text-xs text-label-secondary">Mantle mainnet</div>
				</div>
			</NavLink>

			<nav className="mt-10 min-h-0 flex-1 space-y-1 overflow-y-auto">
				{items.map(({ to, label, icon: Icon, end }) => (
					<NavLink
						key={to}
						to={to}
						end={end}
						className={({ isActive }) =>
							`flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors ${
								isActive
									? "bg-fill-accent-secondary text-label-accent"
									: "text-label-secondary hover:bg-fill-quaternary hover:text-foreground"
							}`
						}
					>
						<Icon className="h-4 w-4" />
						{label}
					</NavLink>
				))}
			</nav>

			<div className="mt-4 shrink-0 rounded-xl border border-border-edge bg-fill-quaternary p-4">
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
