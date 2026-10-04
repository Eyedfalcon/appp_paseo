const { withXcodeProject } = require("expo/config-plugins");

// Expo's generated bundle phase executes an unquoted path, breaking roots with spaces.
module.exports = function withIosPaths(config) {
  return withXcodeProject(config, (mod) => {
    const phases = mod.modResults.hash.project.objects.PBXShellScriptBuildPhase;
    for (const phase of Object.values(phases)) {
      if (!phase.name?.includes("Bundle React Native") || !phase.shellScript)
        continue;
      const script = JSON.parse(phase.shellScript);
      phase.shellScript = JSON.stringify(
        script.replace(
          /^`([^\n]*react-native-xcode\.sh[^\n]*)`$/m,
          (_, command) => '"$(' + command + ')"',
        ),
      );
    }
    return mod;
  });
};
