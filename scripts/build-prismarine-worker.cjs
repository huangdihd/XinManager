/*
 * Rebuild prismarine-viewer's meshing worker (public/worker.js) against the
 * project's CURRENT prismarine-chunk (1.40) + minecraft-data (3.110, which
 * supports 1.21.11). Uses a slim minecraft-data shim that only bundles 1.21.11
 * pc data, keeping the worker at ~2MB.
 */
const path = require('path')
const webpack = require('webpack')

webpack({
  entry: path.resolve(__dirname, 'prismarine-worker-entry.cjs'),
  mode: 'production',
  output: {
    // The viewer page lives at /viewer/[id], so prismarine-viewer's
    // `new Worker('worker.js')` resolves relative to /viewer/ — the worker
    // MUST be emitted to public/viewer/worker.js, not public/worker.js.
    path: path.resolve(__dirname, '../public/viewer'),
    filename: 'worker.js'
  },
  resolve: {
    fallback: { zlib: false },
    alias: {
      // Replace the full minecraft-data with a slim wrapper (1.21.11 only)
      'minecraft-data$': path.resolve(__dirname, 'minecraft-data-slim.cjs')
    }
  },
  plugins: [
    new webpack.ProvidePlugin({ process: 'process/browser' }),
    new webpack.ProvidePlugin({ Buffer: ['buffer', 'Buffer'] })
  ]
}, (err, stats) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log(stats.toString({ colors: false, chunks: false, modules: false, children: false }))
  if (stats.hasErrors()) process.exit(1)
})
