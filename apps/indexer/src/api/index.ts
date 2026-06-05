import { client, graphql } from "ponder";
import { db } from "ponder:api";
import schema from "ponder:schema";
import { Hono } from "hono";

const app = new Hono();

app.get("/molq/health", (context) => {
	return context.json({ status: "ok", service: "molq-indexer", chainId: 5000 });
});

app.use("/sql/*", client({ db, schema }));
app.use("/", graphql({ db, schema }));
app.use("/graphql", graphql({ db, schema }));

export default app;
