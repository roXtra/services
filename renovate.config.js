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
  prConcurrentLimit: 6,
  prHourlyLimit: 6,
  ignoreDeps: [],
  packageRules: [
    {
      matchPackageNames: ["renovatebot/github-action"],
      // Reduce stability days for renovate bot updates for itself as they update regularly and otherwise, it would never update itself
      stabilityDays: 0,
    },
    {
      matchPackageNames: ["node", "@types/node"],
      allowedVersions: "^20.0.0",
    },
    {
      matchPackageNames: ["npm"],
      allowedVersions: "^10.0.0",
    },
    {
      description: "Don't bump engines field in package.json",
      matchPackageNames: ["node", "npm"],
      matchManagers: ["npm"],
      matchDepTypes: ["engines"],
      rangeStrategy: "auto",
    },
    {
      matchPackageNames: ["react", "react-dom", "@types/react"],
      allowedVersions: "^18.0.0",
    },
    {
      // Lock chai in to v4 as v5 is ES Module only
      matchPackageNames: ["chai"],
      allowedVersions: "^4.0.0",
    },
  ],
};
