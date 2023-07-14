import { ParsedQs } from "qs";

// Helper function to build a dictionary of allowed parameters
export function buildParamsDict(params: ParsedQs, targetParams: Set<string>) {
  const dict: Record<string, any> = {};
  const keys = new Set<string>(Object.keys(params));
  for (const param of keys) {
    if (targetParams.has(param)) {
      dict[param] = params[param];
    }
  }
  return dict;
}
