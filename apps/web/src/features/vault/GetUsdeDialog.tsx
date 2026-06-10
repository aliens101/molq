import { useEffect } from "react";
import { ArrowUpRight, X } from "lucide-react";

const providers = [
	{
		name: "Stargate Finance",
		description: "Bridge supported assets into Mantle.",
		image: "/images/stargate.png",
		url: "https://stargate.finance/",
	},
	{
		name: "Relay",
		description: "Bridge and swap from another network.",
		image: "/images/relay.png",
		url: "https://relay.link/bridge",
	},
	{
		name: "Merchant Moe",
		description: "Swap assets for USDe directly on Mantle.",
		image: "/images/merchantmoe.png",
		url: "https://merchantmoe.com/trade",
	},
];

export function GetUsdeDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
	useEffect(() => {
		if (!open) return;
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [onClose, open]);

	if (!open) return null;

	return (
		<div
			className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-md sm:items-center sm:p-6"
			role="presentation"
			onMouseDown={(event) => {
				if (event.target === event.currentTarget) onClose();
			}}
		>
			<section
				role="dialog"
				aria-modal="true"
				aria-labelledby="get-usde-title"
				className="w-full border border-border-quaternary bg-[#1d120b] shadow-2xl sm:max-w-[520px]"
			>
				<header className="flex items-start justify-between border-b border-border-edge px-5 py-5 sm:px-7">
					<div className="flex items-center gap-3">
						<img src="/images/usde.png" alt="" className="h-11 w-11 object-contain" />
						<div>
							<p className="text-xs font-semibold uppercase text-label-accent">
								Fund your wallet
							</p>
							<h2 id="get-usde-title" className="mt-1 text-2xl font-bold">
								Get USDe on Mantle
							</h2>
						</div>
					</div>
					<button
						type="button"
						aria-label="Close Get USDe dialog"
						onClick={onClose}
						className="flex h-10 w-10 items-center justify-center border border-border-quaternary text-label-secondary transition-colors hover:bg-fill-quaternary hover:text-white"
					>
						<X className="h-4 w-4" />
					</button>
				</header>

				<div className="px-5 py-5 sm:px-7 sm:py-6">
					<p className="mb-4 text-sm leading-6 text-label-secondary">
						Choose a third-party route. Confirm Mantle as the destination and verify the
						USDe contract before signing.
					</p>
					<div className="divide-y divide-border-edge border-y border-border-edge">
						{providers.map((provider) => (
							<a
								key={provider.name}
								href={provider.url}
								target="_blank"
								rel="noreferrer"
								className="group flex items-center gap-4 py-4 transition-colors hover:bg-fill-quaternary sm:px-3"
							>
								<span className="flex h-11 w-11 shrink-0 items-center justify-center bg-white p-1.5">
									<img
										src={provider.image}
										alt={`${provider.name} logo`}
										className="h-full w-full object-contain"
									/>
								</span>
								<span className="min-w-0 flex-1">
									<span className="block text-sm font-bold">{provider.name}</span>
									<span className="mt-1 block text-xs text-label-secondary">
										{provider.description}
									</span>
								</span>
								<ArrowUpRight className="h-4 w-4 shrink-0 text-label-tertiary transition group-hover:text-label-accent" />
							</a>
						))}
					</div>
					<p className="mt-4 font-mono text-[10px] leading-5 text-label-tertiary">
						USDe: 0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34
					</p>
				</div>
			</section>
		</div>
	);
}
