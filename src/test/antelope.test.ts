import { defineConfig } from "@antelopejs/interface-core/config";

export default defineConfig({
  name: "brevo-test",
  cacheFolder: ".antelope/cache",
  logging: {
    channelFilter: {
      "*": "INFO",
    },
  },
  modules: {
    local: {
      source: { type: "local", path: "." },
      config: {
        apiKey: "",
        defaultSender: {
          email: "email-test@antelopejs.com",
          name: "AntelopeJS Test",
        },
      },
    },
  },
  envOverrides: {
    BREVO_API_KEY: "modules.local.config.apiKey",
  },
  test: {
    folder: "dist/test",
  },
});
