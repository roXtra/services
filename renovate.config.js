const branchName = 'auto-dep-update';

module.exports = {
  branchPrefix: `${branchName}/`,
  enabledManagers: ['github-actions', 'regex', 'npm'],
  gitAuthor: 'Dependency Bot <devbot@roxtra.com>',
  logLevel: 'info',
  onboarding: true,
  onboardingBranch: `${branchName}/configure`,
  platform: 'github',
  schedule: ["after 6am and before 5pm on Wednesday"],
  regexManagers: [
    {
      datasourceTemplate: 'github-tags',
      fileMatch: ['^\\.github/workflows/[^/]+\\.ya?ml$'],
      matchStrings: ['uses: (?<depName>.*?)@(?<currentValue>.*?)\\s'],
    },
  ],
  repositories: [
    'roXtra/services',
  ],
  rebaseWhen: "behind-base-branch",
  ignoreDeps: [],
  packageRules: [
    {
      packageNames: ["@types/node"],
      allowedVersions: "^12.0.0"
    }
  ]
};