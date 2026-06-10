#!/usr/bin/env bash
set -Eeuo pipefail

readonly REPO_DIR="${MOLQ_REPO_DIR:-/home/cuyvps/apps/molq}"
readonly WEB_ROOT="${MOLQ_WEB_ROOT:-/var/www/molq.site}"
readonly BRANCH="${MOLQ_BRANCH:-main}"
readonly APP_URL="${MOLQ_APP_URL:-https://app.molq.site}"

log() {
	printf '[%s] %s\n' "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" "$*"
}

fail() {
	log "ERROR: $*" >&2
	exit 1
}

on_error() {
	log "Deployment failed on line $1" >&2
}
trap 'on_error "$LINENO"' ERR

command -v git >/dev/null || fail "git is required"
command -v pnpm >/dev/null || fail "pnpm is required"
command -v pm2 >/dev/null || fail "pm2 is required"
command -v rsync >/dev/null || fail "rsync is required"
[[ -d "$REPO_DIR/.git" ]] || fail "Repository not found at $REPO_DIR"
[[ -f "$REPO_DIR/apps/api/.env" ]] || fail "Missing apps/api/.env"
[[ -f "$REPO_DIR/apps/indexer/.env.local" ]] || fail "Missing apps/indexer/.env.local"

cd "$REPO_DIR"
log "Updating $BRANCH"
git fetch --prune origin "$BRANCH"
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

log "Installing dependencies"
pnpm install --frozen-lockfile

log "Building API and static applications"
pnpm api:build
VITE_APP_URL="$APP_URL" pnpm web:build
VITE_APP_URL="$APP_URL" pnpm landing:build
pnpm indexer:typecheck

readonly RELEASE_ID="$(git rev-parse --short=12 HEAD)"
readonly RELEASE_DIR="$WEB_ROOT/releases/$RELEASE_ID"
log "Publishing static release $RELEASE_ID"
sudo mkdir -p "$RELEASE_DIR/landing" "$RELEASE_DIR/app"
sudo rsync -a --delete "$REPO_DIR/apps/landing/dist/" "$RELEASE_DIR/landing/"
sudo rsync -a --delete "$REPO_DIR/apps/web/dist/" "$RELEASE_DIR/app/"
sudo ln -sfn "$RELEASE_DIR/landing" "$WEB_ROOT/landing"
sudo ln -sfn "$RELEASE_DIR/app" "$WEB_ROOT/app"

log "Reloading PM2 services"
pm2 startOrReload "$REPO_DIR/deploy/ecosystem.config.cjs" --update-env
pm2 save

log "Removing old static releases"
mapfile -t old_releases < <(
	find "$WEB_ROOT/releases" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' |
		sort -nr |
		tail -n +6 |
		cut -d' ' -f2-
)
if ((${#old_releases[@]} > 0)); then
	sudo rm -rf -- "${old_releases[@]}"
fi

log "Checking local services"
curl --fail --silent --show-error --retry 10 --retry-delay 2 \
	"http://127.0.0.1:8070/api/health" >/dev/null
curl --fail --silent --show-error --retry 15 --retry-delay 2 \
	"http://127.0.0.1:8071/health" >/dev/null

log "Deployment complete: $RELEASE_ID"
