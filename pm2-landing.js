process.env.PORT = 4001;
process.env.NG_ALLOWED_HOSTS = 'localhost,127.0.0.1,dedisalam.my.id,auth.dedisalam.my.id,dash.dedisalam.my.id';
import('./dist/landing/server/server.mjs').catch((err) => {
    console.error(err);
    process.exit(1);
});
