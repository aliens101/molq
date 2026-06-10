import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
	AlertTriangle,
	ArrowRight,
	BarChart3,
	BookOpen,
	Bot,
	Check,
	ChevronDown,
	CircleDollarSign,
	ExternalLink,
	Fingerprint,
	Github,
	LockKeyhole,
	Menu,
	Network,
	ShieldCheck,
	WalletCards,
	X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const APP_URL =
	import.meta.env.VITE_APP_URL ?? (import.meta.env.DEV ? "http://localhost:5173" : "/app");
const GITHUB_URL = "https://github.com/aliens101/molq";
const DOCS_URL = `${GITHUB_URL}#readme`;
const VAULT_URL = "https://mantlescan.xyz/address/0xBcBe5DE4D9F8F9336924eCB90888a775DfB06Eb9#code";
const LOGGER_URL = "https://mantlescan.xyz/address/0x24df9c33D24D7C84e527D247D25a203490001Be9#code";
const AGENT_URL = "https://mantlescan.xyz/token/0x8004A169FB4a3325136EB29fA0ceB6D2e539a432?a=112";

interface Dashboard {
	portfolio: {
		balance: number;
		realizedProfit: number;
		shieldBalance: number;
		alphaBalance: number;
		allocation: { shieldPercent: number; alphaPercent: number };
	};
	market: {
		mantleYieldApy: number;
		fundingApy: number;
		estimatedNetApy: number;
		riskScore: number;
		updatedAt: string;
	};
	shieldMarket?: { status: "live" | "fallback" };
	alphaMarket?: { status: "live" | "fallback" };
	decisions: Array<{
		action: string;
		reason: string;
		createdAt: string;
		txHash?: string;
	}>;
}

const architecture = [
	{
		step: "01",
		title: "Deposit USDe",
		copy: "Deposit directly into a verified ERC-4626 vault and receive transferable mqUSDe shares.",
		icon: CircleDollarSign,
	},
	{
		step: "02",
		title: "Earn shield yield",
		copy: "The vault targets 85% of capital to Aave V3 USDe lending on Mantle.",
		icon: ShieldCheck,
	},
	{
		step: "03",
		title: "Capture positive carry",
		copy: "A capped liquid sleeve can support a separately funded Bybit ETHUSDT hedge.",
		icon: BarChart3,
	},
	{
		step: "04",
		title: "Verify every decision",
		copy: "Policy-approved agent outcomes and execution evidence are committed on Mantle.",
		icon: Fingerprint,
	},
];

const riskControls = [
	{
		title: "Non-custodial vault",
		copy: "Deposits and redemptions remain permissionless through the ERC-4626 contract.",
		icon: WalletCards,
	},
	{
		title: "Deterministic policy",
		copy: "The model proposes actions; hard-coded allocation and execution limits decide what is allowed.",
		icon: LockKeyhole,
	},
	{
		title: "Capped exchange exposure",
		copy: "Bybit is an isolated execution venue. Vault principal is not transferred by the agent model.",
		icon: AlertTriangle,
	},
	{
		title: "Onchain evidence",
		copy: "Identity, vault code, decision logger, and accepted outcomes are publicly inspectable.",
		icon: Network,
	},
];

const faqs = [
	{
		question: "Where does the yield come from?",
		answer: "MolQ combines Aave V3 USDe supply yield on Mantle with a policy-capped hedge sleeve designed to capture positive funding carry. Returns are variable and are not guaranteed.",
	},
	{
		question: "Can the AI move user funds freely?",
		answer: "No. The model proposes an action, but deterministic policy checks constrain allocations and execution. Deposits and redemptions are handled by the verified ERC-4626 vault.",
	},
	{
		question: "What are the main risks?",
		answer: "Users face smart-contract, USDe, Aave, Mantle, exchange, funding-rate, oracle, liquidity, and operational risks. The hedge sleeve can lose money and positive carry can disappear.",
	},
	{
		question: "How does MolQ make money?",
		answer: "MolQ charges no deposit or withdrawal fee. A 10% performance fee applies only to realized vault profit; principal and unrealized P&L are excluded.",
	},
	{
		question: "Is MolQ audited?",
		answer: "MolQ is open source and its deployed contracts are verified, but it has not completed an independent production audit. It should be treated as experimental software.",
	},
];

export default function App() {
	const [menuOpen, setMenuOpen] = useState(false);
	const [dashboard, setDashboard] = useState<Dashboard | null>(null);
	const [dataState, setDataState] = useState<"loading" | "live" | "unavailable">("loading");
	const pageRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		let active = true;

		const load = async () => {
			try {
				const response = await fetch("/api/dashboard");
				if (!response.ok) throw new Error("Dashboard unavailable");
				const payload = (await response.json()) as Dashboard;
				if (active) {
					setDashboard(payload);
					setDataState("live");
				}
			} catch {
				if (active) setDataState("unavailable");
			}
		};

		void load();
		const interval = window.setInterval(load, 30_000);
		return () => {
			active = false;
			window.clearInterval(interval);
		};
	}, []);

	useGSAP(
		() => {
			if (navigator.userAgent.includes("jsdom")) return;
			const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
			if (reducedMotion) return;

			const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
			intro
				.from(".site-header", { yPercent: -100, duration: 0.55 }, 0)
				.from(".hero-eyebrow", { autoAlpha: 0, x: -24, duration: 0.45 }, 0.2)
				.from(
					".hero-title-line",
					{ autoAlpha: 0, yPercent: 110, rotationX: -55, stagger: 0.1, duration: 0.75 },
					0.35,
				)
				.from(".hero-description", { autoAlpha: 0, y: 24, duration: 0.5 }, 0.72)
				.from(".hero-action", { autoAlpha: 0, y: 18, stagger: 0.1, duration: 0.45 }, 0.9)
				.from(
					".agent-terminal",
					{ autoAlpha: 0, x: 48, rotationY: -5, duration: 0.72 },
					0.42,
				)
				.from(".terminal-entry", { autoAlpha: 0, x: 12, stagger: 0.07, duration: 0.3 }, 0.9)
				.from(".metric-cell", { autoAlpha: 0, y: 20, stagger: 0.07, duration: 0.4 }, 1.05);

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
				y: 48,
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
					scrollTrigger: { trigger: heading, start: "top 82%", once: true },
				});
			});

			ScrollTrigger.batch(".reveal-card", {
				start: "top 86%",
				once: true,
				onEnter: (cards) =>
					gsap.fromTo(
						cards,
						{ autoAlpha: 0, y: 52 },
						{
							autoAlpha: 1,
							y: 0,
							stagger: 0.1,
							duration: 0.65,
							ease: "power3.out",
							overwrite: true,
						},
					),
			});

			gsap.from(".allocation-fill", {
				scaleX: 0,
				transformOrigin: "left center",
				duration: 1.2,
				stagger: 0.12,
				ease: "power3.inOut",
				scrollTrigger: { trigger: ".allocation-panel", start: "top 72%", once: true },
			});

			gsap.from(".proof-row", {
				autoAlpha: 0,
				x: 44,
				stagger: 0.08,
				duration: 0.6,
				ease: "power3.out",
				scrollTrigger: { trigger: ".proof-list", start: "top 78%", once: true },
			});

			gsap.from(".final-cta > *", {
				autoAlpha: 0,
				y: 38,
				stagger: 0.1,
				duration: 0.7,
				ease: "power3.out",
				scrollTrigger: { trigger: ".final-cta", start: "top 80%", once: true },
			});

			if (window.matchMedia("(pointer: fine)").matches) {
				const cleanups: Array<() => void> = [];
				document.querySelectorAll<HTMLElement>(".magnetic").forEach((button) => {
					const xTo = gsap.quickTo(button, "x", { duration: 0.35, ease: "power3" });
					const yTo = gsap.quickTo(button, "y", { duration: 0.35, ease: "power3" });
					const onMove = (event: PointerEvent) => {
						const rect = button.getBoundingClientRect();
						xTo((event.clientX - rect.left - rect.width / 2) * 0.14);
						yTo((event.clientY - rect.top - rect.height / 2) * 0.18);
					};
					const onLeave = () => {
						xTo(0);
						yTo(0);
					};
					button.addEventListener("pointermove", onMove);
					button.addEventListener("pointerleave", onLeave);
					cleanups.push(() => {
						button.removeEventListener("pointermove", onMove);
						button.removeEventListener("pointerleave", onLeave);
					});
				});
				return () => cleanups.forEach((cleanup) => cleanup());
			}
		},
		{ scope: pageRef },
	);

	const latestDecision = dashboard?.decisions[0];
	const shieldPercent = dashboard?.portfolio.allocation.shieldPercent ?? 85;
	const alphaPercent = dashboard?.portfolio.allocation.alphaPercent ?? 15;

	return (
		<div ref={pageRef} className="min-h-screen overflow-x-hidden bg-ink text-white">
			<Header menuOpen={menuOpen} setMenuOpen={setMenuOpen} />

			<main>
				<section className="hero-grid hero-grid-motion relative border-b border-white/10 pt-16 lg:min-h-[94vh]">
					<div className="mx-auto flex min-h-[calc(94vh-4rem)] w-full min-w-0 max-w-[1440px] flex-col justify-between overflow-hidden px-5 pb-8 pt-12 lg:px-10 lg:pt-20">
						<div className="grid min-w-0 grid-cols-[minmax(0,1fr)] items-end gap-12 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]">
							<div className="min-w-0">
								<div className="eyebrow hero-eyebrow">
									<span className="h-2 w-2 bg-signal" />
									Autonomous USDe yield on Mantle
								</div>
								<h1
									className="mt-7 max-w-5xl overflow-hidden text-[clamp(3.5rem,7.6vw,8rem)] font-bold leading-[0.88]"
									aria-label="MolQ autonomous USDe yield"
								>
									<span className="hero-title-line block">MolQ</span>
									<span className="hero-title-line block text-white/36">
										Earn with
									</span>
									<span className="hero-title-line block text-white/36">
										proof.
									</span>
								</h1>
								<p className="hero-description mt-7 max-w-2xl text-lg leading-8 text-white/64 sm:text-xl">
									Deposit USDe once. MolQ routes capital through a constrained
									yield strategy, protects execution with hard policy limits, and
									makes every accepted agent decision verifiable onchain.
								</p>
								<div className="mt-9 flex flex-col gap-3 sm:flex-row">
									<a
										href={APP_URL}
										className="primary-button magnetic hero-action justify-center"
									>
										Deposit USDe
										<ArrowRight className="h-4 w-4" />
									</a>
									<a
										href="#performance"
										className="secondary-button magnetic hero-action justify-center"
									>
										Explore performance
										<BarChart3 className="h-4 w-4" />
									</a>
								</div>
							</div>

							<AgentTerminal
								dataState={dataState}
								dashboard={dashboard}
								latestDecision={latestDecision}
							/>
						</div>

						<div className="mt-12 grid border-l border-t border-white/10 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
							<MetricCell
								label="Vault TVL"
								value={dashboard ? money(dashboard.portfolio.balance) : "—"}
								status={dataState}
							/>
							<MetricCell
								label="Estimated net APY"
								value={dashboard ? percent(dashboard.market.estimatedNetApy) : "—"}
								status={dataState}
							/>
							<MetricCell label="Network" value="Mantle" />
							<MetricCell label="Performance fee" value="10% of profit" />
						</div>
					</div>
				</section>

				<section className="integration-strip border-b border-white/10">
					<div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-5 py-7 lg:flex-row lg:items-center lg:px-10">
						<span className="font-mono text-[10px] uppercase text-white/35">
							Integrated execution stack
						</span>
						<div className="flex flex-wrap items-center gap-x-10 gap-y-5">
							<IntegrationLogo src="/images/aave.png" name="Aave V3" />
							<IntegrationLogo src="/images/bybit.svg" name="Bybit" />
							<IntegrationLogo src="/images/mantle.svg" name="Mantle" />
							<IntegrationLogo src="/images/usde.png" name="USDe" />
						</div>
					</div>
				</section>

				<section id="product" className="border-b border-white/10 py-20 lg:py-32">
					<div className="mx-auto max-w-[1440px] px-5 lg:px-10">
						<SectionHeading
							number="01"
							eyebrow="The product"
							title="One deposit. Two yield engines. No black box."
							copy="MolQ turns idle USDe into an observable strategy while preserving a simple ERC-4626 deposit and redemption experience."
						/>

						<div className="mt-14 grid border-l border-t border-white/10 md:grid-cols-2 xl:grid-cols-4">
							{architecture.map(({ step, title, copy, icon: Icon }) => (
								<article
									key={step}
									className="reveal-card group min-h-[290px] border-b border-r border-white/10 p-6 transition-colors hover:bg-white/[0.035]"
								>
									<div className="flex items-center justify-between">
										<span className="font-mono text-xs text-white/30">
											{step}
										</span>
										<Icon className="h-5 w-5 text-signal" />
									</div>
									<h3 className="mt-20 text-2xl font-bold">{title}</h3>
									<p className="mt-4 text-sm leading-6 text-white/52">{copy}</p>
								</article>
							))}
						</div>
					</div>
				</section>

				<section id="performance" className="bg-paper py-20 text-ink lg:py-32">
					<div className="mx-auto max-w-[1440px] px-5 lg:px-10">
						<div className="grid gap-14 lg:grid-cols-[0.78fr_1.22fr]">
							<SectionHeading
								number="02"
								eyebrow="Live strategy"
								title="See where the yield comes from."
								copy="Metrics are read from MolQ's backend and deployed vault. When data is unavailable, the page shows no estimate rather than substituting demo values."
								dark
							/>

							<div className="allocation-panel border border-ink/20 bg-white/35 p-5 sm:p-8">
								<div className="flex flex-col gap-3 border-b border-ink/15 pb-6 sm:flex-row sm:items-end sm:justify-between">
									<div>
										<div className="font-mono text-[10px] uppercase text-ink/45">
											Current allocation
										</div>
										<div className="mt-2 text-3xl font-bold">
											{dataState === "live"
												? "Live vault state"
												: "Policy target"}
										</div>
									</div>
									<DataBadge state={dataState} dark />
								</div>

								<div className="mt-8 space-y-8">
									<AllocationRow
										label="Shield / Aave V3 USDe"
										value={shieldPercent}
										apy={
											dashboard
												? percent(dashboard.market.mantleYieldApy)
												: "—"
										}
										amount={
											dashboard
												? money(dashboard.portfolio.shieldBalance)
												: "—"
										}
										color="bg-ink"
									/>
									<AllocationRow
										label="Alpha / liquid hedge sleeve"
										value={alphaPercent}
										apy={dashboard ? percent(dashboard.market.fundingApy) : "—"}
										amount={
											dashboard
												? money(dashboard.portfolio.alphaBalance)
												: "—"
										}
										color="bg-[#709b48]"
									/>
								</div>

								<div className="mt-9 grid border-l border-t border-ink/15 sm:grid-cols-3">
									<LightMetric
										label="Estimated net APY"
										value={
											dashboard
												? percent(dashboard.market.estimatedNetApy)
												: "—"
										}
									/>
									<LightMetric
										label="Realized profit"
										value={
											dashboard
												? money(dashboard.portfolio.realizedProfit)
												: "—"
										}
									/>
									<LightMetric
										label="Risk score"
										value={
											dashboard ? `${dashboard.market.riskScore}/100` : "—"
										}
									/>
								</div>
								<p className="mt-5 text-xs leading-5 text-ink/50">
									APY is variable, forward-looking, and not guaranteed. Funding
									carry can reverse and strategy performance may be negative.
								</p>
							</div>
						</div>
					</div>
				</section>

				<section id="security" className="border-b border-white/10 py-20 lg:py-32">
					<div className="mx-auto max-w-[1440px] px-5 lg:px-10">
						<div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr]">
							<SectionHeading
								number="03"
								eyebrow="Risk controls"
								title="The model reasons. Policy controls."
								copy="MolQ separates model output from custody, authorization, execution, and evidence. This limits what an incorrect or adversarial response can do."
							/>
							<div className="grid border-l border-t border-white/10 sm:grid-cols-2">
								{riskControls.map(({ title, copy, icon: Icon }) => (
									<article
										key={title}
										className="reveal-card min-h-[245px] border-b border-r border-white/10 p-6"
									>
										<Icon className="h-5 w-5 text-signal" />
										<h3 className="mt-12 text-xl font-bold">{title}</h3>
										<p className="mt-4 text-sm leading-6 text-white/52">
											{copy}
										</p>
									</article>
								))}
							</div>
						</div>

						<div className="mt-12 border border-[#ffcc66]/30 bg-[#ffcc66]/[0.06] p-5 sm:flex sm:items-start sm:gap-5">
							<AlertTriangle className="h-5 w-5 shrink-0 text-[#ffcc66]" />
							<div className="mt-3 sm:mt-0">
								<div className="font-bold">
									Experimental and not independently audited
								</div>
								<p className="mt-2 max-w-4xl text-sm leading-6 text-white/55">
									MolQ contracts are verified and open source, but an independent
									production audit has not been completed. Smart-contract,
									stablecoin, protocol, exchange, liquidity, and operational loss
									remain possible.
								</p>
							</div>
						</div>
					</div>
				</section>

				<section id="proof" className="bg-paper py-20 text-ink lg:py-32">
					<div className="mx-auto max-w-[1440px] px-5 lg:px-10">
						<div className="grid gap-14 lg:grid-cols-[0.78fr_1.22fr]">
							<SectionHeading
								number="04"
								eyebrow="Independent proof"
								title="Do not trust the interface. Verify the system."
								copy="The core identity, contracts, source code, and decision evidence can be inspected without relying on MolQ's frontend."
								dark
							/>
							<div className="proof-list border-t border-ink/20">
								<ProofRow
									title="ERC-8004 identity"
									value="Agent #112"
									href={AGENT_URL}
								/>
								<ProofRow
									title="Verified ERC-4626 vault"
									value="0xBcBe...6Eb9"
									href={VAULT_URL}
								/>
								<ProofRow
									title="Verified decision logger"
									value="0x24df...1Be9"
									href={LOGGER_URL}
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

				<section id="economics" className="border-b border-white/10 py-20 lg:py-32">
					<div className="mx-auto grid max-w-[1440px] gap-16 px-5 lg:grid-cols-2 lg:px-10">
						<div>
							<div className="eyebrow">
								<span className="h-2 w-2 bg-signal" />
								Aligned economics
							</div>
							<div className="mt-10 text-[clamp(5rem,12vw,10rem)] font-bold leading-none text-signal">
								10%
							</div>
							<div className="mt-3 text-xl text-white/55">
								of realized vault profit
							</div>
						</div>
						<div className="self-end">
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

				<section id="faq" className="border-b border-white/10 py-20 lg:py-32">
					<div className="mx-auto max-w-[1440px] px-5 lg:px-10">
						<div className="grid gap-14 lg:grid-cols-[0.7fr_1.3fr]">
							<SectionHeading
								number="05"
								eyebrow="FAQ"
								title="Understand it before depositing."
								copy="MolQ is designed to make strategy mechanics and limitations inspectable."
							/>
							<div className="border-t border-white/15">
								{faqs.map((faq, index) => (
									<FaqItem
										key={faq.question}
										{...faq}
										defaultOpen={index === 0}
									/>
								))}
							</div>
						</div>
					</div>
				</section>

				<section className="py-24 lg:py-32">
					<div className="final-cta mx-auto max-w-[1440px] px-5 text-center lg:px-10">
						<Bot className="mx-auto h-10 w-10 text-signal" />
						<h2 className="mx-auto mt-8 max-w-4xl text-5xl font-bold leading-[0.98] sm:text-7xl">
							Put idle USDe to work with accountable intelligence.
						</h2>
						<p className="mx-auto mt-6 max-w-xl text-base leading-7 text-white/55">
							Start with the live vault interface or inspect every contract before
							connecting a wallet.
						</p>
						<div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
							<a href={APP_URL} className="primary-button magnetic justify-center">
								Launch MolQ
								<ArrowRight className="h-4 w-4" />
							</a>
							<a href={DOCS_URL} className="secondary-button magnetic justify-center">
								Read documentation
								<BookOpen className="h-4 w-4" />
							</a>
						</div>
					</div>
				</section>
			</main>

			<Footer />
		</div>
	);
}

function Header({
	menuOpen,
	setMenuOpen,
}: {
	menuOpen: boolean;
	setMenuOpen: (open: boolean) => void;
}) {
	const links = [
		["Product", "#product"],
		["Performance", "#performance"],
		["Security", "#security"],
		["Proof", "#proof"],
		["FAQ", "#faq"],
	];

	return (
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
				<nav className="hidden items-center gap-7 text-sm text-white/60 lg:flex">
					{links.map(([label, href]) => (
						<a key={href} href={href} className="transition hover:text-white">
							{label}
						</a>
					))}
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
					onClick={() => setMenuOpen(!menuOpen)}
					aria-label={menuOpen ? "Close navigation" : "Open navigation"}
					aria-expanded={menuOpen}
				>
					{menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
				</button>
			</div>
			{menuOpen ? (
				<nav className="border-t border-white/10 bg-ink px-5 py-5 md:hidden">
					{links.map(([label, href]) => (
						<a
							key={href}
							href={href}
							onClick={() => setMenuOpen(false)}
							className="block border-b border-white/10 py-4 text-sm text-white/70"
						>
							{label}
						</a>
					))}
					<a href={APP_URL} className="primary-button mt-5 w-full justify-center">
						Launch app
						<ArrowRight className="h-4 w-4" />
					</a>
				</nav>
			) : null}
		</header>
	);
}

function AgentTerminal({
	dataState,
	dashboard,
	latestDecision,
}: {
	dataState: "loading" | "live" | "unavailable";
	dashboard: Dashboard | null;
	latestDecision: Dashboard["decisions"][number] | undefined;
}) {
	const action = latestDecision?.action.replaceAll("_", " ").toUpperCase();
	return (
		<div className="terminal agent-terminal relative w-full max-w-full min-w-0 overflow-hidden border border-white/15 bg-[#0a0d0a]">
			<div className="terminal-scanline" aria-hidden="true" />
			<div className="flex h-11 items-center justify-between border-b border-white/10 px-4">
				<div className="flex items-center gap-2 text-xs text-white/45">
					<span
						className={`h-2 w-2 ${
							dataState === "live" ? "animate-pulse bg-signal" : "bg-white/25"
						}`}
					/>
					MOLQ / AGENT POLICY
				</div>
				<DataBadge state={dataState} />
			</div>
			<div className="p-5 font-mono text-xs sm:p-6">
				<div className="terminal-entry hidden sm:block">
					<TerminalLine label="identity" value="erc8004:112" />
					<TerminalLine label="vault" value="ERC-4626 / Mantle" />
					<TerminalLine
						label="shield"
						value={`Aave V3 / ${dashboard?.portfolio.allocation.shieldPercent ?? 85}%`}
					/>
					<TerminalLine
						label="alpha"
						value={`Bybit / capped ${dashboard?.portfolio.allocation.alphaPercent ?? 15}%`}
					/>
					<div className="my-5 h-px bg-white/10" />
				</div>
				<div className="terminal-entry text-white/35">latest_decision</div>
				<div className="terminal-entry mt-3 text-lg text-signal">
					{action ?? (dataState === "loading" ? "SYNCING" : "NO LIVE DECISION")}
				</div>
				<p className="terminal-entry mt-3 max-w-md break-words font-sans text-sm leading-6 text-white/55">
					{latestDecision?.reason ??
						(dataState === "unavailable"
							? "The API is unavailable. Verify historical evidence directly on Mantlescan."
							: "Reading vault state and recent policy evidence.")}
				</p>
				<a
					href={
						latestDecision?.txHash
							? `https://mantlescan.xyz/tx/${latestDecision.txHash}`
							: LOGGER_URL
					}
					target="_blank"
					rel="noreferrer"
					className="terminal-entry mt-6 flex items-center gap-2 text-white/45 transition hover:text-signal"
				>
					<Check className="h-3.5 w-3.5 text-signal" />
					<span>
						{latestDecision?.txHash
							? "verify latest decision"
							: "inspect decision logger"}
					</span>
				</a>
			</div>
		</div>
	);
}

function MetricCell({
	label,
	value,
	status,
}: {
	label: string;
	value: string;
	status?: "loading" | "live" | "unavailable";
}) {
	return (
		<div className="metric-cell border-b border-r border-white/10 px-5 py-5">
			<div className="flex items-center justify-between gap-3">
				<span className="text-xs uppercase text-white/35">{label}</span>
				{status ? <DataBadge state={status} compact /> : null}
			</div>
			<div className="mt-2 font-mono text-sm">{value}</div>
		</div>
	);
}

function DataBadge({
	state,
	dark = false,
	compact = false,
}: {
	state: "loading" | "live" | "unavailable";
	dark?: boolean;
	compact?: boolean;
}) {
	const label = state === "live" ? "Live" : state === "loading" ? "Syncing" : "Unavailable";
	return (
		<span
			className={`inline-flex items-center gap-1.5 font-mono uppercase ${
				compact ? "text-[8px]" : "text-[9px]"
			} ${dark ? "text-ink/50" : "text-white/35"}`}
		>
			<span
				className={`h-1.5 w-1.5 ${
					state === "live"
						? "bg-[#709b48]"
						: state === "loading"
							? "bg-[#ffcc66]"
							: "bg-white/25"
				}`}
			/>
			{label}
		</span>
	);
}

function IntegrationLogo({ src, name }: { src: string; name: string }) {
	return (
		<div className="flex h-8 items-center gap-2.5">
			<img
				src={src}
				alt=""
				className="h-6 w-7 object-contain brightness-0 invert opacity-55"
			/>
			<span className="text-sm font-bold text-white/55">{name}</span>
		</div>
	);
}

function AllocationRow({
	label,
	value,
	apy,
	amount,
	color,
}: {
	label: string;
	value: number;
	apy: string;
	amount: string;
	color: string;
}) {
	return (
		<div>
			<div className="flex flex-wrap items-end justify-between gap-3">
				<div>
					<div className="text-sm font-bold">{label}</div>
					<div className="mt-1 font-mono text-xs text-ink/45">{amount} deployed</div>
				</div>
				<div className="text-right">
					<div className="font-mono text-lg font-bold">{value}%</div>
					<div className="text-xs text-ink/45">{apy} input APY</div>
				</div>
			</div>
			<div className="mt-4 h-2 overflow-hidden bg-ink/10">
				<div className={`allocation-fill h-full ${color}`} style={{ width: `${value}%` }} />
			</div>
		</div>
	);
}

function LightMetric({ label, value }: { label: string; value: string }) {
	return (
		<div className="border-b border-r border-ink/15 p-4">
			<div className="text-[10px] uppercase text-ink/45">{label}</div>
			<div className="mt-2 font-mono text-lg font-bold">{value}</div>
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
	eyebrow,
	title,
	copy,
	dark = false,
}: {
	number: string;
	eyebrow: string;
	title: string;
	copy: string;
	dark?: boolean;
}) {
	return (
		<div className="section-heading max-w-3xl">
			<div
				className={`flex items-center gap-3 font-mono text-xs ${dark ? "text-ink/40" : "text-signal"}`}
			>
				<span>/{number}</span>
				<span className={dark ? "text-ink/35" : "text-white/35"}>{eyebrow}</span>
			</div>
			<h2 className="mt-5 text-4xl font-bold leading-[1.02] sm:text-6xl">{title}</h2>
			<p
				className={`mt-6 max-w-2xl text-base leading-7 ${dark ? "text-ink/60" : "text-white/52"}`}
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

function FaqItem({
	question,
	answer,
	defaultOpen,
}: {
	question: string;
	answer: string;
	defaultOpen: boolean;
}) {
	const [open, setOpen] = useState(defaultOpen);
	return (
		<div className="border-b border-white/15">
			<button
				type="button"
				className="flex w-full items-center justify-between gap-5 py-6 text-left"
				onClick={() => setOpen(!open)}
				aria-expanded={open}
			>
				<span className="text-lg font-bold sm:text-xl">{question}</span>
				<ChevronDown
					className={`h-5 w-5 shrink-0 text-signal transition-transform duration-300 ${
						open ? "rotate-180" : ""
					}`}
				/>
			</button>
			<div className={`faq-answer ${open ? "is-open" : ""}`}>
				<p className="max-w-2xl pb-6 text-sm leading-7 text-white/55">{answer}</p>
			</div>
		</div>
	);
}

function Footer() {
	return (
		<footer className="border-t border-white/10">
			<div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr] lg:px-10">
				<div>
					<div className="flex items-center gap-3">
						<img src="/android-chrome-192x192.png" alt="" className="h-9 w-9" />
						<span className="text-lg font-bold">MolQ</span>
					</div>
					<p className="mt-4 max-w-sm text-sm leading-6 text-white/45">
						Autonomous USDe yield with deterministic policy controls and verifiable
						decisions on Mantle.
					</p>
				</div>
				<FooterColumn
					title="Product"
					links={[
						["Launch app", APP_URL],
						["Performance", "#performance"],
						["Security", "#security"],
						["FAQ", "#faq"],
					]}
				/>
				<FooterColumn
					title="Verify"
					links={[
						["Vault contract", VAULT_URL],
						["Decision logger", LOGGER_URL],
						["Agent identity", AGENT_URL],
						["GitHub", GITHUB_URL],
					]}
				/>
			</div>
			<div className="mx-auto flex max-w-[1440px] flex-col gap-3 border-t border-white/10 px-5 py-6 text-xs text-white/35 sm:flex-row sm:justify-between lg:px-10">
				<span>MolQ / Mantle mainnet / Experimental software</span>
				<span>Yield is variable. Capital is at risk.</span>
			</div>
		</footer>
	);
}

function FooterColumn({ title, links }: { title: string; links: string[][] }) {
	return (
		<div>
			<div className="font-mono text-[10px] uppercase text-white/30">{title}</div>
			<div className="mt-4 space-y-3">
				{links.map(([label, href]) => (
					<a
						key={label}
						href={href}
						className="block text-sm text-white/55 transition hover:text-white"
					>
						{label}
					</a>
				))}
			</div>
		</div>
	);
}

function money(value: number): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: value < 1_000 ? 2 : 0,
		notation: value >= 1_000_000 ? "compact" : "standard",
	}).format(value);
}

function percent(value: number): string {
	return `${value.toFixed(2)}%`;
}
