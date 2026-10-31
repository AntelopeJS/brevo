import type { VerifyConfig } from "@antelopejs/tooling-configs/verify";

import { batchJourneys } from "./journeys-batch.ts";
import { recipientJourneys } from "./journeys-recipients.ts";
import { sendJourneys } from "./journeys-send.ts";
import { smokeJourneys } from "./journeys-smoke.ts";
import { templateJourneys } from "./journeys-templates.ts";
import { BASE_CONFIG } from "./session.ts";

const config: VerifyConfig = {
  doors: {
    data: null,
    format: null,
    contract: {
      globs: ["package.json"],
      funnels: [],
      containments: [],
      why: "the config keys (`apiKey`, `defaultSender`, `emailWhitelist`) and the email interface range `antelopeJs.implements` and `dependencies` declare",
    },
    outbound: {
      globs: ["src/implementations/email/client.ts"],
      funnels: ["src/implementations/email/client.ts"],
      containments: [],
      why: "every email the module sends leaves through this one client to api.brevo.com with the customer's api key: its url, key header and request body decide who receives what",
    },
    exposure: null,
    publish: {
      globs: ["package.json", ".release-it.json", "changelogen.config.json", ".github/workflows/release.yml"],
      funnels: [],
      containments: [],
      why: "the package name and release workflow claim @antelopejs/brevo on npm",
    },
  },
  moduleConfig() {
    return BASE_CONFIG;
  },
  journeys: { ...sendJourneys, ...recipientJourneys, ...templateJourneys, ...batchJourneys, ...smokeJourneys },
};

export default config;
