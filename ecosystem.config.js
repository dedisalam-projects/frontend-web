module.exports = {
    apps: [
        {
            name: 'dashboard',
            script: 'pm2-dashboard.mjs',
            env: {
                PORT: 4000,
                NG_ALLOWED_HOSTS: 'localhost,127.0.0.1,dedisalam.my.id,auth.dedisalam.my.id,dash.dedisalam.my.id'
            }
        },
        {
            name: 'landing',
            script: 'pm2-landing.mjs',
            env: {
                PORT: 4001,
                NG_ALLOWED_HOSTS: 'localhost,127.0.0.1,dedisalam.my.id,auth.dedisalam.my.id,dash.dedisalam.my.id'
            }
        },
        {
            name: 'auth',
            script: 'pm2-auth.mjs',
            env: {
                PORT: 4002,
                NG_ALLOWED_HOSTS: 'localhost,127.0.0.1,dedisalam.my.id,auth.dedisalam.my.id,dash.dedisalam.my.id'
            }
        }
    ]
};
