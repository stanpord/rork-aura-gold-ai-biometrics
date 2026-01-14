import { z } from "zod";
import { publicProcedure, createTRPCRouter } from "../create-context";

const DB_ENDPOINT = process.env.EXPO_PUBLIC_RORK_DB_ENDPOINT;
const DB_NAMESPACE = process.env.EXPO_PUBLIC_RORK_DB_NAMESPACE;
const DB_TOKEN = process.env.EXPO_PUBLIC_RORK_DB_TOKEN;

const leadSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  auraScore: z.number(),
  faceType: z.string(),
  estimatedValue: z.number(),
  roadmap: z.array(z.object({
    name: z.string(),
    benefit: z.string(),
    price: z.string(),
    clinicalReason: z.string(),
  })),
  peptides: z.array(z.object({
    name: z.string(),
    goal: z.string(),
    mechanism: z.string(),
    frequency: z.string(),
  })),
  ivDrips: z.array(z.object({
    name: z.string(),
    benefit: z.string(),
    ingredients: z.string(),
    duration: z.string(),
  })),
  selectedTreatments: z.array(z.object({
    treatment: z.object({
      name: z.string(),
      benefit: z.string().optional(),
      price: z.string().optional(),
      clinicalReason: z.string().optional(),
      goal: z.string().optional(),
      mechanism: z.string().optional(),
      frequency: z.string().optional(),
      ingredients: z.string().optional(),
      duration: z.string().optional(),
    }),
    treatmentType: z.enum(['procedure', 'peptide', 'iv']),
    dosing: z.object({
      depth: z.string().optional(),
      energy: z.string().optional(),
      passes: z.string().optional(),
      units: z.string().optional(),
      volume: z.string().optional(),
      dilution: z.string().optional(),
      injectionSites: z.string().optional(),
      customNotes: z.string().optional(),
    }),
    selectedAt: z.string(),
    selectedBy: z.string().optional(),
    complianceSignOff: z.object({
      acknowledged: z.boolean(),
      practitionerSignature: z.string(),
      signedAt: z.string(),
      timestamp: z.string(),
    }).optional(),
  })).optional(),
  status: z.enum(['new', 'contacted', 'converted']),
  createdAt: z.string(),
});



async function dbQuery(sql: string, bindings: Record<string, unknown> = {}) {
  if (!DB_ENDPOINT || !DB_NAMESPACE || !DB_TOKEN) {
    console.log('Database not configured');
    throw new Error('Database not configured');
  }

  console.log('DB Query:', sql);
  
  const response = await fetch(`${DB_ENDPOINT}/sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DB_TOKEN}`,
      'surreal-ns': DB_NAMESPACE,
      'surreal-db': 'main',
    },
    body: JSON.stringify({ sql, bindings }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.log('DB Error:', errorText);
    throw new Error(`Database error: ${response.status}`);
  }

  const result = await response.json();
  console.log('DB Result:', JSON.stringify(result));
  return result;
}

export const leadsRouter = createTRPCRouter({
  getAll: publicProcedure.query(async () => {
    console.log('Fetching all leads from database');
    
    try {
      const result = await dbQuery('SELECT * FROM leads ORDER BY createdAt DESC');
      
      if (result && result[0] && result[0].result) {
        const leads = result[0].result.map((row: Record<string, unknown>) => ({
          id: String(row.id).replace('leads:', ''),
          name: row.name,
          phone: row.phone,
          auraScore: row.auraScore,
          faceType: row.faceType,
          estimatedValue: row.estimatedValue,
          roadmap: row.roadmap || [],
          peptides: row.peptides || [],
          ivDrips: row.ivDrips || [],
          selectedTreatments: row.selectedTreatments || [],
          status: row.status,
          createdAt: row.createdAt,
        }));
        console.log('Fetched leads:', leads.length);
        return { success: true, leads };
      }
      
      return { success: true, leads: [] };
    } catch (error) {
      console.log('Error fetching leads:', error);
      return { success: false, leads: [], error: String(error) };
    }
  }),

  create: publicProcedure
    .input(leadSchema)
    .mutation(async ({ input }) => {
      console.log('Creating lead:', input.name);
      
      try {
        const sql = `CREATE leads:${input.id} SET 
          name = $name,
          phone = $phone,
          auraScore = $auraScore,
          faceType = $faceType,
          estimatedValue = $estimatedValue,
          roadmap = $roadmap,
          peptides = $peptides,
          ivDrips = $ivDrips,
          selectedTreatments = $selectedTreatments,
          status = $status,
          createdAt = $createdAt`;

        await dbQuery(sql, {
          name: input.name,
          phone: input.phone,
          auraScore: input.auraScore,
          faceType: input.faceType,
          estimatedValue: input.estimatedValue,
          roadmap: input.roadmap,
          peptides: input.peptides,
          ivDrips: input.ivDrips,
          selectedTreatments: input.selectedTreatments || [],
          status: input.status,
          createdAt: input.createdAt,
        });

        console.log('Lead created successfully:', input.id);
        return { success: true, id: input.id };
      } catch (error) {
        console.log('Error creating lead:', error);
        return { success: false, error: String(error) };
      }
    }),

  update: publicProcedure
    .input(z.object({
      id: z.string(),
      data: leadSchema.partial(),
    }))
    .mutation(async ({ input }) => {
      console.log('Updating lead:', input.id);
      
      try {
        const updates: string[] = [];
        const bindings: Record<string, unknown> = {};

        Object.entries(input.data).forEach(([key, value]) => {
          if (value !== undefined && key !== 'id') {
            updates.push(`${key} = $${key}`);
            bindings[key] = value;
          }
        });

        if (updates.length === 0) {
          return { success: true };
        }

        const sql = `UPDATE leads:${input.id} SET ${updates.join(', ')}`;
        await dbQuery(sql, bindings);

        console.log('Lead updated successfully:', input.id);
        return { success: true };
      } catch (error) {
        console.log('Error updating lead:', error);
        return { success: false, error: String(error) };
      }
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      console.log('Deleting lead:', input.id);
      
      try {
        await dbQuery(`DELETE leads:${input.id}`);
        console.log('Lead deleted successfully:', input.id);
        return { success: true };
      } catch (error) {
        console.log('Error deleting lead:', error);
        return { success: false, error: String(error) };
      }
    }),
});
