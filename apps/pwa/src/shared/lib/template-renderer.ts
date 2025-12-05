"use client";

import init, { Environment } from "minijinja-js/dist/web";
import Roll from "roll";

import { RenderContext } from "@/shared/prompt/domain";
import { Datetime } from "@/shared/lib/datetime";
import { logger } from "@/shared/lib/logger";

export type RenderOptions = {
  isDeleteUnnecessaryCharacters?: boolean;
};

export class TemplateRenderer {
  static env: Environment;

  static {
    init()
      .then(() => {
        this.env = new Environment();
        this.env.undefinedBehavior = "chainable";
        this.env.addFilter(
          "date_to_relative",
          (initial: Date | string, withoutSuffix?: boolean) => {
            return Datetime(initial).fromNow(withoutSuffix);
          },
        );
        this.env.addFilter("duration_to_relative", (duration: string) => {
          return Datetime.duration(duration).humanize();
        });
        this.env.addFilter("random", (candidates: string) => {
          const idx = Math.floor(Math.random() * candidates.length);
          return candidates[idx];
        });
        const roll = new Roll();
        this.env.addFilter("roll", (notation: string) => {
          return roll.roll(notation).result;
        });
        // Safe 'last' filter that returns undefined for empty arrays instead of throwing
        this.env.addFilter("last", (arr: any[] | undefined | null) => {
          if (!arr || !Array.isArray(arr) || arr.length === 0) {
            return undefined;
          }
          return arr[arr.length - 1];
        });
        // Safe 'first' filter that returns undefined for empty arrays instead of throwing
        this.env.addFilter("first", (arr: any[] | undefined | null) => {
          if (!arr || !Array.isArray(arr) || arr.length === 0) {
            return undefined;
          }
          return arr[0];
        });
      })
      .catch((error) => {
        logger.error("Failed to initialize TemplateRenderer", error);
      });
  }

  private static getCommonMacros(): any {
    return {
      now: new Date().toISOString(),
    };
  }

  private static deleteUnnecessaryCharacters(str: string) {
    return str.replace(/\n{2,}/g, "\n").trim();
  }

  // Replace `{{char}}`, `{{user}}`, and `{{scenario}}` variables in text (case-insensitive)
  private static replaceCharAndUserVariables(text: string): string {
    return text
      .replace(/{{\s*char\s*}}/gi, "{{char.name}}")
      .replace(/{{\s*user\s*}}/gi, "{{user.name}}")
      .replace(/{{\s*scenario\s*}}/gi, "{{scenario.name}}");
  }

  public static render(
    template: string,
    context: RenderContext | any,
    options?: RenderOptions,
  ): string {
    // Check env is initialized
    if (!this.env) {
      throw new Error("TemplateRenderer is not initialized");
    }

    const sanitizedTemplate = this.replaceCharAndUserVariables(template);

    let result = this.env.renderStr(sanitizedTemplate, {
      ...this.getCommonMacros(),
      ...context,
    });

    if (options?.isDeleteUnnecessaryCharacters) {
      result = this.deleteUnnecessaryCharacters(result);
    }

    return result;
  }
}
