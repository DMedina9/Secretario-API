import process from 'process';

if (typeof global.process === 'undefined') {
  global.process = process;
}
if (!global.process.version) {
  global.process.version = 'v16.0.0'; // mock
}
if (!global.process.versions) {
  global.process.versions = { node: '16.0.0' }; // mock
}

import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
