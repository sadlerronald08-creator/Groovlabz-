// Locally-bundled fonts so they always render on device (no network dependency).
export const fontMap = {
  // Orbitron (display / brand)
  Orbitron: require("../assets/fonts/Orbitron-Regular.ttf"),
  OrbitronBold: require("../assets/fonts/Orbitron-Bold.ttf"),
  OrbitronBlack: require("../assets/fonts/Orbitron-Black.ttf"),
  // Rajdhani (numeric / timecodes)
  Rajdhani: require("../assets/fonts/Rajdhani-Medium.ttf"),
  RajdhaniBold: require("../assets/fonts/Rajdhani-Bold.ttf"),
  // IBM Plex Sans (body)
  IBMPlexSans: require("../assets/fonts/IBMPlexSans-Regular.ttf"),
  IBMPlexSansMedium: require("../assets/fonts/IBMPlexSans-Medium.ttf"),
};
