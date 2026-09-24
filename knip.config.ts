import { antelopeKnipConfig } from "@antelopejs/tooling-configs/knip";

export default antelopeKnipConfig({
  ignoreDependencies: [
    // Mocha's globals (describe/it/before) for the suites `ajs module test` runs;
    // the runner supplies mocha itself, so only the types belong here.
    "@types/mocha",
  ],
});
