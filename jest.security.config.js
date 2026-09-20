const baseConfig = require('./jest.config.js')

module.exports = async () => {
  const resolved = typeof baseConfig === 'function' ? await baseConfig() : baseConfig
  return {
    ...resolved,
    testEnvironment: 'node',
  }
}
