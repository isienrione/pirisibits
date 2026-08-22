const path = require('node:path')
const { getDefaultConfig } = require('expo/metro-config')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')
const config = getDefaultConfig(projectRoot)
config.watchFolders = [workspaceRoot]
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]
config.resolver.extraNodeModules = {
  '@babel/runtime': path.resolve(projectRoot, 'node_modules/@babel/runtime'),
  'react': path.resolve(workspaceRoot, 'node_modules/react'),
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
  'react-native-web': path.resolve(projectRoot, 'node_modules/react-native-web'),
  'react-dom': path.resolve(projectRoot, 'node_modules/react-dom'),
}
module.exports = config
