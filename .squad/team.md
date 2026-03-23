# Squad Team

> mini-games

## Coordinator

| Name | Role | Notes |
|------|------|-------|
| Squad | Coordinator | Routes work, enforces handoffs and reviewer gates. |

## Members

| Name | Role | Charter | Status |
|------|------|---------|--------|
| 🏗️ Mikey | Lead | [charter](agents/mikey/charter.md) | ✅ Active |
| ⚛️ Data | Frontend Dev | [charter](agents/data/charter.md) | ✅ Active |
| 🔧 Chunk | Game Dev | [charter](agents/chunk/charter.md) | ✅ Active |
| 🧪 Mouth | Tester | [charter](agents/mouth/charter.md) | ✅ Active |
| 📋 Scribe | Scribe (silent) | [charter](agents/scribe/charter.md) | ✅ Active |
| 🔄 Ralph | Monitor | [charter](agents/ralph/charter.md) | ✅ Active |


## Coding Agent

<!-- copilot-auto-assign: false -->

| Name | Role | Charter | Status |
|------|------|---------|--------|
| @copilot | Coding Agent | — | 🤖 Coding Agent |

### Capabilities

**🟢 Good fit — auto-route when enabled:**
- Bug fixes with clear reproduction steps
- Test coverage (adding missing tests, fixing flaky tests)
- Lint/format fixes and code style cleanup
- Dependency updates and version bumps
- Small isolated features with clear specs
- Boilerplate/scaffolding generation
- Documentation fixes and README updates

**🟡 Needs review — route to @copilot but flag for squad member PR review:**
- Medium features with clear specs and acceptance criteria
- Refactoring with existing test coverage
- API endpoint additions following established patterns
- Migration scripts with well-defined schemas

**🔴 Not suitable — route to squad member instead:**
- Architecture decisions and system design
- Multi-system integration requiring coordination
- Ambiguous requirements needing clarification
- Security-critical changes (auth, encryption, access control)
- Performance-critical paths requiring benchmarking
- Changes requiring cross-team discussion

## Project Context

- **Project:** mini-games
- **Created:** 2026-03-23
- **Stack:** Next.js, React, TypeScript, Tailwind CSS, next-intl (i18n)
- **Description:** A kids' mini-games platform with multiple browser-based games
- **User:** Ami Hollander
