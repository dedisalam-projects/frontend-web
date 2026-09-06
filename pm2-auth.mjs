process.env.NG_ALLOWED_HOSTS = 'localhost,localhost:4000,localhost:4001,localhost:4002,127.0.0.1,127.0.0.1:4000,127.0.0.1:4001,127.0.0.1:4002';
import express from 'express';

const { reqHandler } = await import('./dist/auth/server/server.mjs');

const app = express();
app.use(reqHandler);
app.listen(process.env.PORT || 4002, () => {
    console.log(`Auth server listening on port ${process.env.PORT || 4002}`);
});
