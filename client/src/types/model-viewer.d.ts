declare namespace JSX {
  interface IntrinsicElements {
    "model-viewer": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        src?: string;
        alt?: string;
        ar?: boolean;
        "ar-modes"?: string;
        "ar-placement"?: "floor" | "wall";
        "camera-controls"?: boolean;
        "auto-rotate"?: boolean;
        "auto-rotate-delay"?: number;
        "rotation-per-second"?: string;
        "shadow-intensity"?: string;
        "environment-image"?: string;
        "skybox-image"?: string;
        exposure?: string;
        loading?: "auto" | "lazy" | "eager";
        reveal?: "auto" | "interaction" | "manual";
        poster?: string;
        "camera-orbit"?: string;
        "min-camera-orbit"?: string;
        "max-camera-orbit"?: string;
        "field-of-view"?: string;
        "interaction-prompt"?: "auto" | "none";
        style?: React.CSSProperties;
        ref?: React.Ref<any>;
      },
      HTMLElement
    >;
  }
}
