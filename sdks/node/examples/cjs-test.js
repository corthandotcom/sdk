const { CorthanClient, StdLogger } = require("../dist/index.js");

async function run() {
  console.log("--- Running CommonJS Consumer Check ---");
  const client = new CorthanClient({
    baseURL: "http://localhost:8080/v1",
    logger: new StdLogger(false)
  });

  const billingRes = await client.billing.getTier();
  if (billingRes.data.tier !== "enterprise") {
    throw new Error("Unexpected tier: " + billingRes.data.tier);
  }
  console.log("CommonJS Consumer Tier resolved: " + billingRes.data.tier);
  console.log("--- CommonJS Consumer Check Passed! ---");
}

run().catch((err) => {
  console.error("CommonJS check failed:", err);
  process.exit(1);
});
