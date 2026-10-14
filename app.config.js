const baseConfig = require("./app.json");

const TEST_ADMOB_APP_IDS = {
  android: "ca-app-pub-3940256099942544~3347511713",
  ios: "ca-app-pub-3940256099942544~1458002511",
};

module.exports = ({ config }) => {
  const projectId = process.env.EAS_PROJECT_ID;
  const owner = process.env.EXPO_OWNER;
  const plugins = (config.plugins || []).map((plugin) => {
    if (!Array.isArray(plugin) || plugin[0] !== "react-native-google-mobile-ads") return plugin;
    return [
      plugin[0],
      {
        ...plugin[1],
        androidAppId: process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID || TEST_ADMOB_APP_IDS.android,
        iosAppId: process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID || TEST_ADMOB_APP_IDS.ios,
      },
    ];
  });

  return {
    ...baseConfig.expo,
    ...config,
    ...(owner ? { owner } : {}),
    plugins,
    extra: {
      ...(config.extra || {}),
      ...(projectId ? { eas: { projectId } } : {}),
    },
  };
};
