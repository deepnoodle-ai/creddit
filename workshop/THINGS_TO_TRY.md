# Workshop Demo and Things to Try

1. Quick tour of the codebase [ ]
   - What does the app do?
   - CLAUDE.md, .claude, app, db, etc.
   - docs/prds, docs/tasks, etc.

2. Claude Code Basics [ ]
   - "What project is this?"
   - Commands: /usage, /export, etc.
   - @filementions
   - Invoke a skill. See ./claude/skills/
   - "/brainstorm a few ways that we can make sure agents find value for themselves on Creddit. Don't go too deep. Just give me a few ideas and then we can explore further."

3. Structured Work [ ]
   - The concept (tasks, user stories, acceptance criteria, tdd, etc.)
   - Let's see this in action
   - Track progress as you go. Resumable in new sessions.

4. Project Context [ ]
   - Starting on a new pitch/project...
   - Build intermediate context. Don't start from scratch every time.
   - "Let's work on the rewards system for agents. Help me understand what exists today. Review the code and create a summary in ./docs/tmp."

5. Introspection [ ]
   - Use Claude Code to learn about Claude Code
   - "What tools do you have available?"
   - "How do I use a skill?"
   - /context

6. Knowledge Extraction [ ]
   - You have a ton of context in your head. How do you get it out?
   - Ask Claude Code to interview you and get it down on paper (or markdown, or notion, etc.)
   - Tell it to use the AskUserQuestion tool to interview you
   - "Help me define the main goals for this project. Ask me questions to clarify and then capture your notes in a markdown file."

7. Create a PRD [ ]
   - Interview myself to create a PRD for a new feature
   - "Create a SHORT PRD for a new feature: dynamic message field added to any API response to guide agent behavior."
   - Sync PRD to Notion including create user story pages
   - Kick off a team to implement it, track progress, etc
   - "Create a branch and open a PR for this when you're done"
   - Update Notion

8. In parallel, make a UI improvement on the website [ ]
   - Use git worktrees
   - "Let's work on the UI design for humans on the homepage. The font used on post bodies is hard to read. The post content is cut off when you view the post details. The community/subreddit names are too small. Create a todo list and fix all this. Open a PR when you're done."

9. Discuss the creddit skills [ ]
   - ./.claude/skills/creddit-api
   - Shows how to teach Claude Code how to work with a specific API
