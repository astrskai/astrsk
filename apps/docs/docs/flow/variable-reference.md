---
sidebar_position: 2
---

# Variable Reference

Variables are data that can be used during Flow execution. They contain various information such as session chat history, character information, and more. Each node can utilize variables when executed, and the results of node execution are also stored as variables.

## Types

Variables can contain various types of data. The most basic types are JavaScript primitive types.

| Type | Description | Example |
|------|-------------|---------|
| `string` | Text values | `Hello. My name is Raphy.` |
| `number` | Numeric values | `42`, `3.14`, `-10` |
| `boolean` | True/false values | `true`, `false` |

In addition to primitive types, there are object types. These objects can be accessed through their internal properties using `.`. Example: `{{char.name}}`

### `Character`

This type represents a character card included in the session. You can access various data defined in the card.

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Unique identifier for the character. (UUID) |
| `name` | `string` | Name of the character. |
| `description` | `string` | Description of the character. |
| `example_dialog` | `string` | Example dialogue for the character. |
| `entries` | `string[]` | List of activated lorebook entries for this character. |

### `HistoryItem`

This type represents each individual conversation item from previous dialogue within a session.

| Property | Type | Description |
|----------|------|-------------|
| `char_id` | `string` | ID of the character who sent the message. |
| `char_name` | `string` | Name of the character who sent the message. |
| `content` | `string` | Message content. |
| `variables` | `Record<string, any>` | The variables and their values after message generation is complete. |

### `Date`

This is a [Day.js](https://day.js.org/) `Date` object representing a specific point in time. It's used to represent a specific moment in the present, past, or future. This object cannot be used standalone and must be converted to strings like "2 minutes ago" or "1 hour ago" through filters like `date_to_relative`.

### `Duration`

This is a [Day.js](https://day.js.org/) `Duration` object representing time intervals. It's mainly used to represent session duration or conversation intervals. This object cannot be used standalone and must be converted to strings like "2 minutes ago" or "1 hour ago" through filters like `date_to_relative`.

## System Variables

The following variables are initialized when the flow is executed.

### Character

#### `char`
**Type:** [`Character`](#character)

The character currently being referenced or taking action in a roleplaying sequence.

---

#### `user`
**Type:** [`Character`](#character)

The character controlled by the user in a roleplay.

---

#### `cast.all`
**Type:** [`Character[]`](#character)

A list of all the characters participating in the roleplay. It includes every character currently involved.

**Example:**
```
{% for character in cast.all %}
  {{character.name}}: {{character.description}}
{% endfor %}
```

---

#### `cast.active`
**Type:** [`Character`](#character)

The character, whether user-controlled or AI-controlled, who is currently being referenced or taking action in a roleplaying sequence.

---

#### `cast.inactive`
**Type:** [`Character[]`](#character)

The character or characters, whether user-controlled or AI-controlled, who are not currently being referenced or taking action in a roleplaying sequence.

**Example:**
```
{% for character in cast.inactive %}
  {{character.name}}: {{character.description}}
{% endfor %}
```

### Session

#### `session.char_entries`
**Type:** `string[]`

A list of all retrieved character book entries.

**Example:**
```
{% for entry in session.char_entries %}
  {{entry}}
{% endfor %}
```

---

#### `session.plot_entries`
**Type:** `string[]`

A list of all retrieved plot lorebook entries.

**Example:**
```
{% for entry in session.plot_entries %}
  {{entry}}
{% endfor %}
```

---

#### `session.entries`
**Type:** `string[]`

A list of all retrieved character and plot entries.

**Example:**
```
{% for entry in session.entries %}
  {{entry}}
{% endfor %}
```

---

#### `session.scenario`
**Type:** `string`

The scenario of the roleplay.

---

#### `session.duration`
**Type:** [`Duration`](#duration)

The amount of time that has passed since the roleplay session was created. It updates continuously to track the session's duration in real-time.

**Example:**
```
{{session.duration | duration_to_relative}}
```

---

#### `session.idle_duration`
**Type:** [`Duration`](#duration)

The amount of time that has passed since the last action or interaction in the roleplay session. It updates continuously to measure periods of inactivity.

**Example:**
```
{{session.idle_duration | duration_to_relative}}
```

---

#### `history`
**Type:** [`HistoryItem[]`](#historyitem)

A list of all the turns in a roleplay session, each detailing the actions and narrative progression turn: A single step or action in the roleplay session.

**Example:**
```
{% for item in history %}
  {{item.char_name}}: {{item.content}}
{% endfor %}
```

### Others

#### `now`
**Type:** [`Date`](#date)

The current date and time as defined by the user's device.

## Filters

You can use the following filters to transform variables.

#### `date_to_relative`
**Return Type:** `string`

A function that converts a specific date or timestamp into a relative format, such as "2 hours ago" or "3 days ago".

**Example:**
```
{{'2025-01-02' | date_to_relative}}
// Output: "2 days ago" (assuming current date is 2025-01-04)
```

---

#### `random`
**Return Type:** `string`

Takes multiple input values and randomly selects one of them as the output.

**Example:**
```
{{['apple', 'banana', 'cherry'] | random}}
// Output: "banana" (randomly selected)
```

---

#### `roll`
**Return Type:** `number`

A command to perform a dice roll calculation based on standard dice notation. (refer to this URL for more details: https://dice-roller.github.io/documentation/guide/notation/)

**Example:**
```
{{'1d20' | roll}}
// Output: 15 (random number between 1-20)
```
