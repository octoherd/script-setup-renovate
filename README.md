# setup renovate

> An [octoherd](https://github.com/octoherd) script to setup renovate

At this point, this script adds / updates a repository's `package.json` file. Repositories without a `package.json` file in the root folder are ignored. Currently only the `extends` option is supported, but in theory all [Renovate Configuration Options](https://docs.renovatebot.com/configuration-options/) could be supported.

## Usage

```
$ npx @octoherd/script-setup-renovate \
  --octoherd-token 0123456789012345678901234567890123456789 \
  script-setup-renovate/script.js \
  "octokit/*" \
  --extends "github>octokit/.github"
```

## Licenses

[ISC](LICENSE.md)
