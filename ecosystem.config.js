module.exports = {
  apps: [
    {
      name: 'fish-auction',
      script: 'npm',
      args: 'start',
      instances: 'max', // Use all CPU cores
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      // Restart policy
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      
      // Logging
      log_file: './logs/app.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Health monitoring
      health_check_grace_period: 10000,
      min_uptime: 10000,
      max_restarts: 5,
      
      // Environment specific overrides
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3001
      }
    }
  ],
  
  deploy: {
    production: {
      user: 'deploy',
      host: ['your-server.com'],
      ref: 'origin/main',
      repo: 'https://github.com/your-org/fish-auction-proto1.git',
      path: '/var/www/fish-auction',
      'pre-deploy-local': '',
      'post-deploy': 'npm ci && npm run build:prod && npm run deploy:prep && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'mkdir -p logs'
    }
  }
};
