#!/bin/bash
cd /Users/paranjay/Developer/youtubeiptv
export CI=true
export GIT_TERMINAL_PROMPT=0
export GIT_ASKPASS=true

TOKEN=$(gh auth token 2>/dev/null)
if [ -z "$TOKEN" ]; then
  echo "ERROR: No token"
  exit 1
fi

mkdir -p ~/.git-credentials-temp
echo "https://x-access-token:${TOKEN}@github.com" > ~/.git-credentials-temp/creds
git config credential.helper "store --file=~/.git-credentials-temp/creds"

git push origin main 2>&1
EXIT=$?

git config --global credential.helper '!/Users/paranjay/.local/bin/gh auth git-credential'
rm -rf ~/.git-credentials-temp

echo "PUSH_EXIT=$EXIT"
exit $EXIT
