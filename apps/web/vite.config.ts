import { accessSync } from "node:fs";
import path from "path";
import { defineConfig } from "vitest/config";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import react from "@vitejs/plugin-react-swc";

const keyFile = process.env.KEY_FILE;
const certFile = process.env.CERT_FILE;
let ssl = false;

try {
	accessSync(keyFile);
	accessSync(certFile);
	ssl = true;
} catch {
	console.error("No SSL key/cert provided, running in insecure mode");
}

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react(),
		nodePolyfills({
			// To exclude specific polyfills, add them to this list.
			exclude: [
				"fs", // Excludes the polyfill for `fs` and `node:fs`.
			],
			// Whether to polyfill specific globals.
			globals: {
				Buffer: true, // can also be 'build', 'dev', or false
				global: true,
				process: false,
			},
			// Whether to polyfill `node:` protocol imports.
			protocolImports: false,
		}),
	],
	test: {
		environment: "jsdom",
		globals: true,
		setupFiles: "./tests/setup.ts", // assuming the test folder is in the root of our project
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	server: {
		host: "0.0.0.0",
		proxy: {
			"/api": {
				target: process.env.VITE_API_PROXY ?? "http://localhost:8787",
				changeOrigin: true,
			},
		},
		...(ssl
			? {
					https: {
						key: keyFile,
						cert: certFile,
					},
				}
			: {}),
	},
});
