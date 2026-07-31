# Engineering Execution Rules

Before executing any prompt:

1. Read the entire repository and understand the existing architecture.
2. Read all project documents (Rules.MD, Design.MD, Prompts.MD, README, and related files).
3. Analyze existing code, dependencies, workflows, and configurations before making changes.
4. Create a detailed implementation plan and task checklist.
5. Present the plan and wait for explicit approval before writing or modifying any code.
6. During implementation, continuously update the task checklist and verify every completed item.
7. Never overwrite or refactor working code unless explicitly required.
8. Reuse existing implementations whenever possible; avoid duplication and unnecessary abstractions.
9. Follow production-grade engineering principles: Clean Architecture, SOLID, DRY, KISS, strong typing, semantic versioning, security by default, and backward compatibility.
10. After each prompt, run formatting, linting, tests, build verification, and deployment verification (if applicable), then generate a completion summary before stopping.

Never assume requirements, never skip verification, and never proceed to the next prompt without completing and validating the current one.
