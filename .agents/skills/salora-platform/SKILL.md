```markdown
# salora-platform Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches the core development patterns and conventions used in the `salora-platform` TypeScript codebase. You'll learn how to structure files, write imports and exports, follow commit message conventions, and organize tests. While no specific framework is detected, the repository demonstrates strong TypeScript practices and a clear, maintainable style.

## Coding Conventions

### File Naming
- Use **PascalCase** for file names.
  - Example: `UserProfile.ts`, `OrderManager.ts`

### Import Style
- Use **alias imports** to reference modules.
  - Example:
    ```typescript
    import { UserService } from '@services/UserService';
    ```

### Export Style
- Use **mixed exports** (both named and default).
  - Example:
    ```typescript
    // Named export
    export const MAX_USERS = 100;

    // Default export
    export default function createUser() { ... }
    ```

### Commit Messages
- Follow **Conventional Commits** with the `feat` prefix for features.
  - Example:
    ```
    feat: add user authentication module
    ```

## Workflows

### Code Contribution
**Trigger:** When adding new features or making code changes  
**Command:** `/contribute`

1. Create a new file using PascalCase naming.
2. Write TypeScript code using alias imports as needed.
3. Export your module using named or default exports.
4. Write or update corresponding test files (`*.test.*`).
5. Commit your changes using the `feat` prefix and a concise description.
   - Example: `feat: implement order processing logic`
6. Push your branch and open a pull request.

### Testing
**Trigger:** When verifying code correctness  
**Command:** `/test`

1. Locate or create test files matching the `*.test.*` pattern.
2. Write tests for your modules (testing framework is unspecified; follow existing patterns).
3. Run tests using the project's test runner (see project documentation or package scripts).

## Testing Patterns

- Test files are named with the `*.test.*` pattern (e.g., `UserService.test.ts`).
- The specific testing framework is not detected; follow existing test file patterns.
- Place tests alongside the modules they cover or in a dedicated `tests` directory.

  Example test file:
  ```typescript
  // UserService.test.ts
  import { UserService } from '@services/UserService';

  describe('UserService', () => {
    it('should create a new user', () => {
      // test implementation
    });
  });
  ```

## Commands
| Command      | Purpose                                      |
|--------------|----------------------------------------------|
| /contribute  | Start the code contribution workflow         |
| /test        | Run or write tests for your code             |
```
