#!/usr/bin/env bash
set -euo pipefail

# Helper script to mirror a site and push the static files into this repo.
# Usage: chmod +x download_and_commit.sh && ./download_and_commit.sh

SITE_URL="https://mspc-fundraising.netlify.app"
REPO_URL="https://github.com/douglasusa/mspc-static.git"

TMPDIR=$(mktemp -d)
echo "Using temp dir: $TMPDIR"
cd "$TMPDIR"

# Mirror the site. Adjust flags if you need to obey robots or change limits.
# --mirror = -r -N -l inf --no-remove-listing
# --page-requisites: get css/js/images needed for display
# --adjust-extension: adds .html where appropriate
# --convert-links: make local links work
# --no-parent: don't ascend to parent dirs
wget --mirror --page-requisites --adjust-extension --convert-links --no-parent "$SITE_URL"

# Find the directory created by wget. Usually it's the hostname.
MIRROR_DIR=$(find . -maxdepth 1 -type d -name "*mspc-fundraising.netlify.app*" -print -quit)
if [ -z "$MIRROR_DIR" ]; then
  echo "Could not find mirrored site directory. Listing temp dir for debugging:" >&2
  ls -la
  exit 1
fi

# Clone the repo (we'll copy files in and commit)
CLONE_DIR=$(mktemp -d)
cd "$CLONE_DIR"

echo "Cloning $REPO_URL into $CLONE_DIR"

git clone "$REPO_URL" .

# Remove everything except .git, .github, LICENSE and this script/README
shopt -s extglob
rm -rf -- !( .git | .github | LICENSE | README.md | download_and_commit.sh | .gitignore ) || true

# Copy mirrored site contents into repo root
cp -r "$TMPDIR/$MIRROR_DIR"/* .

# Check for large files (>100MB)
LARGE_FILES=$(find . -type f -size +100M -print || true)
if [ -n "$LARGE_FILES" ]; then
  echo "Found files >100MB (GitHub will reject these). Please remove them before pushing:" >&2
  echo "$LARGE_FILES" >&2
  exit 2
fi

# Add and commit
git add --all
if git diff --cached --quiet; then
  echo "No changes to commit. Exiting."
  exit 0
fi

COMMIT_MSG="Add static snapshot of $SITE_URL"
git commit -m "$COMMIT_MSG"

echo "Pushing to origin main"
git push origin main

echo "Done. Repository updated with site snapshot."
