/**
 * Create a seeded pseudo-random number generator using the mulberry32 algorithm.
 *
 * @param {number} seed - Integer seed value
 * @returns {() => number} A function returning uniform random values in [0, 1)
 */
export function createRng(seed) {
  let s = seed >>> 0;
  return function () {
    s += 0x6d2b79f5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Sample a reaction delay from Normal(mean, std) clipped at 0.
 * When std === 0 the deterministic mean is returned immediately.
 *
 * Uses the Box-Muller transform for normal sampling.
 *
 * @param {() => number} rng - Uniform [0,1) random function from createRng
 * @param {number} mean - Mean reaction delay in seconds
 * @param {number} std - Standard deviation in seconds (0 for deterministic)
 * @returns {number} Sampled delay >= 0
 */
export function sampleReactionDelay(rng, mean, std) {
  if (std === 0) return mean;

  // Box-Muller: requires two uniform samples
  const u1 = rng();
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(u1 === 0 ? Number.EPSILON : u1)) * Math.cos(2 * Math.PI * u2);
  return Math.max(0, mean + std * z);
}
