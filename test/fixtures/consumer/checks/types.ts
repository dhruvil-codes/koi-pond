import {
  createKoiPond, parseConfig, serializeConfig, validateOptions,
  type PondConfig, type PondController, type PondOptions, type PondState,
} from '@dhruvil-codes/koi-pond'

const options: PondOptions = { environment: 'moonlight', fishCount: 8, varieties: ['kohaku'], interactive: false }
const normalized: Required<PondOptions> = validateOptions(options)
const config: PondConfig = parseConfig(serializeConfig(normalized))
const controller: Readonly<PondController> = createKoiPond(document.createElement('canvas'), config)
const state: PondState = controller.setOptions({ fishCount: 9, behavior: 'school' })
controller.feed(0.5, 0.25)
controller.ripple(0.5, 0.25, 0.8)
controller.setConfig(controller.serialize())
controller.destroy()
void state

// @ts-expect-error The public option is fishCount, not fishcount.
createKoiPond(document.createElement('canvas'), { fishcount: 9 })
// @ts-expect-error Variety names are a finite public union.
validateOptions({ varieties: ['unknown'] })
// @ts-expect-error A canvas is required.
createKoiPond(document.createElement('div'))
