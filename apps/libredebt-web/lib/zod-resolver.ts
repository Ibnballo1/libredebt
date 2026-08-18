/**
 * lib/zod-resolver.ts — Custom React Hook Form resolver for Zod v4
 */

import type {
  Resolver,
  FieldValues,
  FieldError,
  FieldErrors,
} from "react-hook-form";
import type { ZodTypeAny } from "zod";

export function schemaResolver<TFieldValues extends FieldValues = FieldValues>(
  schema: ZodTypeAny,
): Resolver<TFieldValues> {
  return async (values) => {
    const result = await schema.safeParseAsync(values);

    if (result.success) {
      return {
        values: result.data as TFieldValues,
        errors: {},
      };
    }

    const errors: FieldErrors<TFieldValues> = {};

    for (const issue of result.error.issues) {
      if (issue.path.length === 0) continue;

      let current: Record<string, unknown> = errors as Record<string, unknown>;

      for (let i = 0; i < issue.path.length - 1; i++) {
        const key = String(issue.path[i]);
        if (!current[key] || typeof current[key] !== "object") {
          current[key] = {};
        }
        current = current[key] as Record<string, unknown>;
      }

      const lastKey = String(issue.path[issue.path.length - 1]);
      if (!current[lastKey]) {
        const fieldError: FieldError = {
          type: issue.code,
          message: issue.message,
        };
        current[lastKey] = fieldError;
      }
    }

    return {
      values: {} as Record<string, never>,
      errors,
    };
  };
}
