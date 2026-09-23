// Locally-bundled fonts so they always render on device (no network dependency).
export const fontMap = {
  // Space Grotesk (display / brand / headings)
  SpaceGroteskMedium: require("../assets/fonts/SpaceGrotesk-Medium.ttf"),
  SpaceGroteskBold: require("../assets/fonts/SpaceGrotesk-Bold.ttf"),
  // Rajdhani (condensed numerics / timecodes)
  Rajdhani: require("../assets/fonts/Rajdhani-Medium.ttf"),
  RajdhaniBold: require("../assets/fonts/Rajdhani-Bold.ttf"),
  // IBM Plex Sans (body / UI)
  IBMPlexSans: require("../assets/fonts/IBMPlexSans-Regular.ttf"),
  IBMPlexSansMedium: require("../assets/fonts/IBMPlexSans-Medium.ttf"),
};
