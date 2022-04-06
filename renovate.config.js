const branchName = "auto-dep-update";

module.exports = {
  branchPrefix: `${branchName}/`,
  enabledManagers: ["github-actions", "npm"],
  gitAuthor: "Dependency Bot <devbot@roxtra.com>",
  logLevel: "info",
  onboarding: true,
  onboardingBranch: `${branchName}/configure`,
  platform: "github",
  schedule: ["after 9am and before 5pm on Wednesday"],
  regexManagers: [],
  repositories: ["roXtra/services"],
  rebaseWhen: "behind-base-branch",
  ignoreDeps: [],
  packageRules: [
    {
      matchPackageNames: ["renovatebot/github-action"],
      // Reduce stability days for renovate bot updates for itself as they update regularly and otherwise, it would never update itself
      stabilityDays: 1,
    },
    {
      matchPackageNames: ["node", "@types/node"],
      allowedVersions: "^16.0.0",
    },
    {
      matchPackageNames: ["npm"],
      allowedVersions: "^8.0.0",
    },
    {
      matchPackageNames: ["react", "react-dom"],
      allowedVersions: "^17.0.0",
    },
    {
      // Version 3 is ESM only, see https://rossmanith.atlassian.net/browse/EF-1945
      matchPackageNames: ["node-fetch", "@types/node-fetch"],
      allowedVersions: "^2.0.0",
    },
  ],
};
