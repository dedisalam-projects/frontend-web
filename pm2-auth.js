process.env.PORT = 4002;
process.env.NG_ALLOWED_HOSTS = 'localhost,127.0.0.1';
import('./dist/auth/server/server.mjs').catch(err => {
    console.error(err);
    process.exit(1);
});
