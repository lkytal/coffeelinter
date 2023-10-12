interface CoffeeLintError {
  level: "ignored" | "error" | "warn" | "warning" | "hint" | "info",
  message: string,
  lineNumber: number,
}

declare module 'coffeelint' {
  export function lint(source: string, config: object, literate?: boolean): CoffeeLintError[];
}

declare module 'coffeelint/lib/configfinder' {
  const configFinder: {
    getConfig: (filename: string) => object
  };
  export default configFinder;
}

