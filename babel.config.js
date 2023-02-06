const presets = ['@babel/preset-react']

const plugins = [
  [
    './dist/index.js',
    {
      env: 'production',
      exclude: ['error', 'warn'],
      // commonWords: ['no-remove', 'retain']
    }
  ]
]
module.exports = { presets, plugins }
