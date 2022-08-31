# setup renovate

> An [octoherd](https://github.com/octoherd) script to setup renovate

At this point, this script adds / updates a repository's `package.json` file. Repositories without a `package.json` file in the root folder are ignored. Currently only the `extends` option is supported, but in theory all [Renovate Configuration Options](https://docs.renovatebot.com/configuration-options/) could be supported.

## Usage

```
npx @octoherd/script-setup-renovate \
  --extends "github>octoherd/.github"
```

Pass all options as CLI flags to avoid user prompts

```
npx @octoherd/script-setup-renovate \
  --extends "github>octoherd/.github"\
  -T ghp_0123456789abcdefghjklmnopqrstuvwxyzA \
  -R "octoherd/repository-with-script-folders"
```

## Options

| option                       | type             | description                                                                                                                                                                                                                                 |
| ---------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--extends`                  | string           | **Required**. Location from where should inherit settings from, see the [`extends` documentation](https://docs.renovatebot.com/configuration-options/#extends). Example: `--extends "github>octoherd/.github"`                              |
| `--path`                     | string           | File path of the configuration file for Renovate, see the [`Configuration options` documentation](https://docs.renovatebot.com/configuration-options/). Example: `--path ".github/renovate.json"`                                           |
| `--octoherd-token`, `-T`     | string           | A personal access token ([create](https://github.com/settings/tokens/new?scopes=repo)). Script will create one if option is not set                                                                                                         |
| `--octoherd-repos`, `-R`     | array of strings | One or multiple space-separated repositories in the form of `repo-owner/repo-name`. `repo-owner/*` will find all repositories for one owner. `*` will find all repositories the user has access to. Will prompt for repositories if not set |
| `--octoherd-bypass-confirms` | boolean          | Bypass prompts to confirm mutating requests                                                                                                                                                                                                 |

## Licenses

[ISC](LICENSE.md)
