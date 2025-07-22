---
sidebar_position: 4
---

# Preview

The Preview panel allows you to see exactly how the prompt and parameters will appear when sent to the model. This is essential for testing and debugging your agent configuration before running it in a live session. You can verify that variables are being populated correctly, messages are formatted properly, and parameters are set as expected.

![Preview](./images/preview.png)

## Select Session

Choose an existing session that uses this flow to populate the preview with real data. This initializes the context with that session's information, including:

- Character and plot cards and their variables
- Conversation history
- Current session state

By selecting a session, you can see how your agent will behave with actual data rather than placeholder values. This helps ensure your prompts and variable references work correctly in real scenarios.

![Select Session](./images/preview-select-session.png)