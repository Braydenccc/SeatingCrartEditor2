// Electron preload script
// contextIsolation is enabled; this script runs in a privileged context and bridges
// safe values to the renderer via contextBridge. Currently exposes only the OS platform.
const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    platform: process.platform
})
