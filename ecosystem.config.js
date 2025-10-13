module.exports = {
  apps: [{
    name: 'aidashboard-api',
    script: './src/app.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env_file: '.env',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
