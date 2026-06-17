module.exports = {
  apps: [{
    name: "beacon-backend",
    script: "./dist/main.js",
    instances: "max",
    exec_mode: "cluster",
    env: {
      NODE_ENV: "production",
    }
  }]
}
