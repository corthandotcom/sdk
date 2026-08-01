import * as React from "react";
import { render } from "@testing-library/react";
import { CorthanProvider, useBilling } from "../dist/index.js";
import { CorthanClient } from "@corthan/sdk";

// Configure JSDOM environment globally for node execution if needed,
// but since we run via ts-node, let's verify if we need to mock window/document.
if (typeof window === "undefined") {
  const { JSDOM } = require("jsdom");
  const jsdom = new JSDOM("<!doctype html><html><body></body></html>");
  (global as any).window = jsdom.window;
  (global as any).document = jsdom.window.document;
  if (!(global as any).navigator) {
    Object.defineProperty(global, "navigator", {
      value: jsdom.window.navigator,
      configurable: true,
      writable: true
    });
  }
  (global as any).React = React;
}

const client = new CorthanClient({
  baseURL: "http://localhost:8080/v1"
});

const SmokeComponent: React.FC = () => {
  const { getTier } = useBilling();

  React.useEffect(() => {
    async function run() {
      console.log("[React Smoke] Triggering getTier hook execution...");
      try {
        const res = await getTier.execute();
        console.log("[React Smoke] Resolved billing tier: " + res.data.tier);
        console.log("--- React SDK Smoke Verification Succeeded! ---");
        process.exit(0);
      } catch (err) {
        console.error("[React Smoke] Hook execution failed:", err);
        process.exit(1);
      }
    }
    run();
  }, [getTier.execute]);

  return React.createElement("div", null, "React Smoke Component Active");
};

async function main() {
  console.log("--- Starting React SDK Smoke Client ---");
  render(
    React.createElement(
      CorthanProvider,
      { client },
      React.createElement(SmokeComponent)
    )
  );
}

main().catch((err) => {
  console.error("React smoke script failed:", err);
  process.exit(1);
});
