/*
 *   Copyright (C) 2025 huangdihd
 *
 *   This program is free software: you can redistribute it and/or modify
 *   it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation, either version 3 of the License, or
 *   (at your option) any later version.
 *
 *   This program is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU General Public License for more details.
 *
 *   You should have received a copy of the GNU General Public License
 *   along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { fileURLToPath } from 'node:url'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    devtools: { enabled: true },
    modules: [
        '@nuxt/ui'
    ],
    css: ['~/assets/css/main.css'],
    fonts: {
        provider: 'bunny'
    },
    vite: {
        plugins: [
            // prismarine-chunk / prismarine-world rely on Node Buffer/process/path
            // in the browser (the world viewer). Polyfill them for the client.
            nodePolyfills({
                include: ['buffer', 'process', 'events', 'path', 'stream', 'zlib'],
                globals: { Buffer: true, process: true, global: true }
            })
        ],
        // Force prismarine-viewer's utils.js down its browser branch and stub the
        // Node-only canvas deps it pulls in (createCanvas nameplate + safeRequire).
        define: {
            'process.platform': JSON.stringify('browser'),
            // prismarine-viewer's worldrenderer references __dirname (Node) before
            // falling back to the browser path; webpack defines it, Vite doesn't.
            __dirname: JSON.stringify('/'),
            __filename: JSON.stringify('/index.js')
        },
        resolve: {
            alias: [
                { find: /^canvas$/, replacement: fileURLToPath(new URL('./shims/canvas.mjs', import.meta.url)) },
                { find: /^node-canvas-webgl\/lib$/, replacement: fileURLToPath(new URL('./shims/empty.mjs', import.meta.url)) }
            ]
        },
        // Only prismarine-viewer/viewer (+vec3) run on the main thread; the
        // heavy prismarine-chunk/minecraft-data live in the meshing worker now.
        optimizeDeps: {
            include: ['prismarine-viewer/viewer', 'vec3'],
            esbuildOptions: {
                define: {
                    'process.platform': JSON.stringify('browser'),
                    __dirname: JSON.stringify('/'),
                    __filename: JSON.stringify('/index.js')
                },
                alias: {
                    canvas: fileURLToPath(new URL('./shims/canvas.mjs', import.meta.url)),
                    'node-canvas-webgl/lib': fileURLToPath(new URL('./shims/empty.mjs', import.meta.url))
                }
            }
        }
    },
    nitro: {
        // API routes are now handled by Nitro server/api/ handlers.
    }
})