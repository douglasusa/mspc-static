# MSPC Static Snapshot

This repository contains a snapshot of the static site hosted at https://mspc.fundraising.netlify.app

What I created for you now:

- download_and_commit.sh — a helper script that mirrors the site locally (using wget), copies the mirrored files into this repository, commits them, and pushes to GitHub. Run it from a machine with git and wget installed.
- README.md — this file (updated) with instructions and notes.
- .gitignore — ignores common temp files.

Choices applied for this snapshot:

- Commit timestamps: No — file timestamps will reflect commit time.
- Large files: Skip — the helper script does not enable Git LFS; if any files exceed GitHub's 100 MB limit the script will fail and report the offending files.
- Single initial commit: When you run the helper script it will create a single commit named "Add static snapshot of <site>".

How to produce the snapshot locally and push it into this repository

1. Clone this repo locally:

   git clone https://github.com/douglasusa/mspc-static.git
   cd mspc-static

2. Make the helper script executable and run it:

   chmod +x download_and_commit.sh
   ./download_and_commit.sh

The script will:
- create a temporary workspace
- mirror https://mspc.fundraising.netlify.app using wget (HTML, CSS, JS, images, PDFs)
- copy the mirrored files into the repo (preserving directory structure)
- commit and push a single commit to the main branch

Notes and troubleshooting

- If wget is blocked by the site (robots.txt) you may need to adjust the wget flags or contact the site owner.
- If the push fails due to very large files (>100 MB), remove those files from the mirrored output and re-run the script, or enable Git LFS and re-run.
- The script uses the host-based directory that wget produces (e.g. mspc.fundraising.netlify.app). If the directory name differs, inspect the temporary folder printed by the script to find the mirrored files.

If you’d like, I can also:
- Run the mirror and commit for you if you upload a zipped site archive here.
- Add a GitHub Action to deploy this snapshot to GitHub Pages.

-- Copilot
