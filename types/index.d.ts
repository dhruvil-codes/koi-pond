export type Environment = 'midnight' | 'rain' | 'dusk'
export interface PondOptions {
  environment?: Environment
  /** Swimming speed, 0.25 to 2.5; default 1.35. */
  speed?: number
  /** Integer from 1 to 16; default 7. */
  fishCount?: number
  lilies?: boolean
  lotus?: boolean
  detail?: 'fine' | 'balanced'
  paused?: boolean
  interactive?: boolean
}
export interface PondState extends Readonly<Required<PondOptions>> {
  readonly foodCount: number
  readonly eaten: number
  readonly destroyed: boolean
}
export interface PondController {
  play(): PondState
  pause(): PondState
  toggle(): PondState
  reset(): PondState
  setOptions(options: PondOptions): PondState
  /** Coordinates are normalized to 0–1 and clamped to the pond edges. */
  feed(x: number, y: number): void
  ripple(x: number, y: number, strength?: number): void
  getState(): PondState
  exportPNG(): string
  destroy(): void
}
export declare const ENVIRONMENTS: ReadonlyArray<Readonly<{ id: Environment; label: string; description: string }>>
export declare function createKoiPond(canvas: HTMLCanvasElement, options?: PondOptions): Readonly<PondController>
export declare class KoiPondElement extends HTMLElement {
  readonly pond: Readonly<PondController> | null
  readonly canvas: HTMLCanvasElement
}
export declare function registerKoiPond(tagName?: string): CustomElementConstructor | undefined
declare global {
  interface HTMLElementTagNameMap { 'koi-pond': KoiPondElement }
  interface HTMLElementEventMap {
    pondchange: CustomEvent<PondState>
    ponderror: CustomEvent<{ message: string }>
  }
  interface Window {
    KoiPond?: {
      createKoiPond: typeof createKoiPond
      registerKoiPond: typeof registerKoiPond
      KoiPondElement: typeof KoiPondElement
      ENVIRONMENTS: typeof ENVIRONMENTS
    }
  }
}
