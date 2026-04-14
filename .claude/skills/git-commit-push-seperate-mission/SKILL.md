---
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git commit:*), Bash(git push:*)
description: Create 1 or many git commits by separated mission
---

## Context

- Current git status: !`git status`
- Current git diff (staged and unstaged changes): !`git diff HEAD`
- Current branch: !`git branch --show-current`
- Recent commits: !`git log --oneline -10`
- Push command: !`git push`

## Your task

Based on the above changes, create one or many git commits by seperate their mission. I meant 1 mission is 1 commit
If project has git-workflow skill, used them

You have the capability to call multiple tools in a single response. Do not use any other tools or do anything else. Do not send any other text or messages besides these tool calls.

Then push the changes to current branch