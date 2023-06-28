const swaggerJsdoc = require('swagger-jsdoc');

// Set Swagger's specs
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Express API for the Travis database.',
            version: '1.0.0',
            description: 'This is the documentation of the REST API made for the Travis database server. The API and the database are developed by the IoTitude team during WIMMA Lab 2023.',
            license: {
                name: 'Licensed Under MIT',
                url: 'https://spdx.org/licenses/MIT.html',
            },
            contact: {
                name: 'WIMMA Lab',
                url: 'https://www.wimmalab.org',
            },
        },
        servers: [
            {
                url: (process.env.TRAVIS_DOMAIN || 'http://localhost:3001') as string,
                description: 'Travis API',
            },
        ],
    },
    // Define the path to files containing annotations
    apis: ['./dist/routes/redis/*.js']
}
// Initialize swagger-jsdoc -> returns validated swagger spec in json format
export const swaggerSpec = swaggerJsdoc(options)