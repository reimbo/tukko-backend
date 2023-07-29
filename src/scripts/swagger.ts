const swaggerJsdoc = require("swagger-jsdoc");

// Set Swagger's specs
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Express API for the Tukko database.",
      version: "1.0.0",
      description:
        "This documentation is for the REST API created for the Tukko database server. The API and database were developed by the IoTitude team during WIMMA Lab 2023.",
      license: {
        name: "Licensed Under MIT",
        url: "https://spdx.org/licenses/MIT.html",
      },
      contact: {
        name: "WIMMA Lab",
        url: "https://www.wimmalab.org",
      },
    },
    servers: [
      {
        url: (process.env.TUKKO_DOMAIN || "http://localhost:3001") as string,
        description: "Tukko API",
      },
    ],
  },
  // Define the path to files containing annotations
  apis: ["./routes/redis/*.js"],
};
// Initialize swagger-jsdoc -> returns validated swagger spec in json format
export const swaggerSpec = swaggerJsdoc(options);
