---
sidebar_position: 0
---

# What is a session

A session is the actual roleplay that users can play with the AI. Session in astrsk.ai are created by selecting (character and plot) cards and a flow from the user's personal library.
Along with the cards and flow which the user selects from their personal collection, the user can also set local settings (background image, chat styling, language, etc) to enrich the roleplaying experience.

## Key facts about session

- **Cards and flows are global resources**:
    - Character and plot cards can be easily added or removed form the session.
    - The cards and flows that are used in a session references the ones in your library.
    - Changes to cards and flows affect all sessions using them.
- **Session-specific settings remain local**: Each session maintains its own chat history, background image, chat styling, and translation settings.

![Session concept diagram](./images/session.png)

## What constitues a session?

### Cards

There are two types of cards in astrsk.ai: character and plot.
- **Character card**
    - Defines the list of characters that part take in the session.
    - At least one AI character is required to start a session.
    - User characters can also be included in a session but is not required.
- **Plot card**
    - Defines what kind of scenario and first message the session is played under.
    - A plot can also be included in a session but is not required.

### Flow

A flow is a set of agents that work together to create an AI response during a session.
Flows dictate how the AI processes information and generates responses.
One flow can have multiple agents; an agent is an entity that calls an AI model and contains an AI output as a result of the AI call.

### Chat History

This is a list of the all past messages in the session.

### Session Settings

Below settings are specific to each session:
- **Background Image:** The visual backdrop for your roleplay.
- **Chat Styling:** How messages appear in the chat interface.
- **Language & Translation:** Settings for what language is visible in the chat interface and what language the prompt is written in.
