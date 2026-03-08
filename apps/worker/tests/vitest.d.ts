declare module 'vitest' {
  export const describe: (...args: any[]) => any
  export const it: (...args: any[]) => any
  export const expect: (...args: any[]) => any
  export const beforeEach: (...args: any[]) => any
  export const vi: {
    fn: (...args: any[]) => any
    mock: (...args: any[]) => any
    spyOn: (...args: any[]) => any
    restoreAllMocks: () => void
  }
  export const afterEach: (...args: any[]) => any
}
