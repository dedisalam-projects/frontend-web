process.env.PORT = 4001;
process.env.NG_ALLOWED_HOSTS = 'localhost,127.0.0.1';
import('./dist/landing/server/server.mjs').catch(err => {
    console.error(err);
    process.exit(1);
});
