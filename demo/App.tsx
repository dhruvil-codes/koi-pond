import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { Button } from "@cloudflare/kumo/components/button";
import {
  Check,
  ChevronDown,
  Code2,
  Copy,
  Download,
  Eye,
  EyeOff,
  Fish,
  Flower2,
  GitFork,
  Leaf,
  Link,
  Moon,
  MoreHorizontal,
  Pause,
  Play,
  RotateCcw,
  Shuffle,
  SlidersHorizontal,
  Sparkles,
  Sprout,
  Sun,
  Waves,
  X,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./components/ui/popover";
import { Slider } from "./components/ui/slider";
import { Input } from "./components/ui/input";
import { Textarea } from "./components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Switch } from "./components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./components/ui/tooltip";
import { generateSnippet, INSTALL_COMMAND } from "./snippets";
import type {
  EnvironmentPreset,
  PondConfig,
  PondController,
  PondOptions,
} from "../types/index";

const api = window.KoiPond!;
const scenes = [
  {
    id: "zen",
    label: "Zen Garden",
    short: "Zen Garden",
    description: "Still water, quiet greens",
    Icon: Sprout,
    color: "#b8d1a0",
  },
  {
    id: "moonlight",
    label: "Moonlight",
    short: "Moonlight",
    description: "A pond after dark",
    Icon: Moon,
    color: "#a9c8ef",
  },
  {
    id: "autumn",
    label: "Autumn",
    short: "Autumn",
    description: "Amber light, falling leaves",
    Icon: Leaf,
    color: "#e6ae78",
  },
  {
    id: "sakura",
    label: "Sakura Spring",
    short: "Sakura",
    description: "Petals on the surface",
    Icon: Flower2,
    color: "#e8b4ce",
  },
  {
    id: "daylight",
    label: "Daylight",
    short: "Daylight",
    description: "Sunlit water, warmer greens",
    Icon: Sun,
    color: "#ffe3a3",
  },
] as const;
const aliases: Record<string, EnvironmentPreset> = {
  midnight: "moonlight",
  rain: "zen",
  dusk: "autumn",
};
const waterColors = {
  zen: "#063b35",
  moonlight: "#09263e",
  autumn: "#342a20",
  sakura: "#35304a",
  daylight: "#4ca4a3",
};
const targets = [
  { id: "javascript", label: "JS" },
  { id: "html", label: "HTML" },
  { id: "react", label: "React" },
  { id: "next", label: "Next.js" },
  { id: "json", label: "JSON" },
  { id: "import", label: "Import" },
];
type Panel = "scenes" | "controls" | "embed" | "more" | null;
const PanelIsOpen = createContext(false);

function ScenePreview({ environment }: { environment: EnvironmentPreset }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const pond = api.createKoiPond(canvas.current!, {
      environment,
      fishCount: 7,
      paused: true,
      interactive: false,
      detail: "fine",
      particleDensity: .3,
    });
    return () => pond.destroy();
  }, [environment]);
  return (
    <span className="scene-preview" aria-hidden="true">
      <canvas ref={canvas} tabIndex={-1} />
    </span>
  );
}

function RangeControl({
  id,
  label,
  value,
  min,
  max,
  step,
  format = String,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format?: (value: number) => string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="range-field">
      <div className="field-heading">
        <label id={`${id}-label`}>{label}</label>
        <output id={`${id}-value`}>{format(value)}</output>
      </div>
      <Slider
        id={id}
        className="control-slider"
        aria-labelledby={`${id}-label`}
        aria-valuetext={format(value)}
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([next]) => onChange(next)}
      />
    </div>
  );
}
function ChoiceControl({
  id,
  label,
  value,
  choices,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  choices: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="choice-field">
      <label id={`${id}-label`}>{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          id={id}
          className="control-select"
          aria-labelledby={`${id}-label`}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent
          className="pond-select"
          position="popper"
          side="top"
          align="start"
          sideOffset={6}
          collisionPadding={{ top: 12, right: 12, bottom: 96, left: 12 }}
        >
          {choices.map((choice) => (
            <SelectItem key={choice.value} value={choice.value}>
              {choice.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
function ToggleControl({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="toggle-field">
      <label htmlFor={id}>{label}</label>
      <Switch
        id={id}
        className="control-switch"
        checked={checked}
        onCheckedChange={onChange}
      />
    </div>
  );
}
function Hint({ label, children }: { label: string; children: ReactElement }) {
  const [visible, setVisible] = useState(false);
  const panelIsOpen = useContext(PanelIsOpen);
  return (
    <Tooltip open={!panelIsOpen && visible} onOpenChange={setVisible}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent className="pond-tooltip" side="top" sideOffset={12}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
function DockPanel({
  id,
  open,
  setOpen,
  title,
  hint,
  trigger,
  children,
  className = "",
}: {
  id: Exclude<Panel, null>;
  open: Panel;
  setOpen: (panel: Panel) => void;
  title: string;
  hint: string;
  trigger: ReactElement;
  children: ReactNode;
  className?: string;
}) {
  const setPanelNode = useCallback((node: HTMLDivElement | null) => {
    // Keep the opening modality fixed so changing input never replays the animation.
    if (node) node.dataset.openInput = document.documentElement.dataset.input || "pointer";
  }, []);
  return (
    <Popover
      open={open === id}
      onOpenChange={(next) => setOpen(next ? id : null)}
    >
      <Hint label={hint}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      </Hint>
      <PopoverContent
        ref={setPanelNode}
        side="top"
        align="center"
        sideOffset={16}
        collisionPadding={12}
        className={`pond-popover ${className}`}
        aria-label={title}
      >
        <div className="popover-heading">
          <h2>{title}</h2>
          <Button
            variant="primary"
            className="close-button"
            aria-label={`Close ${title.toLowerCase()}`}
            onClick={() => setOpen(null)}
          >
            <X aria-hidden="true" />
          </Button>
        </div>
        {children}
      </PopoverContent>
    </Popover>
  );
}
const multiplier = (value: number) => `${Number(value.toFixed(2))}×`;
const percent = (value: number) => `${Math.round(value * 100)}%`;
const clock = (value: number) => {
  const minutes = Math.round(value * 60);
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
};

export default function App() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const controller = useRef<PondController | null>(null);
  const fallback = useRef<HTMLTextAreaElement>(null);
  const [config, setConfig] = useState<PondConfig>(() => api.validateOptions());
  const [open, setOpenState] = useState<Panel>(null);
  const dismissed = useRef(0);
  const setOpen = (panel: Panel) => {
    if (panel === null) dismissed.current++;
    setOpenState(panel);
  };
  const [category, setCategory] = useState("fish");
  const [target, setTarget] = useState("javascript");
  const [imported, setImported] = useState("");
  const [importError, setImportError] = useState("");
  const [fallbackText, setFallbackText] = useState("");
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState("");
  const [quiet, setQuiet] = useState(false);
  const environment = aliases[config.environment] || config.environment;
  const scene = scenes.find((item) => item.id === environment) || scenes[0];
  const SceneIcon = scene.Icon;
  useEffect(() => {
    if (!quiet) return;
    const restore = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setQuiet(false);
        requestAnimationFrame(() => document.getElementById("more")?.focus());
      }
    };
    const focus = requestAnimationFrame(() => canvas.current?.focus());
    window.addEventListener("keydown", restore);
    return () => {
      cancelAnimationFrame(focus);
      window.removeEventListener("keydown", restore);
    };
  }, [quiet]);
  useEffect(() => {
    const node = canvas.current!;
    const shared = () => {
      const value = new URLSearchParams(location.hash.slice(1)).get("pond");
      return value ? api.parseConfig(value) : null;
    };
    let initial: PondOptions = {};
    try {
      initial = shared() || {};
    } catch (error) {
      setNotice(`${(error as Error).message}. Showing the default pond.`);
    }
    let pond: PondController;
    try {
      pond = api.createKoiPond(node, initial);
    } catch (error) {
      setNotice(`The pond could not start: ${(error as Error).message}`);
      return;
    }
    controller.current = pond;
    (node as HTMLCanvasElement & { pond: PondController }).pond = pond;
    const sync = () => setConfig(pond.getConfig());
    const load = () => {
      try {
        const next = shared();
        if (next) pond.setConfig(next);
      } catch (error) {
        setNotice((error as Error).message);
      }
    };
    const keyboard = () => {
      document.documentElement.dataset.input = "keyboard";
    };
    const pointer = () => {
      document.documentElement.dataset.input = "pointer";
    };
    node.addEventListener("pondchange", sync);
    window.addEventListener("hashchange", load);
    window.addEventListener("keydown", keyboard);
    window.addEventListener("pointerdown", pointer);
    sync();
    return () => {
      node.removeEventListener("pondchange", sync);
      window.removeEventListener("hashchange", load);
      window.removeEventListener("keydown", keyboard);
      window.removeEventListener("pointerdown", pointer);
      pond.destroy();
      controller.current = null;
    };
  }, []);
  useEffect(() => {
    if (!notice && !copied) return;
    const timer = window.setTimeout(() => {
      setNotice("");
      setCopied("");
    }, 4200);
    return () => clearTimeout(timer);
  }, [notice, copied]);
  useEffect(() => {
    if (fallbackText) {
      fallback.current?.focus();
      fallback.current?.select();
    }
  }, [fallbackText]);
  useEffect(() => {
    if (open !== "embed") setFallbackText("");
  }, [open]);
  const apply = (options: PondOptions) => {
    try {
      controller.current?.setOptions(options);
    } catch (error) {
      setNotice((error as Error).message);
    }
  };
  const current = () => controller.current?.getConfig() || config;
  const copy = async (text: string, name: string, key: string) => {
    const request = dismissed.current;
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setNotice(`${name} copied`);
    } catch {
      if (request !== dismissed.current) return;
      setOpen("embed");
      setFallbackText(text);
      setNotice("Text selected. Press Ctrl+C or Command+C to copy.");
    }
  };
  const code =
    target === "json"
      ? api.serializeConfig(config)
      : generateSnippet(config, target);
  const share = () => {
    const local =
      ["file:", "about:", "data:"].includes(location.protocol) ||
      ["localhost", "127.0.0.1", ""].includes(location.hostname);
    const url = new URL(
      local ? "https://koi-pond.bydhruvil.in/" : location.href,
    );
    url.hash = "pond=" + encodeURIComponent(api.serializeConfig(current()));
    void copy(url.href, "Share link", "link");
  };
  const snapshot = () => {
    if (!controller.current) return;
    const link = document.createElement("a");
    link.href = controller.current.exportPNG();
    link.download = `koi-pond-${current().environment}.png`;
    link.click();
    setNotice("Image saved");
    setOpen(null);
  };
  return (
    <PanelIsOpen.Provider value={open !== null}>
      <TooltipProvider delayDuration={450} skipDelayDuration={250}>
        <main
          className="pond-playground"
          data-panel-open={open || undefined}
          data-quiet={quiet || undefined}
          aria-label="Koi Pond playground"
        >
          <canvas
            ref={canvas}
            id="pond"
            className="pond-canvas"
            style={{ touchAction: "none" }}
            tabIndex={0}
            aria-label="Interactive koi pond. Move to stir the water; click or press Enter to feed. Space pauses the pond."
          />
          <div className="pond-vignette" aria-hidden="true" />
          <div className="dock-anchor" hidden={quiet}>
            <nav className="pond-dock" aria-label="Pond controls">
              <DockPanel
                id="scenes"
                open={open}
                setOpen={setOpen}
                title="Choose a scene"
                hint="Change environment"
                className="scene-popover"
                trigger={
                  <Button
                    variant="primary"
                    className="dock-button scene-trigger"
                    id="environments"
                    aria-label={`Environment: ${scene.label}`}
                  >
                    <span className="scene-dot" style={{ color: scene.color }}>
                      <SceneIcon aria-hidden="true" />
                    </span>
                    <span>{scene.short}</span>
                    <ChevronDown className="chevron" aria-hidden="true" />
                  </Button>
                }
              >
                <div className="scene-grid">
                  {scenes.map((item) => (
                    <Button
                      key={item.id}
                      variant="primary"
                      className={`scene-choice ${environment === item.id ? "is-selected" : ""}`}
                      data-environment={item.id}
                      aria-pressed={environment === item.id}
                      onClick={() => {
                        apply({ environment: item.id });
                        setOpen(null);
                      }}
                    >
                      <ScenePreview environment={item.id} />
                      <span className="scene-copy">
                        <span>
                          <item.Icon aria-hidden="true" />{item.label}
                        </span>
                        <small>{item.description}</small>
                      </span>
                      {environment === item.id && (
                        <Check className="scene-check" aria-hidden="true" />
                      )}
                    </Button>
                  ))}
                </div>
              </DockPanel>
              <div className="dock-divider" aria-hidden="true" />
              <DockPanel
                id="controls"
                open={open}
                setOpen={setOpen}
                title="Make it yours"
                hint="Customize the pond"
                className="settings-popover"
                trigger={
                  <Button
                    variant="primary"
                    className="dock-button settings-trigger"
                    id="controls"
                    aria-label="Customize pond"
                  >
                    <SlidersHorizontal aria-hidden="true" />
                    <span className="dock-label">Customize</span>
                  </Button>
                }
              >
                <Tabs
                  value={category}
                  onValueChange={setCategory}
                  className="settings-tabs"
                >
                  <TabsList
                    className="panel-tabs"
                    aria-label="Pond settings categories"
                  >
                    <TabsTrigger value="fish" data-panel="fish">
                      <Fish aria-hidden="true" />
                      Koi
                    </TabsTrigger>
                    <TabsTrigger value="water" data-panel="water">
                      <Waves aria-hidden="true" />
                      Water
                    </TabsTrigger>
                    <TabsTrigger value="atmosphere" data-panel="atmosphere">
                      <Sparkles aria-hidden="true" />
                      Atmosphere
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="fish" className="settings-body">
                    <div className="range-grid">
                      <RangeControl
                        id="fish"
                        label="Fish count"
                        value={config.fishCount}
                        min={1}
                        max={30}
                        step={1}
                        onChange={(value) => apply({ fishCount: value })}
                      />
                      <RangeControl
                        id="speed"
                        label="Swim speed"
                        value={config.speed}
                        min={0.1}
                        max={3}
                        step={0.05}
                        format={multiplier}
                        onChange={(value) => apply({ speed: value })}
                      />
                      <RangeControl
                        id="fish-size"
                        label="Fish size"
                        value={config.fishSize}
                        min={0.5}
                        max={1.8}
                        step={0.05}
                        format={multiplier}
                        onChange={(value) => apply({ fishSize: value })}
                      />
                    </div>
                    <div className="koi-details">
                      <ChoiceControl
                        id="behavior"
                        label="Movement"
                        value={config.behavior}
                        onChange={(value) =>
                          apply({ behavior: value as PondConfig["behavior"] })
                        }
                        choices={[
                          { value: "wander", label: "Wander freely" },
                          { value: "school", label: "Swim together" },
                          { value: "circle", label: "Circle the pond" },
                        ]}
                      />
                      <fieldset className="variety-field">
                        <legend>Varieties</legend>
                        <div className="variety-grid">
                          {api.VARIETIES.map((variety) => (
                            <Button
                              key={variety}
                              variant="primary"
                              className="variety-button"
                              aria-pressed={config.varieties.includes(variety)}
                              disabled={
                                config.varieties.length === 1 &&
                                config.varieties.includes(variety)
                              }
                              onClick={() =>
                                apply({
                                  varieties: config.varieties.includes(variety)
                                    ? config.varieties.filter(
                                        (item) => item !== variety,
                                      )
                                    : [...config.varieties, variety],
                                })
                              }
                            >
                              <span
                                className={`fish-swatch ${variety}`}
                                aria-hidden="true"
                              />
                              {variety[0].toUpperCase() + variety.slice(1)}
                            </Button>
                          ))}
                        </div>
                      </fieldset>
                    </div>
                  </TabsContent>
                  <TabsContent value="water" className="settings-body water-settings">
                    <div className="range-grid">
                      <RangeControl
                        id="lily-density"
                        label="Lily pads"
                        value={config.lilyDensity}
                        min={0}
                        max={1}
                        step={0.05}
                        format={percent}
                        onChange={(value) => apply({ lilyDensity: value })}
                      />
                      <RangeControl
                        id="lotus-count"
                        label="Lotus flowers"
                        value={config.lotusCount}
                        min={0}
                        max={6}
                        step={1}
                        onChange={(value) => apply({ lotusCount: value })}
                      />
                      <RangeControl
                        id="ripple-intensity"
                        label="Ripples"
                        value={config.rippleIntensity}
                        min={0}
                        max={2}
                        step={0.05}
                        format={multiplier}
                        onChange={(value) => apply({ rippleIntensity: value })}
                      />
                    </div>
                    <div className="range-grid water-optics">
                      <RangeControl
                        id="water-clarity"
                        label="Water clarity"
                        value={config.waterClarity}
                        min={0}
                        max={1}
                        step={0.05}
                        format={percent}
                        onChange={(value) => apply({ waterClarity: value })}
                      />
                      <RangeControl
                        id="caustic-intensity"
                        label="Light patterns"
                        value={config.causticIntensity}
                        min={0}
                        max={1}
                        step={0.05}
                        format={percent}
                        onChange={(value) => apply({ causticIntensity: value })}
                      />
                    </div>
                    <div className="water-details">
                      <div className="color-field">
                        <label htmlFor="water-color">Water color</label>
                        <div className="color-row">
                          <Input
                            type="color"
                            id="water-color"
                            value={config.waterColor || waterColors[scene.id]}
                            onChange={(event) =>
                              apply({ waterColor: event.target.value })
                            }
                          />
                          <span>{config.waterColor || "From scene"}</span>
                          <Button
                            variant="primary"
                            id="preset-water"
                            className="small-button"
                            disabled={!config.waterColor}
                            onClick={() => apply({ waterColor: null })}
                          >
                            Reset
                          </Button>
                        </div>
                      </div>
                      <div className="plant-toggles">
                        <ToggleControl
                          id="lilies"
                          label="Lily pads"
                          checked={config.lilies}
                          onChange={(value) => apply({ lilies: value })}
                        />
                        <ToggleControl
                          id="lotus"
                          label="Lotus flowers"
                          checked={config.lotus}
                          onChange={(value) => apply({ lotus: value })}
                        />
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="atmosphere" className="settings-body">
                    <div className="atmosphere-grid">
                      <RangeControl
                        id="particle-density"
                        label="Floating particles"
                        value={config.particleDensity}
                        min={0}
                        max={1}
                        step={0.05}
                        format={percent}
                        onChange={(value) => apply({ particleDensity: value })}
                      />
                      <ChoiceControl
                        id="time-of-day"
                        label="Time of day"
                        value={String(config.timeOfDay)}
                        onChange={(value) =>
                          apply({
                            timeOfDay:
                              value === "auto" ? "auto" : Number(value),
                          })
                        }
                        choices={[
                          { value: "auto", label: "From scene" },
                          { value: "6", label: "Dawn" },
                          { value: "12", label: "Daylight" },
                          { value: "18", label: "Dusk" },
                          { value: "0", label: "Midnight" },
                          ...(!["auto", "6", "12", "18", "0"].includes(
                            String(config.timeOfDay),
                          )
                            ? [
                                {
                                  value: String(config.timeOfDay),
                                  label: clock(config.timeOfDay as number),
                                },
                              ]
                            : []),
                        ]}
                      />
                    </div>
                    <div className="atmosphere-grid">
                      <div className="seed-field">
                        <label htmlFor="seed">Scene seed</label>
                        <div className="seed-row">
                          <Input
                            id="seed"
                            type="number"
                            inputMode="numeric"
                            min={0}
                            max={4294967295}
                            value={config.seed}
                            onChange={(event) => {
                              if (event.target.value !== "")
                                apply({ seed: Number(event.target.value) });
                            }}
                          />
                          <Hint label="New scene seed">
                            <Button
                              variant="primary"
                              className="seed-button"
                              id="new-seed"
                              aria-label="New scene seed"
                              onClick={() =>
                                apply({
                                  seed: crypto.getRandomValues(
                                    new Uint32Array(1),
                                  )[0],
                                })
                              }
                            >
                              <Shuffle aria-hidden="true" />
                            </Button>
                          </Hint>
                        </div>
                      </div>
                      <ChoiceControl
                        id="detail"
                        label="Render quality"
                        value={config.detail}
                        onChange={(value) =>
                          apply({ detail: value as PondConfig["detail"] })
                        }
                        choices={[
                          { value: "fine", label: "Fine detail" },
                          { value: "balanced", label: "Balanced" },
                        ]}
                      />
                    </div>
                    <ToggleControl
                      id="interactive"
                      label="Pointer interactions"
                      checked={config.interactive}
                      onChange={(value) => apply({ interactive: value })}
                    />
                  </TabsContent>
                </Tabs>
              </DockPanel>
              <Hint
                label={config.paused ? "Resume swimming" : "Pause swimming"}
              >
                <Button
                  variant="primary"
                  className="dock-button icon-button"
                  id="pause"
                  aria-label={config.paused ? "Resume pond" : "Pause pond"}
                  aria-pressed={config.paused}
                  onClick={() => controller.current?.toggle()}
                >
                  {config.paused ? (
                    <Play aria-hidden="true" />
                  ) : (
                    <Pause aria-hidden="true" />
                  )}
                </Button>
              </Hint>
              <Hint label="Surprise me">
                <Button
                  variant="primary"
                  className="dock-button icon-button"
                  id="randomize"
                  aria-label="Randomize pond"
                  onClick={() => {
                    controller.current?.randomize();
                    setNotice("A new pond, just for you");
                  }}
                >
                  <Shuffle aria-hidden="true" />
                </Button>
              </Hint>
              <div className="dock-divider second-divider" aria-hidden="true" />
              <DockPanel
                id="embed"
                open={open}
                setOpen={setOpen}
                title="Take this pond with you"
                hint="Copy install command"
                className="embed-popover"
                trigger={
                  <Button
                    variant="primary"
                    className="dock-button embed-trigger"
                    id="embed"
                    onClick={() =>
                      void copy(INSTALL_COMMAND, "Install command", "install")
                    }
                    aria-label="Copy the command"
                  >
                    <Code2 aria-hidden="true" />
                    <span className="dock-label">Copy the command</span>
                  </Button>
                }
              >
                <div className="install-row">
                  <code id="install-command">{INSTALL_COMMAND}</code>
                  <Hint label="Copy install command">
                    <Button
                      variant="primary"
                      className="copy-button"
                      id="copy-install"
                      aria-label="Copy install command"
                      onClick={() =>
                        void copy(INSTALL_COMMAND, "Install command", "install")
                      }
                    >
                      {copied === "install" ? (
                        <Check aria-hidden="true" />
                      ) : (
                        <Copy aria-hidden="true" />
                      )}
                    </Button>
                  </Hint>
                </div>
                <p className="install-note">
                  Install from GitHub. No runtime dependencies.
                </p>
                <Tabs
                  value={target}
                  onValueChange={(value) => {
                    setTarget(value);
                    setImportError("");
                    setFallbackText("");
                  }}
                >
                  <TabsList
                    className="panel-tabs code-tabs"
                    aria-label="Integration format"
                  >
                    {targets.map((item) => (
                      <TabsTrigger
                        key={item.id}
                        value={item.id}
                        data-target={item.id}
                      >
                        {item.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {targets
                    .filter((item) => item.id !== target)
                    .map((item) => (
                      <TabsContent key={item.id} value={item.id} />
                    ))}
                  <TabsContent value={target} className="embed-body">
                    {fallbackText ? (
                      <div className="clipboard-fallback">
                        <label htmlFor="copy-fallback">Select and copy</label>
                        <Textarea
                          ref={fallback}
                          id="copy-fallback"
                          value={fallbackText}
                          readOnly
                        />
                      </div>
                    ) : target === "import" ? (
                      <div className="import-body">
                        <label className="sr-only" htmlFor="import-config">
                          Configuration JSON
                        </label>
                        <Textarea
                          id="import-config"
                          value={imported}
                          onChange={(event) => {
                            setImported(event.target.value);
                            setImportError("");
                          }}
                          placeholder="Paste a pond configuration…"
                          spellCheck={false}
                          aria-invalid={!!importError}
                          aria-describedby={
                            importError ? "import-error" : undefined
                          }
                        />
                        {importError && (
                          <p
                            className="import-error"
                            id="import-error"
                            role="alert"
                          >
                            {importError}
                          </p>
                        )}
                        <Button
                          variant="primary"
                          className="action-button"
                          id="apply-config"
                          onClick={() => {
                            try {
                              controller.current?.setConfig(imported);
                              setImportError("");
                              setNotice("Your pond is ready");
                            } catch (error) {
                              setImportError((error as Error).message);
                            }
                          }}
                        >
                          Apply configuration
                        </Button>
                      </div>
                    ) : (
                      <>
                        <pre
                          className="code-preview"
                          tabIndex={0}
                          aria-label="Current integration code"
                        >
                          <code id="embed-code">{code}</code>
                        </pre>
                        <div className="embed-footer">
                          <Button
                            variant="primary"
                            className="action-button"
                            id="share"
                            onClick={share}
                          >
                            {copied === "link" ? (
                              <Check aria-hidden="true" />
                            ) : (
                              <Link aria-hidden="true" />
                            )}
                            Copy link
                          </Button>
                          <Button
                            variant="primary"
                            className="action-button"
                            id={target === "json" ? "copy-json" : "copy-code"}
                            onClick={() =>
                              void copy(
                                target === "json"
                                  ? api.serializeConfig(current())
                                  : generateSnippet(current(), target),
                                target === "json" ? "Configuration" : "Code",
                                "code",
                              )
                            }
                          >
                            {copied === "code" ? (
                              <Check aria-hidden="true" />
                            ) : (
                              <Copy aria-hidden="true" />
                            )}
                            {copied === "code"
                              ? "Copied"
                              : target === "json"
                                ? "Copy JSON"
                                : "Copy code"}
                          </Button>
                        </div>
                      </>
                    )}
                  </TabsContent>
                </Tabs>
              </DockPanel>
              <DockPanel
                id="more"
                open={open}
                setOpen={setOpen}
                title="A little more"
                hint="More pond actions"
                className="more-popover"
                trigger={
                  <Button
                    variant="primary"
                    className="dock-button icon-button more-trigger"
                    id="more"
                    aria-label="More actions"
                  >
                    <MoreHorizontal aria-hidden="true" />
                  </Button>
                }
              >
                <div className="more-actions">
                  <Button
                    variant="primary"
                    className="menu-button"
                    id="quiet-view"
                    onClick={() => {
                      setOpen(null);
                      setQuiet(true);
                    }}
                  >
                    <EyeOff aria-hidden="true" />
                    Quiet view
                  </Button>
                  <Button
                    variant="primary"
                    className="menu-button"
                    id="snapshot"
                    onClick={snapshot}
                  >
                    <Download aria-hidden="true" />
                    Save image
                  </Button>
                  <Button
                    variant="primary"
                    className="menu-button"
                    id="reset"
                    onClick={() => {
                      controller.current?.resetToDefaults();
                      setOpen(null);
                      setNotice("Back to the beginning");
                    }}
                  >
                    <RotateCcw aria-hidden="true" />
                    Reset pond
                  </Button>
                  <Button
                    variant="primary"
                    className="menu-button"
                    onClick={share}
                  >
                    <Link aria-hidden="true" />
                    Copy share link
                  </Button>
                </div>
                <div className="interaction-help">
                  <p>
                    <span>Stir the water</span>
                    <span>Move your pointer</span>
                  </p>
                  <p>
                    <span>Feed the koi</span>
                    <span>Click or tap</span>
                  </p>
                  <p>
                    <span>Pause / resume</span>
                    <kbd>Space</kbd>
                  </p>
                  <p>
                    <span>Feed with keyboard</span>
                    <kbd>Enter</kbd>
                  </p>
                </div>
                <a
                  className="source-link"
                  href="https://github.com/dhruvil-codes/koi-pond"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <GitFork aria-hidden="true" />
                  Made for your corner of the web<span>Source</span>
                </a>
              </DockPanel>
            </nav>
          </div>
          {quiet && (
            <Button
              variant="primary"
              className="restore-controls"
              aria-label="Show pond controls"
              onClick={() => {
                setQuiet(false);
                requestAnimationFrame(() => document.getElementById("more")?.focus());
              }}
            >
              <Eye aria-hidden="true" />
              <span>Show controls</span>
              <kbd>Esc</kbd>
            </Button>
          )}
          <div
            className={`pond-notice ${notice ? "is-visible" : ""}`}
            role="status"
            aria-live="polite"
            aria-atomic="true"
            id="status"
          >
            {notice}
          </div>
        </main>
      </TooltipProvider>
    </PanelIsOpen.Provider>
  );
}
