module.exports = {
    apps: [
    {
      name: 'ghost-rebrand',
      script: 'npm',
      args: 'run start',
      env_production: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'worker',
      script: 'npm',
      args: 'run worker',
      instances: 3, // creates 3 worker processes
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
}