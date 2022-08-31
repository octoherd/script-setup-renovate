import { test } from "uvu";
import { equal, unreachable } from "uvu/assert";
import { Octokit } from "@octoherd/cli";
import { script } from "./script.js";
import { repository } from "./tests/fixtures/respository-example.js";
import nock from "nock";

const getOctokitForTests = () => {
  return new Octokit({
    retry: { enabled: false },
    throttle: { enabled: false },
  });
};

test.before(() => {
  nock.disableNetConnect();
});

test.before.each(() => {
  nock.cleanAll();
});

test.after(() => {
  nock.restore();
});

test("adds 'renovate' entry to package.json if it did not exist", async () => {
  const originalPackageJson = {
    name: "octoherd-cli",
    version: "0.0.0",
    description: "",
    main: "index.js",
    scripts: {
      test: 'echo "Error: no test specified" && exit 1',
    },
    author: "",
    license: "ISC",
  };

  nock("https://api.github.com")
    .get(
      `/repos/${repository.owner.login}/${repository.name}/contents/package.json`
    )
    .reply(200, {
      type: "file",
      sha: "randomSha",
      content: Buffer.from(JSON.stringify(originalPackageJson)).toString(
        "base64"
      ),
    })
    .put(
      `/repos/${repository.owner.login}/${repository.name}/contents/package.json`,
      (body) => {
        const pkg = JSON.parse(Buffer.from(body.content, "base64").toString());

        equal(pkg, {
          ...originalPackageJson,
          renovate: { extends: ["github>octoherd/.github"] },
        });

        return true;
      }
    )
    .reply(200, { commit: { html_url: "link to commit" } });

  await script(getOctokitForTests(), repository, {
    extends: "github>octoherd/.github",
  });
});

test("adds 'extends' entry to 'renovate' entry if it did not exist", async () => {
  const originalPackageJson = {
    name: "octoherd-cli",
    version: "0.0.0",
    description: "",
    main: "index.js",
    scripts: {
      test: 'echo "Error: no test specified" && exit 1',
    },
    author: "",
    license: "ISC",
    renovate: {},
  };

  nock("https://api.github.com")
    .get(
      `/repos/${repository.owner.login}/${repository.name}/contents/package.json`
    )
    .reply(200, {
      type: "file",
      sha: "randomSha",
      content: Buffer.from(JSON.stringify(originalPackageJson)).toString(
        "base64"
      ),
    })
    .put(
      `/repos/${repository.owner.login}/${repository.name}/contents/package.json`,
      (body) => {
        const pkg = JSON.parse(Buffer.from(body.content, "base64").toString());

        equal(pkg, {
          ...originalPackageJson,
          renovate: { extends: ["github>octoherd/.github"] },
        });

        return true;
      }
    )
    .reply(200, { commit: { html_url: "link to commit" } });

  await script(getOctokitForTests(), repository, {
    extends: "github>octoherd/.github",
  });
});

test("replaces 'extends' entry if renovate.extends already existed", async () => {
  const originalPackageJson = {
    name: "octoherd-cli",
    version: "0.0.0",
    description: "",
    main: "index.js",
    scripts: {
      test: 'echo "Error: no test specified" && exit 1',
    },
    author: "",
    license: "ISC",
    renovate: {
      extends: ["github>octokit/.github"],
    },
  };

  nock("https://api.github.com")
    .get(
      `/repos/${repository.owner.login}/${repository.name}/contents/package.json`
    )
    .reply(200, {
      type: "file",
      sha: "randomSha",
      content: Buffer.from(JSON.stringify(originalPackageJson)).toString(
        "base64"
      ),
    })
    .put(
      `/repos/${repository.owner.login}/${repository.name}/contents/package.json`,
      (body) => {
        const pkg = JSON.parse(Buffer.from(body.content, "base64").toString());

        equal(pkg, {
          ...originalPackageJson,
          renovate: { extends: ["github>octoherd/.github"] },
        });

        return true;
      }
    )
    .reply(200, { commit: { html_url: "link to commit" } });

  await script(getOctokitForTests(), repository, {
    extends: "github>octoherd/.github",
  });
});

test("returns if 'extends' entry contains exactly the same entry (even if it's in different order)", async () => {
  const originalPackageJson = {
    name: "octoherd-cli",
    version: "0.0.0",
    description: "",
    main: "index.js",
    scripts: {
      test: 'echo "Error: no test specified" && exit 1',
    },
    author: "",
    license: "ISC",
    renovate: {
      extends: ["github>octokit/.github", "github>octoherd/.github"],
    },
  };

  nock("https://api.github.com")
    .get(
      `/repos/${repository.owner.login}/${repository.name}/contents/package.json`
    )
    .reply(200, {
      type: "file",
      sha: "randomSha",
      content: Buffer.from(JSON.stringify(originalPackageJson)).toString(
        "base64"
      ),
    })
    .put(
      `/repos/${repository.owner.login}/${repository.name}/contents/package.json`,
      () => {
        unreachable("this request should not happen");

        return true;
      }
    )
    .reply(200, { commit: { html_url: "link to commit" } });

  await script(getOctokitForTests(), repository, {
    extends: "github>octoherd/.github,github>octokit/.github",
  });
});

test("throws if --extends option is NOT provided", async () => {
  const octokit = new Octokit({
    retry: { enabled: false },
    throttle: { enabled: false },
  });
  try {
    await script(octokit, repository, { extends: "" });
    unreachable("should have thrown");
  } catch (error) {
    equal(error.message, "--extends is required");
  }

  equal(nock.pendingMocks().length, 0);
});

test("throws if package.json is NOT a file", async () => {
  nock("https://api.github.com")
    .get(
      `/repos/${repository.owner.login}/${repository.name}/contents/package.json`
    )
    .reply(200, {
      sha: "randomSha",
      type: "dir",
    });

  try {
    await script(getOctokitForTests(), repository, {
      extends: "github>octoherd/.github",
    });
    unreachable("should have thrown");
  } catch (error) {
    equal(
      error.message,
      "[@octokit/plugin-create-or-update-text-file] https://api.github.com/repos/octocat/Hello-World/contents/package.json is not a file, but a dir"
    );
  }
});

test("throws if server fails when retrieving package.json", async () => {
  nock("https://api.github.com")
    .get(
      `/repos/${repository.owner.login}/${repository.name}/contents/package.json`
    )
    .reply(500);

  try {
    await script(getOctokitForTests(), repository, {
      extends: "github>octoherd/.github",
    });
    unreachable("should have thrown");
  } catch (error) {
    equal(error.status, 500);
    equal(error.name, "HttpError");
  }
});

test("throws if repository.owner is NOT provided", async () => {
  const repoWithoutOwner = { ...repository, owner: null };

  try {
    await script(getOctokitForTests(), repoWithoutOwner, {
      extends: "github>octoherd/.github",
    });
    unreachable("should have thrown");
  } catch (error) {
    equal(error.message, "repository must have an 'owner' associated");
  }

  equal(nock.pendingMocks().length, 0);
});

test("returns if repository is archived", async () => {
  const respositoryArchived = { ...repository, archived: true };

  try {
    await script(getOctokitForTests(), respositoryArchived, {
      extends: "github>octoherd/.github",
    });
  } catch (error) {
    unreachable("should have NOT thrown");
  }

  equal(nock.pendingMocks().length, 0);
});

test("returns if no package.json file exists in the repository", async () => {
  nock("https://api.github.com")
    .get(
      `/repos/${repository.owner.login}/${repository.name}/contents/package.json`
    )
    .reply(404);

  try {
    await script(getOctokitForTests(), repository, {
      extends: "github>octoherd/.github",
    });
  } catch (error) {
    unreachable("should have NOT thrown");
  }
});

test.run();
