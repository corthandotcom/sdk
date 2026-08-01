import { CorthanClient, StdLogger } from "../dist/index.mjs";

async function run() {
  console.log("--- Running ESM Consumer Check ---");
  const client = new CorthanClient({
    baseURL: "http://localhost:8080/v1",
    logger: new StdLogger(false)
  });

  const billingRes = await client.billing.getTier();
  if (billingRes.data.tier !== "enterprise") {
    throw new Error("Unexpected tier: " + billingRes.data.tier);
  }
  console.log("ESM Consumer Tier resolved: " + billingRes.data.tier);
  console.log("--- ESM Consumer Check Passed! ---");
}

run().catch((err) => {
  console.error("ESM check failed:", err);
  process.exit(1);
});
