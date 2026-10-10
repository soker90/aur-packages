export default function createNpmConnector(context) {
  return {
    name: 'npm',
    async detect(_pkg, config) {
      const packageName = config.package
      if (typeof packageName !== 'string' || packageName.trim() === '') {
        throw new Error('npm connector requires config.package')
      }

      const response = await context.fetch(
        `https://registry.npmjs.org/${encodeURIComponent(packageName)}`,
        { headers: { accept: 'application/vnd.npm.install-v1+json' } }
      )
      if (!response.ok) {
        throw new Error(
          `npm registry request failed for ${packageName}: ${response.status} ${response.statusText}`
        )
      }

      const metadata = await response.json()
      const version = metadata?.['dist-tags']?.latest
      const source = metadata?.versions?.[version]?.dist?.tarball
      if (typeof version !== 'string' || typeof source !== 'string') {
        throw new Error(`npm registry response for ${packageName} is missing latest version metadata`)
      }

      return { version, source, metadata: { package: packageName, source } }
    }
  }
}
