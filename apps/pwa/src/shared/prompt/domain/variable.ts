import { Result } from "@/shared/core";

export const VariableGroup = {
  Character: "character",
  User: "user",
  Cast: "cast",
  Session: "session",
  Others: "others",
  Filters: "filters",
} as const;

export type VariableGroup = (typeof VariableGroup)[keyof typeof VariableGroup];

export interface Variable {
  group: VariableGroup;
  variable: string;
  description: string;
  dataType: string;
  link?: string;
  template?: string;
  structured_output?: boolean;
}

export const variableList: Variable[] = [
  {
    group: VariableGroup.Character,
    variable: "char.id",
    description:
      "The unique ID of the character currently being referenced or taking action in a roleplaying sequence.",
    dataType: "string",
  },
  {
    group: VariableGroup.Character,
    variable: "char.name",
    description:
      "The name of the character currently being referenced or taking action in a roleplaying sequence.",
    dataType: "string",
  },
  {
    group: VariableGroup.Character,
    variable: "char.description",
    description:
      "The description of the character currently being referenced or taking action in a roleplaying sequence.",
    dataType: "string",
  },
  {
    group: VariableGroup.Character,
    variable: "char.example_dialog",
    description:
      "The example dialog of the character currently being referenced or taking action in a roleplaying sequence.",
    dataType: "string",
  },
  {
    group: VariableGroup.Character,
    variable: "char.entries",
    description:
      "A list of all retrieved character book entries for the character currently being referenced or taking action in a roleplaying sequence.",
    dataType: "string[]",
    template: "\n{% for entry in char.entries %}\n  {{entry}}\n{% endfor %}\n",
  },
  {
    group: VariableGroup.User,
    variable: "user.id",
    description:
      "The unique ID of the character controlled by the user in a roleplay.",
    dataType: "string",
  },
  {
    group: VariableGroup.User,
    variable: "user.name",
    description:
      "The name of the character controlled by the user in a roleplay.",
    dataType: "string",
  },
  {
    group: VariableGroup.User,
    variable: "user.description",
    description:
      "The description of the character controlled by the user in a roleplay.",
    dataType: "string",
  },
  {
    group: VariableGroup.User,
    variable: "user.example_dialog",
    description:
      "The example dialog of the character controlled by the user in a roleplay.",
    dataType: "string",
  },
  {
    group: VariableGroup.User,
    variable: "user.entries",
    description:
      "A list of all retrieved character book entries for the character controlled by the user in a roleplay.",
    dataType: "string[]",
    template: "\n{% for entry in user.entries %}\n  {{entry}}\n{% endfor %}\n",
  },
  {
    group: VariableGroup.Cast,
    variable: "cast.all",
    description:
      "A list of all the characters participating in the roleplay. It includes every character currently involved.",
    dataType: "Character[]",
    template:
      "\n{% for character in cast.all %}\n  {{character.name}}: {{character.description}}\n{% endfor %}\n",
  },
  {
    group: VariableGroup.Cast,
    variable: "cast.active",
    description:
      "The character, whether user-controlled or AI-controlled, who is currently being referenced or taking action in a roleplaying sequence.",
    dataType: "Character",
  },
  {
    group: VariableGroup.Cast,
    variable: "cast.inactive",
    description:
      "The character or characters, whether user-controlled or AI-controlled, who are not currently being referenced or taking action in a roleplaying sequence.",
    dataType: "Character[]",
    template:
      "\n{% for character in cast.inactive %}\n  {{character.name}}: {{character.description}}\n{% endfor %}\n",
  },
  {
    group: VariableGroup.Session,
    variable: "session.char_entries",
    description: "A list of all retrieved character book entries.",
    dataType: "string[]",
    template:
      "\n{% for entry in session.char_entries %}\n  {{entry}}\n{% endfor %}\n",
  },
  {
    group: VariableGroup.Session,
    variable: "session.plot_entries",
    description: "A list of all retrieved plot lorebook entries.",
    dataType: "string[]",
    template:
      "\n{% for entry in session.plot_entries %}\n  {{entry}}\n{% endfor %}\n",
  },
  {
    group: VariableGroup.Session,
    variable: "session.entries",
    description: "A list of all retrieved character and plot entries.",
    dataType: "string[]",
    template:
      "\n{% for entry in session.entries %}\n  {{entry}}\n{% endfor %}\n",
  },
  {
    group: VariableGroup.Session,
    variable: "session.scenario",
    description: "The scenario of the roleplay.",
    dataType: "string",
  },
  {
    group: VariableGroup.Session,
    variable: "session.duration",
    description:
      "The amount of time that has passed since the roleplay session was created. It updates continuously to track the session's duration in real-time.",
    dataType: "Duration",
    template: "\n{{session.duration | duration_to_relative}}\n",
  },
  {
    group: VariableGroup.Session,
    variable: "session.idle_duration",
    description:
      "The amount of time that has passed since the last action or interaction in the roleplay session. It updates continuously to measure periods of inactivity.",
    dataType: "Duration",
    template: "\n{{session.idle_duration | duration_to_relative}}\n",
  },
  {
    group: VariableGroup.Session,
    variable: "history",
    description:
      "A list of all the turns in a roleplay session, each detailing the actions and narrative progression.\nA [turn] A single step or action in the roleplay session.",
    dataType: "Turn[]",
    template:
      "\n{% for turn in history %}\n  {{turn.char_name}}: {{turn.content}}\n{% endfor %}\n",
  },
  {
    group: VariableGroup.Session,
    variable: "turn.char_id",
    description:
      "ID of the character who sent the message. This variable can only be utilized in history messages.",
    dataType: "string",
  },
  {
    group: VariableGroup.Session,
    variable: "turn.char_name",
    description:
      "The name of the character who performed an action during a specific turn in the roleplaying sequence. This variable can only be utilized in history messages.",
    dataType: "string",
  },
  {
    group: VariableGroup.Session,
    variable: "turn.content",
    description:
      "The actual content or narrative of the action taken during a specific turn in the roleplaying sequence. This variable can only be utilized in history messages.",
    dataType: "string",
  },
  // {
  //   group: VariableGroup.Session,
  //   variable: "turn.variables",
  //   description:
  //     "The variables and their values after message generation is complete. This variable can only be utilized in history messages.",
  //   dataType: "Record<string, any>",
  // },
  {
    group: VariableGroup.Others,
    variable: "now",
    description: "The current date and time as defined by the user's device.",
    dataType: "Datetime",
  },
  {
    group: VariableGroup.Filters,
    variable: "date_to_relative",
    description:
      'A function that converts a specific date or timestamp into a relative format, such as "2 hours ago" or "3 days ago".',
    dataType: "string",
    template: "\n{{'2025-01-02' | date_to_relative}}\n",
  },
  {
    group: VariableGroup.Filters,
    variable: "random",
    description:
      "Takes multiple input values and randomly selects one of them as the output.",
    dataType: "string",
    template: "\n{{['apple', 'banana', 'cherry'] | random}}\n",
  },
  {
    group: VariableGroup.Filters,
    variable: "roll",
    description:
      "A command to perform a dice roll calculation based on standard dice notation. (refer to this URL for more details: https://dice-roller.github.io/documentation/guide/notation/)",
    dataType: "number",
    template: "\n{{'1d20' | roll}}\n",
  },
];

export class VariableLibrary {
  private constructor() {}

  static variableList: Variable[] = [];
  static variableMap: Map<string, Variable> = new Map();

  static setVariableList(macroList: Variable[]): void {
    this.variableList = macroList;
    this.variableMap = new Map(
      macroList.map((macro) => [macro.variable, macro]),
    );
  }

  static initialize() {
    this.setVariableList(variableList);
  }

  static searchVariables(keyword: string): Result<Variable[]> {
    const regexp = new RegExp(keyword.trim(), "i");
    return Result.ok(
      variableList.filter((macro) => {
        return (
          regexp.test(macro.variable) ||
          regexp.test(macro.description) ||
          regexp.test(macro.dataType)
        );
      }),
    );
  }
}
VariableLibrary.initialize();
