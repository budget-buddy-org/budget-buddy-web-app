export function resolveAppVersion(
  buildVersion: string | undefined,
  packageVersion: string,
): string {
  return buildVersion || packageVersion || '2.8.0';
}
