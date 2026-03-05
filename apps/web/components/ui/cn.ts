type CnValue =
  | string
  | number
  | false
  | null
  | undefined
  | CnValue[]
  | Record<string, boolean | undefined | null>

function toClassList(value: CnValue): string[] {
  if (!value) {
    return []
  }

  if (typeof value === "string" || typeof value === "number") {
    return [String(value)]
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => toClassList(item))
  }

  return Object.entries(value)
    .filter(([, isEnabled]) => Boolean(isEnabled))
    .map(([className]) => className)
}

export function cn(...values: CnValue[]): string {
  return values.flatMap((value) => toClassList(value)).join(" ")
}
