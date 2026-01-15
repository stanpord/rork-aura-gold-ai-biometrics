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



function escapeString(value: unknown): string {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (Array.isArray(value) || typeof value === 'object') {
    return JSON.stringify(value).replace(/'/g, "\\'");
  }
  return `'${String(value).replace(/'/g, "\\'")}'`;
}

function deduplicateByName<T extends { name: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter(item => {
    if (seen.has(item.name)) {
      console.log('Removing duplicate treatment:', item.name);
      return false;
    }
    seen.add(item.name);
    return true;
  });
}

async function dbQuery(sql: string, bindings: Record<string, unknown> = {}) {
  if (!DB_ENDPOINT || !DB_NAMESPACE || !DB_TOKEN) {
    console.log('Database not configured - Endpoint:', !!DB_ENDPOINT, 'Namespace:', !!DB_NAMESPACE, 'Token:', !!DB_TOKEN);
    throw new Error('Database not configured');
  }

  let processedSql = sql;
  for (const [key, value] of Object.entries(bindings)) {
    const placeholder = `${key}`;
    const escapedValue = escapeString(value);
    processedSql = processedSql.split(placeholder).join(escapedValue);
  }

  console.log('DB Query (processed):', processedSql.substring(0, 500));
  
  const response = await fetch(`${DB_ENDPOINT}/sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
      'Accept': 'application/json',
      'Authorization': `Bearer ${DB_TOKEN}`,
      'surreal-ns': DB_NAMESPACE,
      'surreal-db': 'main',
    },
    body: processedSql,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.log('DB Error Response:', response.status, errorText);
    throw new Error(`Database error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log('DB Result:', JSON.stringify(result).substring(0, 500));
  return result;
}

export const leadsRouter = createTRPCRouter({
  getAll: publicProcedure.query(async () => {
    console.log('Fetching all leads from database');
    
    try {
      const result = await dbQuery('SELECT * FROM leads ORDER BY createdAt DESC;');
      
      console.log('Raw DB result structure:', result ? `Array of ${result.length} items` : 'null');
      
      if (result && result[0]) {
        if (result[0].status === 'ERR') {
          console.log('DB query returned error:', result[0].result);
          return { success: false, leads: [], error: result[0].result };
        }
        
        const rawLeads = result[0].result || [];
        console.log('Raw leads count:', rawLeads.length);
        
        const leads = rawLeads.map((row: Record<string, unknown>) => {
          const idStr = String(row.id || '');
          const cleanId = idStr.replace(/^leads:⟨?/, '').replace(/⟩?$/, '');
          
          // Parse selectedTreatments if it's a string
          let selectedTreatments = row.selectedTreatments || [];
          if (typeof selectedTreatments === 'string') {
            try {
              selectedTreatments = JSON.parse(selectedTreatments);
            } catch (e) {
              console.log('Error parsing selectedTreatments:', e);
              selectedTreatments = [];
            }
          }
          
          // Parse roadmap if it's a string and deduplicate
          let roadmap = row.roadmap || [];
          if (typeof roadmap === 'string') {
            try {
              roadmap = JSON.parse(roadmap);
            } catch {
              roadmap = [];
            }
          }
          if (Array.isArray(roadmap)) {
            roadmap = deduplicateByName(roadmap as { name: string }[]);
          }
          
          // Parse peptides if it's a string and deduplicate
          let peptides = row.peptides || [];
          if (typeof peptides === 'string') {
            try {
              peptides = JSON.parse(peptides);
            } catch {
              peptides = [];
            }
          }
          if (Array.isArray(peptides)) {
            peptides = deduplicateByName(peptides as { name: string }[]);
          }
          
          // Parse ivDrips if it's a string and deduplicate
          let ivDrips = row.ivDrips || [];
          if (typeof ivDrips === 'string') {
            try {
              ivDrips = JSON.parse(ivDrips);
            } catch {
              ivDrips = [];
            }
          }
          if (Array.isArray(ivDrips)) {
            ivDrips = deduplicateByName(ivDrips as { name: string }[]);
          }
          
          console.log('Lead', cleanId, 'roadmap count:', Array.isArray(roadmap) ? roadmap.length : 0, 'selectedTreatments count:', Array.isArray(selectedTreatments) ? selectedTreatments.length : 0);
          
          return {
            id: cleanId,
            name: row.name || '',
            phone: row.phone || '',
            auraScore: row.auraScore || 0,
            faceType: row.faceType || '',
            estimatedValue: row.estimatedValue || 0,
            roadmap,
            peptides,
            ivDrips,
            selectedTreatments,
            status: row.status || 'new',
            createdAt: row.createdAt || new Date().toISOString(),
          };
        });
        console.log('Processed leads:', leads.length, leads.map((l: { name: string }) => l.name));
        return { success: true, leads };
      }
      
      console.log('No result array from DB');
      return { success: true, leads: [] };
    } catch (error) {
      console.log('Error fetching leads:', error);
      return { success: false, leads: [], error: String(error) };
    }
  }),

  create: publicProcedure
    .input(leadSchema)
    .mutation(async ({ input }) => {
      console.log('Creating lead:', input.name, 'ID:', input.id);
      
      try {
        // Deduplicate treatments before saving
        const deduplicatedRoadmap = deduplicateByName(input.roadmap);
        const deduplicatedPeptides = deduplicateByName(input.peptides);
        const deduplicatedIvDrips = deduplicateByName(input.ivDrips);
        
        console.log('Creating lead with deduplicated counts - roadmap:', deduplicatedRoadmap.length, 'peptides:', deduplicatedPeptides.length, 'iv:', deduplicatedIvDrips.length);
        
        const leadData = {
          name: input.name,
          phone: input.phone,
          auraScore: input.auraScore,
          faceType: input.faceType,
          estimatedValue: input.estimatedValue,
          roadmap: deduplicatedRoadmap,
          peptides: deduplicatedPeptides,
          ivDrips: deduplicatedIvDrips,
          selectedTreatments: input.selectedTreatments || [],
          status: input.status,
          createdAt: input.createdAt,
        };

        const sql = `CREATE leads:⟨${input.id}⟩ CONTENT ${JSON.stringify(leadData)};`;
        
        const result = await dbQuery(sql);
        
        if (result && result[0] && result[0].status === 'ERR') {
          console.log('DB returned error:', result[0].result);
          return { success: false, error: result[0].result };
        }

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
      console.log('Updating lead:', input.id, 'with data keys:', Object.keys(input.data));
      
      try {
        const updateData: Record<string, unknown> = {};
        
        Object.entries(input.data).forEach(([key, value]) => {
          if (value !== undefined && key !== 'id') {
            updateData[key] = value;
          }
        });

        if (Object.keys(updateData).length === 0) {
          console.log('No updates to apply');
          return { success: true };
        }

        const sql = `UPDATE leads:⟨${input.id}⟩ MERGE ${JSON.stringify(updateData)};`;
        const result = await dbQuery(sql);
        
        if (result && result[0] && result[0].status === 'ERR') {
          console.log('DB returned error on update:', result[0].result);
          return { success: false, error: result[0].result };
        }

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
        const sql = `DELETE leads:⟨${input.id}⟩;`;
        const result = await dbQuery(sql);
        
        if (result && result[0] && result[0].status === 'ERR') {
          console.log('DB returned error on delete:', result[0].result);
          return { success: false, error: result[0].result };
        }
        
        console.log('Lead deleted successfully:', input.id);
        return { success: true };
      } catch (error) {
        console.log('Error deleting lead:', error);
        return { success: false, error: String(error) };
      }
    }),
});
