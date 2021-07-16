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
      matchPackageNames: ["node", "@types/node"],
      allowedVersions: "^14.0.0",
    },
    {
      matchPackageNames: ["npm"],
      allowedVersions: "^6.0.0",
    },
  ],
};
