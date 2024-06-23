## 🏷️ PR Label Checker

[![GitHub Release][releases-shield]][releases]
![Project Stage][project-stage-shield]
![Project Maintenance][maintenance-shield]
[![License][license-shield]](LICENSE)

[![Test Status][test-shield]][test-url]
[![Code Coverage][codecov-shield]][codecov-url]

This GitHub Action is created to validate pull requests based on predefined labels.

By specifying valid and/or invalid labels, this action ensures that pull requests are labeled consistently according to your project standards. If a pull request does not contain at least one valid label or if it contains any invalid labels, the action will fail and providing clear error messages.

### Features

- **Label Validation**: Ensures that a pull request has at least one valid label and no invalid labels.
- **Detailed Error Messages**: Provides clear error messages when no valid labels are found or when invalid labels are detected, causing the action to fail.
- **Easy Configuration**: Labels can be easily configured through the action's [input parameters](#inputs).

## Inputs

| Name              | Usage      | Description                                                         |
| ----------------- | ---------- | ------------------------------------------------------------------- |
| `github-token`    | _Required_ | The repository token, i.e. `${{ secrets.GITHUB_TOKEN }}`            |
| `pr-number`       | _Required_ | Pull request number, i.e. `${{ github.event.pull_request.number }}` |
| `valid-labels`    | _Required_ | A comma-separated list of valid labels.                             |
| `invalid-labels`  | _Optional_ | A comma-separated list of invalid labels.                           |

## Outputs

_None. This action does not set any outputs._

## Example workflow

```yaml
name: PR Labels

on:
  pull_request:
    types: [opened, labeled, unlabeled, synchronize]

jobs:
  validate:
    name: Verify
    runs-on: ubuntu-latest
    steps:
      - name: ⤵️ Check out code from GitHub
        uses: actions/checkout@v4
      - name: 🏷 Verify PR has a valid label
        uses: klaasnicolaas/action-pr-labels@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          pr-number: ${{ github.event.pull_request.number }}
          valid-labels: >-
            breaking-change, bugfix, documentation, enhancement
```

## Contributing

This is an active open-source project. We are always open to people who want to
use the code or contribute to it.

We've set up a separate document for our
[contribution guidelines](CONTRIBUTING.md).

Thank you for being involved! :heart_eyes:

## License

Distributed under the **Apache License 2.0** license. See [`LICENSE`](LICENSE) for more information.


<!-- LINKS -->
[codecov-shield]: https://codecov.io/gh/klaasnicolaas/action-pr-labels/branch/main/graph/badge.svg?token=ZWRTTOMS93
[codecov-url]: https://codecov.io/gh/klaasnicolaas/action-pr-labels
[license-shield]: https://img.shields.io/github/license/klaasnicolaas/action-pr-labels.svg
[maintenance-shield]: https://img.shields.io/maintenance/yes/2024.svg
[project-stage-shield]: https://img.shields.io/badge/project%20stage-production%20ready-brightgreen.svg
[releases-shield]: https://img.shields.io/github/release/klaasnicolaas/action-pr-labels.svg
[releases]: https://github.com/klaasnicolaas/action-pr-labels/releases
[test-shield]: https://github.com/klaasnicolaas/action-pr-labels/actions/workflows/tests.yaml/badge.svg
[test-url]: https://github.com/klaasnicolaas/action-pr-labels/actions/workflows/tests.yaml