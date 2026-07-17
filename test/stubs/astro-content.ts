// Test-only stub — vitest replaces `astro:content` with this so lib code
// that references it can be imported without a full Astro build.
export function defineCollection(x: unknown) { return x; }

const chain: any = new Proxy(function () { return chain; } as any, {
  get: () => chain,
  apply: () => chain,
});
export const z: any = chain;
