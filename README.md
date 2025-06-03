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

The following input parameters can be used to configure the action:

### `repo-token`

The GitHub token used to interact with the GitHub API.

- Default: `${{ github.token }}`
- Usage: **Optional**

### `pr-number`

The number of the pull request to validate.

- Default: `${{ github.event.pull_request.number }}`
- Usage: **Optional**

### `valid-labels`

A comma-separated list of valid labels that are allowed on the pull request.

- Default: _None_
- Usage: **Required**

### `invalid-labels`

A comma-separated list of invalid labels that are not allowed on the pull request.

- Default: _None_
- Usage: **Optional**

## Outputs

_None. This action does not set any outputs._

## Example workflow

This example workflows demonstrates a minimal configuration to validate pull requests based on predefined labels. In this example, the action is configured to check for valid labels `breaking-change`, `bugfix`, `documentation`, and `enhancement`.

```yaml
name: PR Labels

on:
  pull_request_target:
    types: [opened, labeled, unlabeled, synchronize]

jobs:
  validate:
    name: Verify
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: read
    steps:
      - name: 🏷 Verify PR has a valid label
        uses: klaasnicolaas/action-pr-labels@v1
        with:
          valid-labels: >-
            breaking-change, bugfix, documentation, enhancement
```

## Full workflow example

This example workflow demonstrates a full example configuration to validate pull requests based on predefined labels. In this example, the action is configured to check for valid labels `breaking-change`, `bugfix`, `documentation`, and `enhancement`. Additionally, it checks for invalid labels `duplicate` and `invalid`.

```yaml
name: PR Labels

on:
  pull_request_target:
    types: [opened, labeled, unlabeled, synchronize]

jobs:
  validate:
    name: Verify
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: read
    steps:
      - name: 🏷 Verify PR has a valid label
        uses: klaasnicolaas/action-pr-labels@v1
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          pr-number: ${{ github.event.pull_request.number }}
          valid-labels: >-
            breaking-change, bugfix, documentation, enhancement
          invalid-labels: >-
            duplicate, invalid
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
[maintenance-shield]: https://img.shields.io/maintenance/yes/2025.svg
[project-stage-shield]: https://img.shields.io/badge/project%20stage-production%20ready-brightgreen.svg
[releases-shield]: https://img.shields.io/github/release/klaasnicolaas/action-pr-labels.svg
[releases]: https://github.com/klaasnicolaas/action-pr-labels/releases
[test-shield]: https://github.com/klaasnicolaas/action-pr-labels/actions/workflows/tests.yaml/badge.svg
[test-url]: https://github.com/klaasnicolaas/action-pr-labels/actions/workflows/tests.yaml