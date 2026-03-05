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
    return String(value)
      .split(/\s+/)
      .filter(Boolean)
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => toClassList(item))
  }

  return Object.entries(value)
    .filter(([, isEnabled]) => Boolean(isEnabled))
    .flatMap(([className]) => className.split(/\s+/).filter(Boolean))
}

export function cn(...values: CnValue[]): string {
  const classes = values.flatMap((value) => toClassList(value)).filter(Boolean)
  return classes.join(" ")
}
