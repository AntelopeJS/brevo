import { defineConfig } from "@antelopejs/interface-core/config";

export default defineConfig({
  name: "brevo-playground",
  logging: {
    channelFilter: {
      "*": "INFO",
    },
  },
  modules: {
    brevo: {
      source: {
        type: "local",
        path: "..",
        installCommand: ["pnpm install", "npx tsc"],
      },
      config: {
        apiKey: "",
        defaultSender: {
          email: "email-playground@antelopejs.com",
          name: "AntelopeJS",
        },
      },
    },
    playground: {
      source: {
        type: "local",
        path: ".",
        installCommand: ["pnpm install", "npx tsc"],
      },
    },
  },
  envOverrides: {
    BREVO_API_KEY: "modules.brevo.config.apiKey",
  },
});
