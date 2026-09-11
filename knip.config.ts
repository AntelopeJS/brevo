import { antelopeKnipConfig } from "@antelopejs/tooling-configs/knip";

export default antelopeKnipConfig({
  // `ajs` comes from @antelopejs/core, which CI installs globally rather than
  // pulling the whole CLI into every module's dependency tree.
  ignoreBinaries: ["ajs"],
  ignoreDependencies: [
    // Mocha's globals (describe/it/before) for the suites `ajs module test` runs;
    // the runner supplies mocha itself, so only the types belong here.
    "@types/mocha",
  ],
});
