# Release Process — {{PROJECT_NAME}}

## Distribution channels

- **iOS**: App Store + TestFlight.
- **Android**: Google Play + internal testing track.
- **Over-the-air** (if applicable): CodePush / Expo OTA / custom.

## Build numbers

- **Version** (user-visible): semver, e.g. `1.4.0`.
- **Build number** (CI-incremented, never reset): monotonically increasing integer per platform.

## Release cadence

<!-- Project-specific. Example:
  - Fortnightly to internal testing.
  - Monthly to TestFlight / Play internal track.
  - After user feedback + crash-free metric holds, promote to production.
-->

## Release checklist

1. **Bump version** in `package.json` / `pubspec.yaml` / `Info.plist` / `AndroidManifest.xml`.
2. **Update CHANGELOG** (user-facing release notes — shown in App Store / Play).
3. **Run on real devices** — at least one iOS + one Android, covering a low-end model.
4. **CI build**: produces signed `.ipa` + `.apk` / `.aab`.
5. **Upload** to TestFlight + Play internal testing.
6. **Smoke test** in beta channel.
7. **Submit for review** (iOS) or promote to production (Android).
8. **Monitor** crash-free sessions + error rate for 24h.

## Review gotchas

### iOS
- Rejection reasons you'll hit: IAP guidelines, Account deletion requirement, Sign in with Apple for third-party sign-in, privacy-nutrition labels, Data Collected list must match reality.

### Android
- Target-SDK bumps become mandatory ~12 months after Android version release.
- Data safety form must be kept current.

## Rollback

- **OTA (CodePush / Expo)**: instant rollback — redeploy previous bundle.
- **Binary**: cannot rollback a live release. Ship a patch with the fix + request expedited review if critical.
- **Feature flag**: preferred — flip off remotely without ship.

## Signing & secrets

- **Signing certs / keystore**: stored in <secrets manager / GitHub Secrets / 1Password>. Never in the repo.
- **Rotation**: <policy>.
- **Who has access**: <role>.
