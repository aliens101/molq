import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ReactDOM from "react-dom/client";
import { WagmiProvider } from "wagmi";
import App from "./App";
import "./assets/main.css";
import { web3Config } from "./molq/web3";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
	<WagmiProvider config={web3Config}>
		<QueryClientProvider client={queryClient}>
			<App />
		</QueryClientProvider>
	</WagmiProvider>,
);
