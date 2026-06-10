import { useEffect } from "react";
import {
	AlertCircle,
	Check,
	ExternalLink,
	LoaderCircle,
	Network,
	ShieldCheck,
	WalletCards,
	X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TransactionFlow, TransactionStep } from "@/molq/use-molq-vault";

type TransactionStepperDialogProps = {
	flow: TransactionFlow | null;
	busy: boolean;
	error: string | null;
	onClose: () => void;
};

const stepIcons = {
	network: Network,
	approval: ShieldCheck,
	deposit: WalletCards,
	redeem: WalletCards,
} satisfies Record<TransactionStep["id"], typeof Network>;

export function TransactionStepperDialog({
	flow,
	busy,
	error,
	onClose,
}: TransactionStepperDialogProps) {
	useEffect(() => {
		if (!flow?.open) return;
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape" && !busy) onClose();
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [busy, flow?.open, onClose]);

	if (!flow?.open) return null;

	const title = flow.action === "deposit" ? "Deposit USDe" : "Withdraw USDe";

	return (
		<div
			className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-md sm:items-center sm:p-6"
			role="presentation"
			onMouseDown={(event) => {
				if (event.target === event.currentTarget && !busy) onClose();
			}}
		>
			<section
				role="dialog"
				aria-modal="true"
				aria-labelledby="transaction-dialog-title"
				className="w-full border border-border-quaternary bg-[#1d120b] shadow-2xl sm:max-w-[520px]"
			>
				<header className="flex items-start justify-between border-b border-border-edge px-5 py-5 sm:px-7">
					<div>
						<p className="text-xs font-semibold uppercase text-label-accent">
							Mantle transaction
						</p>
						<h2 id="transaction-dialog-title" className="mt-2 text-2xl font-bold">
							{flow.complete ? `${title} complete` : title}
						</h2>
						<p className="mt-1 text-sm text-label-secondary">{flow.amount} USDe</p>
					</div>
					<button
						type="button"
						aria-label="Close transaction dialog"
						disabled={busy}
						onClick={onClose}
						className="flex h-10 w-10 items-center justify-center border border-border-quaternary text-label-secondary transition-colors hover:bg-fill-quaternary hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
					>
						<X className="h-4 w-4" />
					</button>
				</header>

				<div className="px-5 py-6 sm:px-7">
					<ol className="space-y-0">
						{flow.steps.map((step, index) => (
							<TransactionStepRow
								key={step.id}
								step={step}
								last={index === flow.steps.length - 1}
							/>
						))}
					</ol>

					{error ? (
						<div className="mt-5 flex gap-3 border border-negative/30 bg-negative-secondary p-4 text-sm text-negative">
							<AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
							<span>{error}</span>
						</div>
					) : null}

					<div className="mt-6 border-t border-border-edge pt-5">
						{flow.complete ? (
							<Button
								className="w-full bg-fill-accent-primary font-bold text-label-on-light hover:bg-fill-accent-hover"
								onClick={onClose}
							>
								<Check className="mr-2 h-4 w-4" />
								Done
							</Button>
						) : (
							<p className="text-center text-xs text-label-secondary">
								{error
									? "Close this dialog and retry when ready."
									: "Keep this window open while your wallet confirms each step."}
							</p>
						)}
					</div>
				</div>
			</section>
		</div>
	);
}

function TransactionStepRow({ step, last }: { step: TransactionStep; last: boolean }) {
	const Icon = stepIcons[step.id];
	const active = step.status === "active";
	const complete = step.status === "complete";
	const failed = step.status === "error";

	return (
		<li className="relative flex gap-4 pb-6 last:pb-0">
			{!last ? (
				<span
					className={`absolute left-5 top-10 h-[calc(100%-2rem)] w-px ${
						complete ? "bg-fill-accent-primary" : "bg-border-quaternary"
					}`}
				/>
			) : null}
			<span
				className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center border ${
					complete
						? "border-fill-accent-primary bg-fill-accent-primary text-label-on-light"
						: failed
							? "border-negative/50 bg-negative-secondary text-negative"
							: active
								? "border-label-accent bg-fill-accent-secondary text-label-accent"
								: "border-border-quaternary bg-fill-quaternary text-label-tertiary"
				}`}
			>
				{complete ? (
					<Check className="h-4 w-4" />
				) : failed ? (
					<AlertCircle className="h-4 w-4" />
				) : active ? (
					<LoaderCircle className="h-4 w-4 animate-spin" />
				) : (
					<Icon className="h-4 w-4" />
				)}
			</span>
			<div className="min-w-0 flex-1 pt-0.5">
				<div className="flex items-center justify-between gap-3">
					<p className={`text-sm font-bold ${active ? "text-white" : ""}`}>
						{step.label}
					</p>
					<span className="text-[10px] font-semibold uppercase text-label-tertiary">
						{step.status}
					</span>
				</div>
				<p className="mt-1 text-xs leading-5 text-label-secondary">{step.description}</p>
				{step.hash ? (
					<a
						href={`https://mantlescan.xyz/tx/${step.hash}`}
						target="_blank"
						rel="noreferrer"
						className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-label-accent hover:underline"
					>
						View transaction
						<ExternalLink className="h-3 w-3" />
					</a>
				) : null}
			</div>
		</li>
	);
}
