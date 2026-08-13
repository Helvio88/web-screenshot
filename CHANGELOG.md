# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2026-08-13

### Added
- Full-page screenshots when `-w`/`--width` or `-h`/`--height` is `0` (as the README already described).
- GitHub Actions CI for lint, typecheck, tests, and build on push and pull requests.
- Tests for the sanitizer, CLI help/argument parsing, batch argv splitting, and a mocked screenshot flow.
- ISC `LICENSE` file matching `package.json`.

### Changed
- `page.goto` now waits until `networkidle2`. `-t`/`--time` is extra wait *after* that idle point (default still 3 seconds).
- Batch lines are split with quote-aware argv parsing, then fed through Commander, so paths with spaces work.
- README install/help text matches the current CLI (`web-screenshot`, including `-p`/`--path`). Dropped the dead Travis badge and `--unsafe-perm`.
- Publish workflow uses Node 22 and `npm run build` (esbuild) instead of Node 16 + `tsc`.
- Committed `dist/screenshot.js` is bundled without minify so CI rebuilds match.

### Fixed
- `sanitizeTime` / clip sanitizers treat CLI string numbers as integers, so `-t 3` waits 3 seconds instead of falling back to 5.
- `sanitizeAuth` is typed as `string | undefined` and accepts a missing `--auth` flag.

## [2.0.5] - 2025-07-22

### Added
- Optional Chrome executable path (`-p`/`--path`).
