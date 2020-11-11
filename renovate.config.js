const branchName = 'auto-dep-update';

module.exports = {
  branchPrefix: `${branchName}/`,
  enabledManagers: ['github-actions', 'npm'],
  gitAuthor: 'Dependency Bot <devbot@roxtra.com>',
  logLevel: 'info',
  onboarding: true,
  onboardingBranch: `${branchName}/configure`,
  platform: 'github',
  schedule: ["after 6am and before 5pm on Wednesday"],
  regexManagers: [],
  repositories: [
    'roXtra/services',
  ],
  rebaseWhen: "behind-base-branch",
  stabilityDays: 14,
  prCreation: "not-pending",
  ignoreDeps: [],
  packageRules: [
    {
      packageNames: ["@types/node"],
      allowedVersions: "^12.0.0"
    },
    {
      packageNames: ["semantic-ui-react"],
      allowedVersions: "0.88.2"
    }
  ]
};