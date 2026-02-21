import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Autofill.AI API",
      version: "1.0.0",
      description: "API for AI-powered form autofill generation",
      contact: {
        name: "API Support",
      },
    },
    servers: [
      {
        url: "/api/v1",
        description: "API v1 server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            error: {
              type: "string",
              example: "Error message",
            },
            details: {
              type: "string",
              nullable: true,
            },
          },
        },
        FormField: {
          type: "object",
          required: ["key"],
          properties: {
            key: {
              type: "string",
              description: "Unique identifier for the field",
              example: "email",
            },
            label: {
              type: "string",
              description: "Human-readable label",
              example: "Email Address",
            },
            type: {
              type: "string",
              description: "HTML input type",
              example: "email",
            },
            options: {
              type: "array",
              description: "Options for select fields",
              items: {
                type: "object",
                properties: {
                  value: { type: "string" },
                  label: { type: "string" },
                },
              },
            },
            currentValue: {
              type: "string",
              description:
                "Current value of the field (used with fillOnlyEmpty)",
            },
          },
        },
        AnalyzeFormRequest: {
          type: "object",
          required: ["fields"],
          properties: {
            fields: {
              type: "array",
              items: {
                $ref: "#/components/schemas/FormField",
              },
              description: "Array of form fields to analyze",
            },
            context: {
              type: "string",
              description: "Form purpose or title",
              example: "Job Application",
            },
            pageUrl: {
              type: "string",
              description: "URL of the page containing the form",
              example: "https://example.com/apply",
            },
            pageTitle: {
              type: "string",
              description: "Title of the page",
              example: "Apply Now - Company Inc",
            },
            fillOnlyEmpty: {
              type: "boolean",
              description: "Only fill fields that are currently empty",
              default: false,
            },
          },
        },
        AnalyzeFormResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            data: {
              type: "object",
              additionalProperties: {
                oneOf: [{ type: "string" }, { type: "number" }],
              },
              example: {
                email: "john.doe@example.com",
                firstName: "John",
                lastName: "Doe",
                phone: "+1234567890",
              },
            },
          },
        },
        HealthResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            data: {
              type: "object",
              properties: {
                ok: {
                  type: "boolean",
                  example: true,
                },
                timestamp: {
                  type: "string",
                  format: "date-time",
                },
              },
            },
          },
        },
        AuthRegisterRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "user@example.com",
            },
            password: {
              type: "string",
              format: "password",
              minLength: 8,
              example: "securepassword123",
            },
            name: {
              type: "string",
              example: "John Doe",
            },
          },
        },
        AuthLoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "user@example.com",
            },
            password: {
              type: "string",
              format: "password",
              example: "securepassword123",
            },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            data: {
              type: "object",
              properties: {
                accessToken: {
                  type: "string",
                  description: "JWT access token (short-lived)",
                  example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                },
                user: {
                  $ref: "#/components/schemas/User",
                },
              },
            },
          },
        },
        User: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              example: "550e8400-e29b-41d4-a716-446655440000",
            },
            email: {
              type: "string",
              format: "email",
              example: "user@example.com",
            },
            name: {
              type: "string",
              nullable: true,
              example: "John Doe",
            },
            isEmailVerified: {
              type: "boolean",
              example: false,
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.js"],
};

export default swaggerJsdoc(options);
