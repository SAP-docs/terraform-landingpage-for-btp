const { execFileSync } = require('node:child_process');

// The GitHub client and Actions Toolkit packages are supplied by actions/github-script.
module.exports = async ({ github, context, core, exec }) => {
  if (!context.ref.startsWith('refs/heads/')) {
    throw new Error('Signed data updates require a branch ref.');
  }

  const git = async (...args) => (await exec.getExecOutput('git', args, { silent: true })).stdout;

  await git('add', '-A');
  const changes = await git('diff', '--cached', '--name-status', '--no-renames', '-z');
  if (changes.length === 0) {
    core.info('No changes to commit.');
    return;
  }

  const entries = changes.split('\0');
  const additions = [];
  const deletions = [];
  for (let index = 0; index < entries.length - 1; index += 2) {
    const [status, path] = entries.slice(index, index + 2);
    if (status === 'D') {
      deletions.push({ path });
    } else if (status === 'A' || status === 'M') {
      // Read raw bytes: getExecOutput decodes stdout as text and would corrupt PNGs.
      const contents = execFileSync('git', ['show', `:${path}`], { maxBuffer: 100 * 1024 * 1024 });
      additions.push({ path, contents: contents.toString('base64') });
    } else {
      throw new Error(`Unsupported change ${status}: ${path}`);
    }
  }

  // A concurrent branch update fails this request; there is no automatic rebase/retry.
  // Start a new workflow_dispatch run to check out the latest HEAD and regenerate data.
  const expectedHeadOid = (await git('rev-parse', 'HEAD')).trim();
  const input = {
    branch: {
      repositoryNameWithOwner: `${context.repo.owner}/${context.repo.repo}`,
      branchName: context.ref.slice('refs/heads/'.length),
    },
    expectedHeadOid,
    message: { headline: '[tf_btp bot] Read data and update charts' },
    // Full file contents, including PNGs, are base64 encoded into one request.
    // A growing chart set can exceed GitHub/GHES request-size limits.
    fileChanges: { additions, deletions },
  };

  // GitHub signs this commit as github-actions[bot]; omit custom identity and signature.
  const result = await github.graphql(
    `mutation($input: CreateCommitOnBranchInput!) {
      createCommitOnBranch(input: $input) {
        commit { url signature { isValid } }
      }
    }`,
    { input, request: { timeout: 120000 } },
  );
  const commit = result.createCommitOnBranch.commit;
  if (!commit.signature?.isValid) {
    throw new Error(`Commit signature is not verified: ${commit.url}`);
  }
  core.info(`Created verified signed commit: ${commit.url}`);
};
