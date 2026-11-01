export type MazeTheme = {
  wall: string;
  signal: string;
  exit: string;
  muted: string;
};

// Used only if a token is missing; the real values live in globals.css
const FALLBACK_THEME: MazeTheme = {
  wall: "#cfcabb",
  signal: "#ffb000",
  exit: "#ece9e0",
  muted: "#9296a0",
};

const readToken = (styles: CSSStyleDeclaration, token: string, fallback: string): string =>
  styles.getPropertyValue(token).trim() || fallback;

// The canvas draws with the same colours as the rest of the interface
export const readMazeTheme = (element: Element): MazeTheme => {
  const styles = getComputedStyle(element);
  return {
    wall: readToken(styles, "--wall", FALLBACK_THEME.wall),
    signal: readToken(styles, "--signal", FALLBACK_THEME.signal),
    exit: readToken(styles, "--text", FALLBACK_THEME.exit),
    muted: readToken(styles, "--text-dim", FALLBACK_THEME.muted),
  };
};