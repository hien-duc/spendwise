const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SpendWise API Documentation',
      version: '1.0.0',
      description: 'API documentation for SpendWise financial tracking application',
      contact: {
        name: 'SpendWise Support',
        url: 'https://spendwise.com/support',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: ['./routes/*.js', './index.js'], // Path to the API routes
};

module.exports = swaggerJsdoc(options);
