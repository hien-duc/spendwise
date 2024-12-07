const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'SpendWise API Documentation',
            version: '1.0.0',
            description: 'API documentation for SpendWise financial management application',
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
            schemas: {
                Transaction: {
                    type: 'object',
                    required: ['amount', 'type', 'date', 'category_id'],
                    properties: {
                        amount: {
                            type: 'number',
                            description: 'Transaction amount',
                        },
                        type: {
                            type: 'string',
                            enum: ['expense', 'income', 'investment'],
                            description: 'Type of transaction',
                        },
                        date: {
                            type: 'string',
                            format: 'date',
                            description: 'Transaction date',
                        },
                        category_id: {
                            type: 'string',
                            format: 'uuid',
                            description: 'Category ID',
                        },
                        note: {
                            type: 'string',
                            description: 'Optional transaction note',
                        },
                    },
                },
                Category: {
                    type: 'object',
                    required: ['name', 'type', 'icon', 'color'],
                    properties: {
                        name: {
                            type: 'string',
                            description: 'Category name',
                        },
                        type: {
                            type: 'string',
                            enum: ['expense', 'income', 'investment'],
                            description: 'Category type',
                        },
                        icon: {
                            type: 'string',
                            description: 'Icon name',
                        },
                        color: {
                            type: 'string',
                            description: 'Color code (hex)',
                        },
                    },
                },
                Profile: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            description: 'User name',
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'User email',
                        },
                        theme_color: {
                            type: 'string',
                            description: 'UI theme color preference',
                        },
                    },
                },
            },
        },
        security: [
            {
                BearerAuth: [],
            },
        ],
    },
    apis: ['./routes/*.js'], // Path to the API routes
};

module.exports = swaggerJsdoc(options);
