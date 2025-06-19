require('dotenv').config();

const fastify = require('fastify')({ logger: true });

fastify.register(require('@fastify/multipart'), {
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB
  }
});

fastify.register(require('@fastify/cors'), {
  origin: '*',
});

// Register Swagger
fastify.register(require('@fastify/swagger'), {
  routePrefix: '/docs',
  openapi: {
    info: {
      title: 'Image API',
      description: 'API documentation for the Image API',
      version: '1.0.0',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Local server',
      },
    ],
    components: {},
    tags: [],
  },
  exposeRoute: true,
});


fastify.register(require('@fastify/swagger-ui'), {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'full',
    deepLinking: false,
  },
  staticCSP: true,
  transformStaticCSP: (header) => header,
});



fastify.register(require('./routes/postImage'));
fastify.register(require('./routes/getImage'));

const start = async () => {
  try {
    await fastify.listen({ port: process.env.PORT || 3000, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
