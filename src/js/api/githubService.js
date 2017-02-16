import axios from 'axios';
import Promise from 'bluebird';

const pullRequestData = {
  pullRequests: [],
  failedRepos: []
};

function apiCall(url, headers = {}, config) {
  const options = { headers };
  if (config.username) {
    options.auth = {
      username: config.username,
      password: config.password
    };
  }
  return axios.get(url, options);
}

function loadPullRequest(owner, repo, number, config) {
  const url = `${config.apiBaseUrl}/repos/${owner}/${repo}/pulls/${number}`;
  return apiCall(url, {}, config);
}

function loadPullRequestComments(url, config) {
  if (typeof config.comments === 'undefined') {
    return Promise.resolve({
      data: []
    });
  }
  return apiCall(url, {}, config);
}

function loadPullRequestReactions(owner, repo, number, config) {
  if (config.reactions === false) {
    return Promise.resolve({
      data: []
    });
  }
  const url = `${config.apiBaseUrl}/repos/${owner}/${repo}/issues/${number}/reactions`;
  return apiCall(url, { Accept: 'application/vnd.github.squirrel-girl-preview' }, config);
}

function loadCommitStatus(owner, repo, sha, config) {
  const url = `${config.apiBaseUrl}/repos/${owner}/${repo}/commits/${sha}/status`;
  return apiCall(url, {}, config);
}

export function getPullRequestDetails(owner, repo, number) {
  return loadPullRequest(owner, repo, number).then(pullRequest => {
    const { _links, head } = pullRequest.data;
    return Promise.all([
      loadPullRequestComments(_links.comments.href),
      loadPullRequestReactions(owner, repo, number),
      loadCommitStatus(owner, repo, head.sha)
    ]).then(([comments, reactions, status]) =>
      Object.assign(pullRequest.data, {
        computedComments: comments.data,
        computedReactions: reactions.data,
        status: status.data
      })
    );
  });
}

function loadPullRequests(owner, repo, config) {
  const url = `${config.apiBaseUrl}/repos/${owner}/${repo}/pulls`;
  const promise = apiCall(url);
  promise.catch(() => pullRequestData.failedRepos.push(`${owner}/${repo}`));
  return promise;
}

export function getAllPullRequests(repoNames, config) {
  pullRequestData.failedRepos = [];

  const promises = repoNames.map(repoName => {
    const [owner, repo] = repoName.split('/');
    return Promise.resolve(loadPullRequests(owner, repo)).reflect();
  });

  return Promise.all(promises).then(results => {
    let pullRequests = [];

    results.forEach(result => {
      if (result.isFulfilled()) {
        pullRequests = pullRequests.concat(result.value().data);
      }
    });

    if (config.groupByRepo === true) {
      pullRequests.sort((a, b) => b.base.repo.name < a.base.repo.name
      && new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    } else {
      pullRequests.sort((a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    }

    pullRequestData.pullRequests = pullRequests;
    return pullRequestData;
  });
}
