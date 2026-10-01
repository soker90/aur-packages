#!/usr/bin/env bash
set -euo pipefail

branch="${1:-}"
title="${2:-}"
body="${3:-}"

if [[ -z "$branch" || -z "$title" || -z "$body" ]]; then
  echo "Usage: $0 <branch> <title> <body>" >&2
  exit 2
fi

git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"

git push --force origin "HEAD:$branch"

pr="$(gh pr list \
  --head "$branch" \
  --base master \
  --state open \
  --json number \
  --jq '.[0].number')"

if [[ -z "$pr" ]]; then
  pr="$(gh pr create \
    --base master \
    --head "$branch" \
    --title "$title" \
    --body "$body")"
else
  gh pr edit "$pr" --title "$title" --body "$body"
fi

gh pr merge "$pr" --auto --squash
