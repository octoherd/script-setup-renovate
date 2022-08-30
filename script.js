/**
 * Setup renovate by adding `{"renovate": {"extends": "..."}}` to the package.json
 *
 * @param {import('@octoherd/cli').Octokit} octokit
 * @param {import('@octoherd/cli').Repository} repository
 * @param { {extends: string} } options Custom user options passed to the CLI
 */
export async function script(octokit, repository, options) {
  if (!options.extends) {
    throw new Error(`--extends is required`);
  }

  if (!repository.owner) {
    throw new Error(`repository must have an 'owner' associated`);
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

  // @ts-expect-error expects { sha } to be present when status 404 (see #6)
  const { pkg, sha } = await octokit
    .request("GET /repos/{owner}/{repo}/contents/{path}", {
      owner,
      repo,
      path,
    })
    .then(
      (response) => {
        //https://github.com/github/rest-api-description/issues/165
        if (Array.isArray(response.data) || response.data.type !== "file") {
          throw new Error("package.json should be a file not a dir");
        }

        if (response.data.type === "file") {
          return {
            pkg: JSON.parse(
              //@ts-expect-error
              //https://github.com/github/rest-api-description/issues/165
              Buffer.from(response.data.content, "base64").toString()
            ),
            sha: response.data.sha,
          };
        } else {
          throw new Error(
            `package.json should be a file not a ${response.data.type}`
          );
        }
      },
      (error) => {
        if (error.status === 404) return { pkg: false };
        throw error;
      }
    );

  if (!pkg) {
    octokit.log.info(
      { owner, repo, updated: false },
      `no package.json file in ${repository.html_url}`
    );
    return;
  }

  if (!pkg.renovate) {
    pkg.renovate = {};
  }

  const newExtends = options.extends.split(/\s*,\s*/);
  const currentExtends = pkg.renovate.extends;

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
    return;
  }

  pkg.renovate.extends = newExtends;

  const {
    data: { commit },
  } = await octokit.request("PUT /repos/{owner}/{repo}/contents/{path}", {
    owner,
    repo,
    path,
    sha,
    // @ts-expect-error
    content: Buffer.from(JSON.stringify(pkg, null, 2) + "\n").toString(
      "base64"
    ),
    message: `build: renovate setup`,
  });

  if (currentExtends) {
    octokit.log.warn(
      { owner, repo, currentExtends, updated: true },
      `Existing "extends" setting was changed from "${JSON.stringify(
        currentExtends
      )}" in ${commit.html_url}`
    );
  } else {
    octokit.log.info(
      { owner, repo, updated: true },
      `"extends" setting added in ${commit.html_url}`
    );
  }
}
