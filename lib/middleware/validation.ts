import { NextRequest, NextResponse } from 'next/server';
import { z, ZodSchema } from 'zod';

// Types pour les erreurs de validation
interface ValidationErrorDetail {
  field: string;
  message: string;
  code: string;
}

interface ValidationErrorResponse {
  error: string;
  details: ValidationErrorDetail[];
  timestamp: string;
}

// Fonction pour formater les erreurs Zod
function formatZodErrors(error: z.ZodError): ValidationErrorDetail[] {
  return error.issues.map(err => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code
  }));
}

// Middleware de validation pour le body de la requête
export function withValidation<T>(schema: ZodSchema<T>) {
  return function(
    handler: (req: NextRequest, validatedData: T) => Promise<NextResponse>
  ) {
    return async function(req: NextRequest): Promise<NextResponse> {
      try {
        // Parser le body de la requête
        let body;
        try {
          body = await req.json();
        } catch (parseError) {
          return NextResponse.json({
            error: 'Corps de requête JSON invalide',
            details: [],
            timestamp: new Date().toISOString()
          } as ValidationErrorResponse, { status: 400 });
        }

        // Valider avec le schéma Zod
        const validatedData = schema.parse(body);
        
        // Appeler le handler avec les données validées
        return handler(req, validatedData);

      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json({
            error: 'Données de requête invalides',
            details: formatZodErrors(error),
            timestamp: new Date().toISOString()
          } as ValidationErrorResponse, { status: 400 });
        }

        // Re-lancer les autres erreurs
        throw error;
      }
    };
  };
}

// Middleware de validation pour les paramètres de requête (query params)
export function withQueryValidation<T>(schema: ZodSchema<T>) {
  return function(
    handler: (req: NextRequest, validatedQuery: T) => Promise<NextResponse>
  ) {
    return async function(req: NextRequest): Promise<NextResponse> {
      try {
        const url = new URL(req.url);
        const queryParams = Object.fromEntries(url.searchParams.entries());

        // Convertir les paramètres numériques
        const processedParams: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(queryParams)) {
          if (value === '') {
            processedParams[key] = undefined;
          } else if (!isNaN(Number(value)) && value !== '') {
            processedParams[key] = Number(value);
          } else if (value === 'true' || value === 'false') {
            processedParams[key] = value === 'true';
          } else {
            processedParams[key] = value;
          }
        }

        const validatedQuery = schema.parse(processedParams);
        return handler(req, validatedQuery);

      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json({
            error: 'Paramètres de requête invalides',
            details: formatZodErrors(error),
            timestamp: new Date().toISOString()
          } as ValidationErrorResponse, { status: 400 });
        }

        throw error;
      }
    };
  };
}

// Middleware combiné pour body + query params
export function withFullValidation<TBody, TQuery>(
  bodySchema: ZodSchema<TBody>,
  querySchema: ZodSchema<TQuery>
) {
  return function(
    handler: (
      req: NextRequest, 
      validatedData: TBody, 
      validatedQuery: TQuery
    ) => Promise<NextResponse>
  ) {
    return async function(req: NextRequest): Promise<NextResponse> {
      try {
        // Valider le body
        let body;
        try {
          body = await req.json();
        } catch (parseError) {
          return NextResponse.json({
            error: 'Corps de requête JSON invalide',
            details: [],
            timestamp: new Date().toISOString()
          } as ValidationErrorResponse, { status: 400 });
        }

        const validatedData = bodySchema.parse(body);

        // Valider les query params
        const url = new URL(req.url);
        const queryParams = Object.fromEntries(url.searchParams.entries());
        
        const processedParams: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(queryParams)) {
          if (value === '') {
            processedParams[key] = undefined;
          } else if (!isNaN(Number(value)) && value !== '') {
            processedParams[key] = Number(value);
          } else if (value === 'true' || value === 'false') {
            processedParams[key] = value === 'true';
          } else {
            processedParams[key] = value;
          }
        }

        const validatedQuery = querySchema.parse(processedParams);

        return handler(req, validatedData, validatedQuery);

      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json({
            error: 'Données de requête invalides',
            details: formatZodErrors(error),
            timestamp: new Date().toISOString()
          } as ValidationErrorResponse, { status: 400 });
        }

        throw error;
      }
    };
  };
}

// Fonction utilitaire pour valider manuellement des données
export function validateData<T>(schema: ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: ValidationErrorDetail[];
} {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        errors: formatZodErrors(error) 
      };
    }
    throw error;
  }
}

// Schémas de validation courants
export const CommonSchemas = {
  id: z.string().cuid("ID invalide"),
  pagination: z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20)
  }),
  search: z.object({
    search: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
  })
};