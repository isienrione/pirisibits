# Native review (temporary)

Capacitor generates the iOS Xcode project under **`native-review/ios/`** so a
Mac-local untracked `chronowalk/ios/` is never overwritten by `cap add` / sync
in this repository layout.

See `docs/architecture/CAPACITOR_IOS_SHELL.md` for the backup/compare/promote
procedure before pointing `ios.path` at `ios/` on a developer Mac.
