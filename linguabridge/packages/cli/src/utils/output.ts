export function printJson(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

export function printError(message: string): void {
  console.error(`\x1b[31mError:\x1b[0m ${message}`);
}

export function printSuccess(message: string): void {
  console.log(`\x1b[32m✔\x1b[0m ${message}`);
}

export function printWarning(message: string): void {
  console.warn(`\x1b[33m⚠\x1b[0m ${message}`);
}

export function printInfo(message: string): void {
  console.log(`\x1b[36mℹ\x1b[0m ${message}`);
}
