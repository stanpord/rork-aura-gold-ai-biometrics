import { z } from "zod";
import { publicProcedure, createTRPCRouter } from "../create-context";

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
  status: z.enum(['new', 'contacted', 'converted']),
  createdAt: z.date(),
});

interface ZenotiGuest {
  center_id: string;
  personal_info: {
    first_name: string;
    last_name: string;
    mobile_phone: {
      country_code: number;
      number: string;
    };
    email?: string;
  };
  custom_fields?: {
    name: string;
    value: string;
  }[];
}

export const crmRouter = createTRPCRouter({
  syncToZenoti: publicProcedure
    .input(z.object({
      lead: leadSchema,
      zenotiConfig: z.object({
        apiKey: z.string(),
        centerId: z.string(),
        baseUrl: z.string().default('https://api.zenoti.com/v1'),
      }),
    }))
    .mutation(async ({ input }) => {
      const { lead, zenotiConfig } = input;
      
      console.log('Syncing lead to Zenoti:', lead.id);
      
      const nameParts = lead.name.split(' ');
      const firstName = nameParts[0] || lead.name;
      const lastName = nameParts.slice(1).join(' ') || '';
      
      const phoneClean = lead.phone.replace(/\D/g, '');
      
      const guestPayload: ZenotiGuest = {
        center_id: zenotiConfig.centerId,
        personal_info: {
          first_name: firstName,
          last_name: lastName,
          mobile_phone: {
            country_code: 1,
            number: phoneClean,
          },
        },
        custom_fields: [
          { name: 'aura_score', value: lead.auraScore.toString() },
          { name: 'face_type', value: lead.faceType },
          { name: 'estimated_value', value: `$${lead.estimatedValue}` },
          { name: 'recommended_treatments', value: lead.roadmap.map(t => t.name).join(', ') },
          { name: 'source', value: 'Aura AI Biometrics' },
        ],
      };

      try {
        const response = await fetch(`${zenotiConfig.baseUrl}/guests`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${zenotiConfig.apiKey}`,
          },
          body: JSON.stringify(guestPayload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.log('Zenoti API error:', errorText);
          throw new Error(`Zenoti API error: ${response.status}`);
        }

        const result = await response.json();
        console.log('Successfully synced to Zenoti:', result);
        
        return {
          success: true,
          zenotiGuestId: result.guest_id || result.id,
          message: 'Lead synced to Zenoti successfully',
        };
      } catch (error) {
        console.log('Error syncing to Zenoti:', error);
        throw error;
      }
    }),

  createAppointment: publicProcedure
    .input(z.object({
      guestId: z.string(),
      serviceId: z.string(),
      therapistId: z.string().optional(),
      slotTime: z.string(),
      zenotiConfig: z.object({
        apiKey: z.string(),
        centerId: z.string(),
        baseUrl: z.string().default('https://api.zenoti.com/v1'),
      }),
    }))
    .mutation(async ({ input }) => {
      const { guestId, serviceId, therapistId, slotTime, zenotiConfig } = input;
      
      console.log('Creating appointment for guest:', guestId);

      const appointmentPayload = {
        center_id: zenotiConfig.centerId,
        guest_id: guestId,
        service_id: serviceId,
        therapist_id: therapistId,
        slot_time: slotTime,
        is_only_catalog_employees: false,
      };

      try {
        const response = await fetch(`${zenotiConfig.baseUrl}/bookings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${zenotiConfig.apiKey}`,
          },
          body: JSON.stringify(appointmentPayload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.log('Zenoti booking error:', errorText);
          throw new Error(`Zenoti booking error: ${response.status}`);
        }

        const result = await response.json();
        console.log('Successfully created appointment:', result);

        return {
          success: true,
          bookingId: result.booking_id || result.id,
          message: 'Appointment created successfully',
        };
      } catch (error) {
        console.log('Error creating appointment:', error);
        throw error;
      }
    }),

  getServices: publicProcedure
    .input(z.object({
      zenotiConfig: z.object({
        apiKey: z.string(),
        centerId: z.string(),
        baseUrl: z.string().default('https://api.zenoti.com/v1'),
      }),
    }))
    .query(async ({ input }) => {
      const { zenotiConfig } = input;
      
      console.log('Fetching services from Zenoti');

      try {
        const response = await fetch(
          `${zenotiConfig.baseUrl}/centers/${zenotiConfig.centerId}/services`,
          {
            headers: {
              'Authorization': `Bearer ${zenotiConfig.apiKey}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Zenoti API error: ${response.status}`);
        }

        const result = await response.json();
        return {
          success: true,
          services: result.services || [],
        };
      } catch (error) {
        console.log('Error fetching services:', error);
        throw error;
      }
    }),

  getPipelineStats: publicProcedure
    .input(z.object({
      leads: z.array(leadSchema),
    }))
    .query(({ input }) => {
      const { leads } = input;
      
      const totalRevenue = leads.reduce((acc, lead) => acc + lead.estimatedValue, 0);
      const avgScore = leads.length > 0 
        ? Math.round(leads.reduce((acc, lead) => acc + lead.auraScore, 0) / leads.length)
        : 0;
      const conversionRate = leads.length > 0
        ? Math.round((leads.filter(l => l.status === 'converted').length / leads.length) * 100)
        : 0;
      const contactedRate = leads.length > 0
        ? Math.round((leads.filter(l => l.status === 'contacted').length / leads.length) * 100)
        : 0;

      const treatmentBreakdown: Record<string, number> = {};
      leads.forEach(lead => {
        lead.roadmap.forEach(treatment => {
          treatmentBreakdown[treatment.name] = (treatmentBreakdown[treatment.name] || 0) + 1;
        });
      });

      return {
        totalRevenue,
        totalLeads: leads.length,
        avgScore,
        conversionRate,
        contactedRate,
        treatmentBreakdown,
        newLeads: leads.filter(l => l.status === 'new').length,
        contactedLeads: leads.filter(l => l.status === 'contacted').length,
        convertedLeads: leads.filter(l => l.status === 'converted').length,
      };
    }),

  validateZenotiConnection: publicProcedure
    .input(z.object({
      zenotiConfig: z.object({
        apiKey: z.string(),
        centerId: z.string(),
        baseUrl: z.string().default('https://api.zenoti.com/v1'),
      }),
    }))
    .mutation(async ({ input }) => {
      const { zenotiConfig } = input;
      
      console.log('Validating Zenoti connection');

      try {
        const response = await fetch(
          `${zenotiConfig.baseUrl}/centers/${zenotiConfig.centerId}`,
          {
            headers: {
              'Authorization': `Bearer ${zenotiConfig.apiKey}`,
            },
          }
        );

        if (!response.ok) {
          return {
            success: false,
            message: 'Invalid API credentials or center ID',
          };
        }

        const result = await response.json();
        return {
          success: true,
          centerName: result.name || 'Connected',
          message: 'Zenoti connection validated successfully',
        };
      } catch (error) {
        console.log('Error validating Zenoti connection:', error);
        return {
          success: false,
          message: 'Failed to connect to Zenoti',
        };
      }
    }),
});
