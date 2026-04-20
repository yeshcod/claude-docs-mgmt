# Architecture — {{PROJECT_NAME}}

## Stack
- **Platform**: {{STACK_PLATFORM}}.
- **Language / UI framework**: {{STACK_FRONTEND}}.
- **Backend**: {{STACK_BACKEND}}.
- **Distribution**: {{STACK_DEPLOY}} (App Store / Play / TestFlight / CodePush / Expo).

## Layout

```
<project-root>
├── src/             # app source (screens, components, state, services)
├── ios/             # native iOS (if bridged)
├── android/         # native Android (if bridged)
├── assets/          # images, fonts, icons
├── scripts/         # dev + build scripts
└── .claude/         # project docs + hooks + skills
```

## App structure

<!-- High-level screen map + navigation graph. Example:
  - Root navigator: Stack
    - AuthStack (Login, SignUp, ForgotPassword)
    - MainStack (TabNavigator)
      - HomeTab
      - SearchTab
      - ProfileTab
      - Settings (modal)
-->

## State management

- **Approach**: <Redux / Zustand / MobX / native state / Riverpod / BLoC>.
- **Persistence**: <AsyncStorage / SecureStore / Keychain / SharedPreferences>.
- **What lives in global state vs component state**: keep UI-only state local; global for user/session/feature-flags.

## Networking

- **API base URL**: read from `<config file or env>`. Switch staging/prod via build config.
- **Auth**: <JWT refresh flow / OAuth>. Tokens stored in <SecureStore / Keychain>.
- **Offline**: <caching strategy, queue-and-retry / optimistic updates>.

## Storage

- **Secure** (credentials, tokens): <Keychain / SecureStore>.
- **Persistent** (app data, caches): <AsyncStorage / SQLite / Realm>.
- **Ephemeral** (session-only): memory.

## Platform bridges

<!-- What native modules you depend on, per platform. -->

- **iOS**: <list>.
- **Android**: <list>.
- **Cross-platform via**: <library name and version>.

## Performance notes

- Lists: use virtualized (FlatList / RecyclerView / SliverList).
- Images: lazy-load + cache.
- Bundle size: check `<command>` on every PR that adds a dep.
