import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
	ArrowRight,
	Bot,
	Braces,
	Check,
	CircleDollarSign,
	ExternalLink,
	Fingerprint,
	Github,
	Menu,
	ShieldCheck,
	X,
} from "lucide-react";
import { useRef, useState } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const APP_URL = import.meta.env.VITE_APP_URL ?? "http://localhost:5173";
const GITHUB_URL = "https://github.com/aliens101/molq";
const VAULT_URL = "https://mantlescan.xyz/address/0xBcBe5DE4D9F8F9336924eCB90888a775DfB06Eb9";
const AGENT_URL = "https://mantlescan.xyz/token/0x8004A169FB4a3325136EB29fA0ceB6D2e539a432?a=112";

const proof = [
	{ label: "Network", value: "Mantle" },
	{ label: "Vault", value: "ERC-4626" },
	{ label: "Identity", value: "Agent #112" },
	{ label: "Performance fee", value: "10% profit" },
];

const architecture = [
	{
		step: "01",
		title: "Deposit USDe",
		copy: "Users receive mqUSDe shares from a verified ERC-4626 vault on Mantle.",
		icon: CircleDollarSign,
	},
	{
		step: "02",
		title: "Read live carry",
		copy: "MolQ evaluates Aave supply yield, Bybit funding, liquidity, and market risk.",
		icon: Braces,
	},
	{
		step: "03",
		title: "Constrain the model",
		copy: "OpenAI proposes the action. Deterministic policy enforces capital and execution limits.",
		icon: ShieldCheck,
	},
	{
		step: "04",
		title: "Commit evidence",
		copy: "The accepted outcome and execution evidence are hashed into a Mantle decision log.",
		icon: Fingerprint,
	},
];

export default function App() {
	const [menuOpen, setMenuOpen] = useState(false);
	const pageRef = useRef<HTMLDivElement>(null);
	const economicsValueRef = useRef<HTMLDivElement>(null);

	useGSAP(
		() => {
			if (navigator.userAgent.includes("jsdom")) return;

			const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
			if (reducedMotion) {
				gsap.set(".gsap-reveal", { autoAlpha: 1, y: 0, x: 0, scale: 1 });
				return;
			}

			const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
			intro
				.from(".site-header", { yPercent: -100, duration: 0.55 }, 0)
				.from(".hero-eyebrow", { autoAlpha: 0, x: -24, duration: 0.45 }, 0.22)
				.from(
					".hero-title-char",
					{
						autoAlpha: 0,
						yPercent: 115,
						rotationX: -70,
						transformOrigin: "50% 100%",
						stagger: 0.055,
						duration: 0.68,
					},
					0.38,
				)
				.from(".hero-description", { autoAlpha: 0, y: 24, duration: 0.52 }, 0.72)
				.from(".hero-action", { autoAlpha: 0, y: 18, stagger: 0.1, duration: 0.45 }, 0.95)
				.from(
					".agent-terminal",
					{ autoAlpha: 0, x: 48, rotationY: -5, duration: 0.72 },
					0.42,
				)
				.from(
					".terminal-entry",
					{ autoAlpha: 0, x: 12, stagger: 0.08, duration: 0.35 },
					0.9,
				)
				.from(".proof-stat", { autoAlpha: 0, y: 18, stagger: 0.08, duration: 0.4 }, 1.18);

			gsap.to(".hero-grid-motion", {
				backgroundPosition: "center 160px",
				ease: "none",
				scrollTrigger: {
					trigger: ".hero-grid-motion",
					start: "top top",
					end: "bottom top",
					scrub: 1,
				},
			});

			gsap.to(".agent-terminal", {
				y: 54,
				rotationX: 2,
				ease: "none",
				scrollTrigger: {
					trigger: ".hero-grid-motion",
					start: "top top",
					end: "bottom top",
					scrub: 1,
				},
			});

			gsap.utils.toArray<HTMLElement>(".section-heading").forEach((heading) => {
				gsap.from(heading.children, {
					autoAlpha: 0,
					y: 38,
					stagger: 0.1,
					duration: 0.75,
					ease: "power3.out",
					scrollTrigger: {
						trigger: heading,
						start: "top 82%",
						once: true,
					},
				});
			});

			ScrollTrigger.batch(".strategy-card", {
				start: "top 84%",
				once: true,
				onEnter: (cards) =>
					gsap.fromTo(
						cards,
						{ autoAlpha: 0, y: 56, scale: 0.96 },
						{
							autoAlpha: 1,
							y: 0,
							scale: 1,
							stagger: 0.12,
							duration: 0.7,
							ease: "power3.out",
							overwrite: true,
						},
					),
			});

			gsap.from(".proof-row", {
				autoAlpha: 0,
				x: 48,
				stagger: 0.1,
				duration: 0.65,
				ease: "power3.out",
				scrollTrigger: {
					trigger: ".proof-list",
					start: "top 76%",
					once: true,
				},
			});

			const counter = { value: 0 };
			gsap.to(counter, {
				value: 10,
				duration: 1.4,
				ease: "power2.out",
				snap: { value: 1 },
				onUpdate: () => {
					if (economicsValueRef.current) {
						economicsValueRef.current.textContent = `${counter.value}%`;
					}
				},
				scrollTrigger: {
					trigger: ".economics-panel",
					start: "top 72%",
					once: true,
				},
			});

			gsap.from(".economics-copy > *", {
				autoAlpha: 0,
				y: 32,
				stagger: 0.1,
				duration: 0.7,
				ease: "power3.out",
				scrollTrigger: {
					trigger: ".economics-copy",
					start: "top 78%",
					once: true,
				},
			});

			gsap.from(".final-cta > *", {
				autoAlpha: 0,
				y: 42,
				scale: 0.96,
				stagger: 0.12,
				duration: 0.75,
				ease: "power3.out",
				scrollTrigger: {
					trigger: ".final-cta",
					start: "top 78%",
					once: true,
				},
			});

			if (window.matchMedia("(pointer: fine)").matches) {
				const pointerCleanups: Array<() => void> = [];
				document.querySelectorAll<HTMLElement>(".magnetic").forEach((button) => {
					const xTo = gsap.quickTo(button, "x", { duration: 0.35, ease: "power3" });
					const yTo = gsap.quickTo(button, "y", { duration: 0.35, ease: "power3" });
					const onMove = (event: PointerEvent) => {
						const rect = button.getBoundingClientRect();
						xTo((event.clientX - rect.left - rect.width / 2) * 0.16);
						yTo((event.clientY - rect.top - rect.height / 2) * 0.2);
					};
					const onLeave = () => {
						xTo(0);
						yTo(0);
					};
					button.addEventListener("pointermove", onMove);
					button.addEventListener("pointerleave", onLeave);
					pointerCleanups.push(() => {
						button.removeEventListener("pointermove", onMove);
						button.removeEventListener("pointerleave", onLeave);
					});
				});
				return () => pointerCleanups.forEach((cleanup) => cleanup());
			}
		},
		{ scope: pageRef },
	);

	return (
		<div ref={pageRef} className="min-h-screen overflow-x-hidden bg-ink text-white">
			<header className="site-header fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-ink/90 backdrop-blur-xl">
				<div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-5 lg:px-10">
					<a href="#" className="flex items-center gap-3" aria-label="MolQ home">
						<img
							src="/android-chrome-192x192.png"
							alt=""
							className="h-9 w-9 object-cover"
						/>
						<span className="text-lg font-bold">MolQ</span>
					</a>

					<nav className="hidden items-center gap-8 text-sm text-white/60 md:flex">
						<a href="#strategy" className="transition hover:text-white">
							Strategy
						</a>
						<a href="#proof" className="transition hover:text-white">
							Proof
						</a>
						<a href="#economics" className="transition hover:text-white">
							Economics
						</a>
					</nav>

					<div className="hidden items-center gap-3 md:flex">
						<a
							href={GITHUB_URL}
							target="_blank"
							rel="noreferrer"
							className="icon-button magnetic"
							aria-label="Open GitHub repository"
							title="GitHub"
						>
							<Github className="h-4 w-4" />
						</a>
						<a href={APP_URL} className="primary-button magnetic">
							Launch app
							<ArrowRight className="h-4 w-4" />
						</a>
					</div>

					<button
						type="button"
						className="icon-button md:hidden"
						onClick={() => setMenuOpen((open) => !open)}
						aria-label={menuOpen ? "Close navigation" : "Open navigation"}
					>
						{menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
					</button>
				</div>

				{menuOpen ? (
					<nav className="border-t border-white/10 bg-ink px-5 py-5 md:hidden">
						{["strategy", "proof", "economics"].map((item) => (
							<a
								key={item}
								href={`#${item}`}
								onClick={() => setMenuOpen(false)}
								className="block border-b border-white/10 py-4 text-sm capitalize text-white/70"
							>
								{item}
							</a>
						))}
						<a href={APP_URL} className="primary-button mt-5 w-full justify-center">
							Launch app
							<ArrowRight className="h-4 w-4" />
						</a>
					</nav>
				) : null}
			</header>

			<main>
				<section className="hero-grid hero-grid-motion relative border-b border-white/10 pt-16 lg:min-h-[92vh]">
					<div className="mx-auto flex w-full min-w-0 max-w-[1440px] flex-col justify-between overflow-hidden px-5 pb-8 pt-12 lg:min-h-[calc(92vh-4rem)] lg:px-10 lg:pt-20">
						<div className="grid w-full min-w-0 grid-cols-1 items-end gap-12 lg:grid-cols-[1.18fr_0.82fr]">
							<div className="hero-copy w-full min-w-0 max-w-full">
								<div className="eyebrow hero-eyebrow">
									<span className="h-2 w-2 bg-signal" />
									Autonomous USDe yield on Mantle
								</div>
								<h1
									className="mt-7 flex max-w-5xl overflow-hidden text-[clamp(3.6rem,8vw,8.8rem)] font-bold leading-[0.84]"
									aria-label="MolQ"
								>
									{"MolQ".split("").map((character, index) => (
										<span
											key={`${character}-${index}`}
											aria-hidden="true"
											className="hero-title-char inline-block"
										>
											{character}
										</span>
									))}
								</h1>
								<p className="hero-description mt-7 w-full max-w-2xl break-words text-xl leading-8 text-white/64 sm:text-2xl">
									An identifiable AI agent that searches for positive carry,
									protects capital with hard policy limits, and proves every
									decision on-chain.
								</p>
								<div className="mt-9 flex flex-col gap-3 sm:flex-row">
									<a
										href={APP_URL}
										className="primary-button magnetic hero-action justify-center sm:justify-start"
									>
										Launch MolQ
										<ArrowRight className="h-4 w-4" />
									</a>
									<a
										href={AGENT_URL}
										target="_blank"
										rel="noreferrer"
										className="secondary-button magnetic hero-action justify-center sm:justify-start"
									>
										Verify agent
										<ExternalLink className="h-4 w-4" />
									</a>
								</div>
							</div>

							<AgentTerminal />
						</div>

						<div className="mt-12 hidden border border-white/10 bg-black/20 sm:grid sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
							{proof.map((item) => (
								<div
									key={item.label}
									className="proof-stat border-b border-white/10 px-5 py-5 last:border-b-0 sm:border-r lg:border-b-0"
								>
									<div className="text-xs uppercase text-white/35">
										{item.label}
									</div>
									<div className="mt-2 font-mono text-sm">{item.value}</div>
								</div>
							))}
						</div>
					</div>
				</section>

				<section id="strategy" className="border-b border-white/10 py-14 lg:py-32">
					<div className="mx-auto max-w-[1440px] px-5 lg:px-10">
						<SectionHeading
							number="01"
							title="One vault. Two yield engines. One accountable agent."
							copy="MolQ combines on-chain USDe supply yield with a policy-capped exchange hedge, while keeping strategy decisions observable."
						/>

						<div className="mt-16 grid border-l border-t border-white/10 md:grid-cols-2 xl:grid-cols-4">
							{architecture.map(({ step, title, copy, icon: Icon }) => (
								<article
									key={step}
									className="strategy-card group min-h-[280px] border-b border-r border-white/10 p-6 transition-colors hover:bg-white/[0.035]"
								>
									<div className="flex items-center justify-between">
										<span className="font-mono text-xs text-white/30">
											{step}
										</span>
										<Icon className="h-5 w-5 text-signal" />
									</div>
									<h3 className="mt-20 text-2xl font-bold">{title}</h3>
									<p className="mt-4 text-sm leading-6 text-white/50">{copy}</p>
								</article>
							))}
						</div>
					</div>
				</section>

				<section id="proof" className="bg-paper py-24 text-ink lg:py-32">
					<div className="mx-auto max-w-[1440px] px-5 lg:px-10">
						<div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr]">
							<SectionHeading
								number="02"
								title="Trust the constraints, then verify the trail."
								copy="The model never controls a wallet directly. MolQ separates reasoning, policy, execution, and evidence."
								dark
							/>

							<div className="proof-list border-t border-ink/20">
								<ProofRow
									title="ERC-8004 identity"
									value="Agent #112"
									href={AGENT_URL}
								/>
								<ProofRow
									title="Verified vault"
									value="0xBcBe...6Eb9"
									href={VAULT_URL}
								/>
								<ProofRow
									title="Decision logger"
									value="0x24df...1Be9"
									href="https://mantlescan.xyz/address/0x24df9c33D24D7C84e527D247D25a203490001Be9"
								/>
								<ProofRow
									title="Open-source system"
									value="aliens101/molq"
									href={GITHUB_URL}
								/>
							</div>
						</div>
					</div>
				</section>

				<section
					id="economics"
					className="economics-panel border-b border-white/10 py-24 lg:py-32"
				>
					<div className="mx-auto grid max-w-[1440px] gap-16 px-5 lg:grid-cols-2 lg:px-10">
						<div>
							<div className="eyebrow">
								<span className="h-2 w-2 bg-signal" />
								Aligned economics
							</div>
							<div
								ref={economicsValueRef}
								className="mt-10 text-[clamp(5rem,12vw,10rem)] font-bold leading-none text-signal"
							>
								0%
							</div>
							<div className="mt-3 text-xl text-white/55">
								of realized Alpha profit
							</div>
						</div>

						<div className="economics-copy self-end">
							<h2 className="max-w-xl text-4xl font-bold leading-tight sm:text-5xl">
								MolQ earns only after users earn.
							</h2>
							<div className="mt-10 space-y-4">
								<EconomicRow label="Deposit fee" value="0%" />
								<EconomicRow label="Withdrawal fee" value="0%" />
								<EconomicRow label="Unrealized P&L fee" value="0%" />
								<EconomicRow label="Realized performance fee" value="10%" active />
							</div>
						</div>
					</div>
				</section>

				<section className="py-24 lg:py-32">
					<div className="final-cta mx-auto max-w-[1440px] px-5 text-center lg:px-10">
						<Bot className="mx-auto h-10 w-10 text-signal" />
						<h2 className="mx-auto mt-8 max-w-4xl text-5xl font-bold leading-[0.98] sm:text-7xl">
							Put idle USDe under accountable intelligence.
						</h2>
						<a href={APP_URL} className="primary-button magnetic mt-10 inline-flex">
							Launch MolQ
							<ArrowRight className="h-4 w-4" />
						</a>
					</div>
				</section>
			</main>

			<footer className="border-t border-white/10">
				<div className="mx-auto flex max-w-[1440px] flex-col gap-5 px-5 py-8 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between lg:px-10">
					<div>MolQ / Mantle mainnet / ERC-8004 Agent #112</div>
					<div className="flex gap-6">
						<a
							href={GITHUB_URL}
							target="_blank"
							rel="noreferrer"
							className="hover:text-white"
						>
							GitHub
						</a>
						<a
							href={VAULT_URL}
							target="_blank"
							rel="noreferrer"
							className="hover:text-white"
						>
							Mantlescan
						</a>
					</div>
				</div>
			</footer>
		</div>
	);
}

function AgentTerminal() {
	return (
		<div className="terminal agent-terminal relative w-full min-w-0 overflow-hidden border border-white/15 bg-[#0a0d0a]">
			<div className="terminal-scanline" aria-hidden="true" />
			<div className="flex h-11 items-center justify-between border-b border-white/10 px-4">
				<div className="flex items-center gap-2 text-xs text-white/45">
					<span className="h-2 w-2 animate-pulse bg-signal" />
					MOLQ / LIVE POLICY
				</div>
				<span className="font-mono text-[10px] text-white/25">MANTLE 5000</span>
			</div>
			<div className="p-5 font-mono text-xs sm:p-6">
				<div className="terminal-entry hidden sm:block">
					<TerminalLine label="identity" value="erc8004:112" />
					<TerminalLine label="model" value="gpt-5.4-mini" />
					<TerminalLine label="shield" value="Aave V3 / USDe / 85%" />
					<TerminalLine label="alpha" value="Bybit / ETHUSDT / capped" />
					<div className="my-5 h-px bg-white/10" />
				</div>
				<div className="terminal-entry text-white/35">latest_decision</div>
				<div className="terminal-entry mt-3 text-lg text-signal">HOLD</div>
				<p className="terminal-entry mt-3 w-full max-w-md break-words font-sans text-sm leading-6 text-white/55">
					No assets to protect or hedge. Avoid unnecessary turnover.
				</p>
				<div className="terminal-entry mt-6 flex items-center gap-2 text-white/45">
					<Check className="h-3.5 w-3.5 text-signal" />
					<span>logged on Mantle</span>
				</div>
			</div>
		</div>
	);
}

function TerminalLine({ label, value }: { label: string; value: string }) {
	return (
		<div className="mb-3 flex min-w-0 items-center justify-between gap-4">
			<span className="text-white/30">{label}</span>
			<span className="min-w-0 break-words text-right text-white/75">{value}</span>
		</div>
	);
}

function SectionHeading({
	number,
	title,
	copy,
	dark = false,
}: {
	number: string;
	title: string;
	copy: string;
	dark?: boolean;
}) {
	return (
		<div className="section-heading max-w-3xl">
			<div className={`font-mono text-xs ${dark ? "text-ink/35" : "text-signal"}`}>
				/{number}
			</div>
			<h2 className="mt-5 text-4xl font-bold leading-[1.02] sm:text-6xl">{title}</h2>
			<p
				className={`mt-6 max-w-2xl text-base leading-7 ${
					dark ? "text-ink/60" : "text-white/50"
				}`}
			>
				{copy}
			</p>
		</div>
	);
}

function ProofRow({ title, value, href }: { title: string; value: string; href: string }) {
	return (
		<a
			href={href}
			target="_blank"
			rel="noreferrer"
			className="proof-row group flex items-center justify-between gap-4 border-b border-ink/20 py-6"
		>
			<div>
				<div className="text-xs uppercase text-ink/40">{title}</div>
				<div className="mt-2 font-mono text-sm sm:text-base">{value}</div>
			</div>
			<ExternalLink className="h-4 w-4 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
		</a>
	);
}

function EconomicRow({
	label,
	value,
	active = false,
}: {
	label: string;
	value: string;
	active?: boolean;
}) {
	return (
		<div className="flex items-center justify-between border-b border-white/10 pb-4">
			<span className="text-white/50">{label}</span>
			<span className={`font-mono ${active ? "text-signal" : ""}`}>{value}</span>
		</div>
	);
}
