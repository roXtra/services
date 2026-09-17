# Kendo package review and validation

Checked on 2026-09-17 against `origin/master` at `9f95f6a65`.

## Dependency audit

All 25 tracked `package.json` files and their lockfiles were reviewed, together with the repository's Renovate configuration and npm settings.

The registry check was `npm view @progress/kendo-ooxml version dependencies --json`.

| Location          | Package                 | Declared range | Installed version | npm `latest` |
| ----------------- | ----------------------- | -------------- | ----------------- | ------------ |
| `autoexceldeploy` | `@progress/kendo-ooxml` | `^1.9.5`       | `1.9.5`           | `1.9.5`      |

The OOXML package is already on the latest stable npm release. No other `@progress/kendo-*` package occurs in the tracked manifests or lockfiles. There are no Kendo-specific
exact-version pins, overrides, resolutions, ignored dependencies, or Renovate version restrictions to remove. The existing caret range permits compatible updates, and Renovate
remains able to propose major updates. The general five-day release-age policy is unchanged.

The SDK is consumed through its existing release archives: `9.144.0-1` at the repository root and `9.144.0` by the services. The release archive has no runtime Kendo
dependency. No SDK release or package-lock regeneration is needed for this repository's Kendo review.

## Build-script fixes and npm 12 installation restriction

Validation used Node.js `24.19.0` and npm `12.0.2`, which satisfy the repository's engine declarations. The host's default npm `10.8.2` is below that declared range; use npm
11 or 12 for reproduction.

The `autoexceldeploy` and `docusign` build scripts contain PowerShell syntax, but their `.npmrc` files omitted `script-shell=pwsh`. This change adds the setting already
present in the other services. Dependency versions are unchanged.

A fresh installation with npm 12 remains blocked in these three projects:

| Project           | Reproduction                      | Failure                                                                                                       |
| ----------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `autoexceldeploy` | `npm ci` in the service directory | `EALLOWREMOTE`: refuses the declared SheetJS archive at `https://cdn.sheetjs.com/xlsx-0.20.2/xlsx-0.20.2.tgz` |
| `docusign`        | `npm ci` in the service directory | `EALLOWREMOTE`: refuses the declared `processhub-sdk` release archive                                         |
| `oracle`          | `npm ci` in the service directory | `EALLOWREMOTE`: refuses the declared `processhub-sdk` release archive                                         |

npm 12 defaults `allow-remote` to `none`, which rejects tarball URLs outside the configured registry. These three projects have existing direct archive dependencies and omit
the explicit archive allowance present in the other projects.

For diagnosis, these three services were temporarily configured with `allow-remote=root`; their locked dependencies then installed and the builds and tests below passed. The
automatic approval review subsequently rejected committing those persistent settings because they broaden npm's remote-package policy without explicit authorization for that
security-setting change. All three temporary settings were removed from the final changes. Oracle's configuration is unchanged.

Consequently, the source/build verification below succeeded with prepared dependencies, but a fresh npm 12 installation of the final branch is not fully verified as passing.
Completing that installation requires an explicitly approved policy for the existing archive dependencies or a separately reviewed dependency distribution change. No npm
security policy is relaxed by this PR.

## Automated validation

The service checks use `npm ci` in the root and each service directory, followed by `npm run lint`, `npm run build`, and `npm test` in each service. The root format command is
`npm run check:format`. These are the checks performed by `buildScript.js`, without its preliminary `npm install --save` step that rewrites dependency resolution.

The root `npm test` command is an explicit placeholder that exits with an error; the actual tests are the individual services' Mocha suites.

The affected `autoexceldeploy` service passes lint, TypeScript compilation, webpack production bundling, and all **54 tests**. These tests include workbook parsing, hyperlink
formulas, column order, dates, filtering, sorting, and the service's field-to-workbook conversions.

The MySQL pipeline test also passes against an isolated Docker `mysql:8.4` container using `mysql/test/testfiles/setup.sql` and `npm --prefix mysql run test:pipeline`. It
creates a table, inserts a row, queries it, and checks the returned field value. The temporary container was removed after the test.

With the prepared dependency trees described above, all 24 service directories pass their lint, build, and test commands, with **144 passing tests** in total, plus the
separate MySQL integration test. The root and the other 21 services install successfully with their unchanged npm settings. The root format check also passes. No source build
or test failure remains; the three npm 12 installation restrictions above remain unresolved in the final branch.

| Service         | Lint   | Build  | Passing tests |
| --------------- | ------ | ------ | ------------- |
| antragsnr       | Passed | Passed | 3             |
| autoexceldeploy | Passed | Passed | 54            |
| complaintnr     | Passed | Passed | 3             |
| csv             | Passed | Passed | 1             |
| datatable       | Passed | Passed | 6             |
| docusign        | Passed | Passed | 7             |
| ics             | Passed | Passed | 1             |
| intrafox        | Passed | Passed | 3             |
| math            | Passed | Passed | 30            |
| mssql           | Passed | Passed | 1             |
| mysql           | Passed | Passed | 1             |
| noop            | Passed | Passed | 2             |
| oracle          | Passed | Passed | 1             |
| report          | Passed | Passed | 7             |
| roxFile         | Passed | Passed | 4             |
| sap             | Passed | Passed | 0             |
| servicetemplate | Passed | Passed | 3             |
| setrole         | Passed | Passed | 1             |
| setsupervisor   | Passed | Passed | 1             |
| sharepoint      | Passed | Passed | 2             |
| skribble        | Passed | Passed | 7             |
| startinstance   | Passed | Passed | 2             |
| systemsettings  | Passed | Passed | 1             |
| triggerwebhook  | Passed | Passed | 3             |

Coverage limits: SAP's test source contains only commented-out examples, so its test command exits successfully with **zero tests**. Its lint and TypeScript build are checked,
but no SAP/HANA interaction is claimed. Other connector tests include mocks and bundle smoke checks; live external systems are outside this local run. Existing nonfatal lint
warnings remain in CSV, ICS, Oracle, setrole, and startinstance. No Kendo source or dependency versions were changed to suppress them.

## Manual acceptance test

Use a test installation of ProcessHub with the upgraded Kendo frontend and the normal matching SDK/service release. Do not trigger production integrations.

1. Add the **autoexceldeploy** service to a test process. Open its configuration, select a process and a public view, choose the target attachment field and an optional
   filename field, then save and reopen the configuration. Verify that each selection is preserved and that the controls open and respond to keyboard navigation without
   browser-console errors.
2. Use a public view containing text, numbers, dates, file uploads, hyperlinks, and, where available, risk colors/trends. Give its columns a non-default order and width, and
   set a filter and sort order. Run the process and download the generated `.xlsx` attachment.
3. Open the attachment in Excel. It must open without a repair dialog. Compare row filtering/sorting, column order/width, header titles, dates and numbers, decoded attachment
   names, hyperlinks, and risk formatting against the view. Verify the optional filename and automatic `.xlsx` suffix.
4. Repeat with an empty result set and with non-ASCII text. Confirm that a valid workbook is still generated and attached to the configured target field.
5. Open and save configuration dialogs for representative services such as CSV, data table, and start instance in the upgraded ProcessHub UI. Verify that existing saved values
   are preserved. For external connectors, use their dedicated test credentials and test systems.

The automated OOXML tests validate generated workbook contents; they do not replace the browser and Excel checks above.
