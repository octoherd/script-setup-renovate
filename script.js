import { composeCreateOrUpdateTextFile } from "@octokit/plugin-create-or-update-text-file";

/**
 * Setup renovate by adding `{"renovate": {"extends": "..."}}` to the package.json
 *
 * @param {import('@octoherd/cli').Octokit} octokit
 * @param {import('@octoherd/cli').Repository} repository
 * @param { {extends: string} } options Custom user options passed to the CLI
 */
export async function script(octokit, repository, options) {
  if (!options.extends) {
    throw new Error("--extends is required");
  }

  if (!repository.owner) {
    throw new Error("repository must have an 'owner' associated");
  }

  const owner = repository.owner.login;
  const repo = repository.name;
  const path = "package.json";

  if (repository.archived) {
    octokit.log.info(
      { owner, repo, updated: false },
      `${repository.html_url} is archived`
    );
    return;
  }

  let currentExtends;

  const {
    updated,
    data: { commit },
  } = await composeCreateOrUpdateTextFile(octokit, {
    owner,
    repo,
    path,
    content: ({ exists, content }) => {
      let pkg;

      if (!exists) {
        pkg = {};
      } else {
        pkg = JSON.parse(content);
      }

      if (!pkg.renovate) {
        pkg.renovate = {};
      }

      const newExtends = options.extends.split(/\s*,\s*/);
      currentExtends = pkg.renovate.extends;

      if (
        currentExtends &&
        newExtends.sort().join(",") === currentExtends.sort().join(",")
      ) {
        octokit.log.info(
          { owner, repo, currentExtends, updated: false },
          `"extends" is already set to "${JSON.stringify(currentExtends)}" in ${
            repository.html_url
          }`
        );

        return content;
      }

      pkg.renovate.extends = newExtends;

      return JSON.stringify(pkg);
    },
    message: "build: renovate setup",
  });

  if (!updated) {
    octokit.log.info(
      { owner, repo, updated },
      `"no changes applied to ${path}`
    );

    return;
  }

  if (currentExtends) {
    octokit.log.warn(
      { owner, repo, currentExtends, updated },
      `Existing "extends" setting was changed from "${JSON.stringify(
        currentExtends
      )}" in ${commit.html_url}`
    );
  } else {
    octokit.log.info(
      { owner, repo, updated },
      `"extends" setting added in ${commit.html_url}`
    );
  }
}
