const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)

// Required for Firebase v9+ modular SDK subpath imports (firebase/auth, firebase/firestore, etc.)
config.resolver.unstable_enablePackageExports = true

module.exports = config
