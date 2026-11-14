export type EnvironmentPreset = 'zen' | 'moonlight' | 'autumn' | 'sakura'
export type Environment = EnvironmentPreset | 'midnight' | 'rain' | 'dusk'
export type KoiVariety = 'kohaku' | 'sanke' | 'ogon' | 'shusui'
export interface PondOptions {
  environment?: Environment
  /** Swimming speed, 0.1 to 3; default 1.35. */
  speed?: number
  /** Integer from 1 to 30; default 12. */
  fishCount?: number
  /** Size multiplier, 0.5 to 1.8. */
  fishSize?: number
  varieties?: readonly KoiVariety[]
  behavior?: 'wander' | 'school' | 'circle'
  /** null uses the selected environment's water. */
  waterColor?: string | null
  lilyDensity?: number
  lotusCount?: number
  particleDensity?: number
  rippleIntensity?: number
  timeOfDay?: 'auto' | number
  seed?: number
  lilies?: boolean
  lotus?: boolean
  detail?: 'fine' | 'balanced'
  paused?: boolean
  interactive?: boolean
}
export type PondConfig = Readonly<Required<PondOptions>>
export interface PondState extends PondConfig {
  readonly foodCount: number
  readonly eaten: number
  readonly destroyed: boolean
}
export interface PondController {
  play(): PondState
  pause(): PondState
  toggle(): PondState
  /** Resets motion while preserving configuration. */
  reset(): PondState
  resetToDefaults(): PondState
  randomize(seed?: number): PondConfig
  setOptions(options: PondOptions): PondState
  setConfig(config: string | PondOptions | { version: 1; options: PondOptions }): PondState
  getConfig(): PondConfig
  serialize(): string
  /** Coordinates are normalized to 0–1 and clamped to the pond edges. */
  feed(x: number, y: number): void
  ripple(x: number, y: number, strength?: number): void
  getState(): PondState
  exportPNG(): string
  destroy(): void
}
export declare const ENVIRONMENTS: ReadonlyArray<Readonly<{ id: EnvironmentPreset; label: string; description: string }>>
export declare const VARIETIES: readonly KoiVariety[]
export declare const DEFAULT_OPTIONS: PondConfig
export declare function validateOptions(options?: PondOptions, current?: PondOptions): Required<PondOptions>
export declare function serializeConfig(options?: PondOptions): string
export declare function parseConfig(json: string): Required<PondOptions>
export declare function randomizeConfig(seed?: number): Required<PondOptions>
export declare function createKoiPond(canvas: HTMLCanvasElement, options?: PondOptions): Readonly<PondController>
export declare class KoiPondElement extends HTMLElement {
  readonly pond: Readonly<PondController> | null
  readonly canvas: HTMLCanvasElement
}
export declare function registerKoiPond(tagName?: string): CustomElementConstructor | undefined
declare global {
  interface HTMLElementTagNameMap { 'koi-pond': KoiPondElement }
  interface HTMLElementEventMap { pondchange: CustomEvent<PondState>; ponderror: CustomEvent<{ message: string }> }
  interface Window {
    KoiPond?: {
      createKoiPond: typeof createKoiPond
      registerKoiPond: typeof registerKoiPond
      KoiPondElement: typeof KoiPondElement
      ENVIRONMENTS: typeof ENVIRONMENTS
      VARIETIES: typeof VARIETIES
      DEFAULT_OPTIONS: typeof DEFAULT_OPTIONS
      validateOptions: typeof validateOptions
      serializeConfig: typeof serializeConfig
      parseConfig: typeof parseConfig
      randomizeConfig: typeof randomizeConfig
    }
  }
}
