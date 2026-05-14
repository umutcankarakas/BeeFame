This repository is an academic AI fairness thesis project.

For fairness metrics, mitigation methods, mathematical definitions, and literature-based explanations: use fairness-academic-verifier agent

## Usage of the NoteboolLM MCP Server

1. Query NotebookLM for the standard definition.
2. Find the implementation in the repository.
3. Compare the implementation mathematically.
4. Verify required inputs:
   - y_true
   - y_pred
   - prediction scores
   - sensitive attributes
5. Only suggest renaming if mathematically equivalent.
6. If incorrect, explain the exact mismatch.

## Code Modification Policy

Before modifying code:
1. Explain the planned change.
2. Identify affected files.
3. Explain why the change is necessary extremely shortly such as "we really need to do this because [FUNCTION_NAME] gives an error." or "we don't really need to do this but it is nice because it makes [...]".
4. Avoid unnecessary refactors.