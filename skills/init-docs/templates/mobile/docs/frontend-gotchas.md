# Platform & UI Gotchas — {{PROJECT_NAME}}

Non-obvious rules + platform divergences that prevent recurring bugs. **Every rule here exists because the bug already bit us.**

Platform: {{STACK_PLATFORM}}.

## Template

```
## <Short rule in imperative form>
- One-sentence rule.
- Platform: iOS / Android / both.
- Symptoms: <what goes wrong if violated>.
- Reason: <why the platform / library behaves this way>.
- How to apply: <where the rule kicks in>.
- Fixed in: <commit SHA or BUGS.md ID>.
```

## Common classes of gotcha to seed

<!-- Real gotchas go here as they surface. Common categories:

  - iOS safe area vs status bar vs notch handling.
  - Android back-button interception (doesn't exist on iOS).
  - Keyboard avoiding behavior differs per platform.
  - Deep links: iOS Universal Links vs Android App Links.
  - Permission prompts: iOS shows them once; Android runtime vs install-time differs by API level.
  - Background tasks: iOS is extremely restrictive; Android differs per OEM.
  - Push notifications: iOS requires APNs token; Android uses FCM.
  - Network security config: Android cleartext default, iOS ATS.
  - Date / timezone: device locale may differ from app's expected locale.
  - Image rendering: iOS rounds pixel values differently; Android MIUI/OneUI customizations can break UI.

  Document each one only WHEN the bug happens. Do not pre-write speculative rules.

-->
