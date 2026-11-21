# PromptWar Hackathon — Project Rules & Guidelines
# Powered by Everything Claude Code (ECC)

## Core Directives
1. **Eval-First Development**:
   - Never iterate prompts or code blindly.
   - Maintain ground-truth test cases in `evals/` and measure pass rates before and after prompt edits.
2. **Strict Delimiter & Prompt Hygiene**:
   - Treat all user/adversarial inputs as untrusted.
   - Use strict XML tags (`<system_instructions>`, `<context>`, `<user_input>`) to prevent prompt injections.
   - Enforce instruction hierarchy: System instructions > Developer context > User input.
3. **Speed & Reliability**:
   - Build thin, working vertical slices first (E2E) before styling or expanding.
   - Explicit error handling for LLM timeouts, rate limits, and JSON parse failures.
4. **ECC Delegation**:
   - Use `planner` for architecture and phase planning.
   - Use `prompt-optimizer` for refining prompts.
   - Use `security-reviewer` for jailbreak and red-teaming checks.
   - Use `build-error-resolver` when build or dependencies fail.
