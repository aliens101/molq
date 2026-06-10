module.exports = {
	apps: [
		{
			name: "molq-api",
			cwd: "/home/cuyvps/apps/molq/apps/api",
			script: "./node_modules/.bin/tsx",
			args: "src/server.ts",
			interpreter: "none",
			env: {
				NODE_ENV: "production",
				HOST: "127.0.0.1",
				PORT: "8070",
			},
			autorestart: true,
			max_memory_restart: "500M",
			time: true,
		},
		{
			name: "molq-indexer",
			cwd: "/home/cuyvps/apps/molq/apps/indexer",
			script: "./node_modules/.bin/ponder",
			args: "start --port 8071 --schema molq",
			interpreter: "none",
			env: {
				NODE_ENV: "production",
				CHOKIDAR_USEPOLLING: "true",
				CHOKIDAR_INTERVAL: "1000",
			},
			autorestart: true,
			max_memory_restart: "1G",
			time: true,
		},
	],
};
