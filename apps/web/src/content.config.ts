import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';

const source = z.string();
const sedes = defineCollection({
  loader: file('src/content/sedes.json'),
  schema: z.object({ ciudad: z.string(), departamento: z.string(), nombre: z.string(), direccion: z.string(), telefono: z.string(), tel: z.string(), email: z.string().optional(), lv: z.string(), sab: z.string(), fuente: source }),
});
const especialidades = defineCollection({
  loader: file('src/content/especialidades.json'),
  schema: z.object({ nombre: z.string(), imagen: z.string(), fuente: source }),
});
const formas = defineCollection({
  loader: file('src/content/formas.json'),
  schema: z.object({ nombre: z.string(), figura: z.string(), imagen: z.string().optional(), fuente: source }),
});
const faq = defineCollection({
  loader: file('src/content/faq.json'),
  schema: z.object({ pregunta: z.string(), respuesta: z.string(), fuente: source }),
});
export const collections = { sedes, especialidades, formas, faq };
