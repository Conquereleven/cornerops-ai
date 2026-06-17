# RAG Roadmap

## Objetivo

Conectar los AI Workers con el catálogo, políticas y documentación comercial
real de Cornermex sin permitir que el modelo invente stock, precios o estados.

## Fase propuesta

1. Sincronizar catálogo real hacia `products` con SKU como clave estable.
2. Normalizar descripciones, categorías, aliases y keywords.
3. Generar embeddings únicamente para contenido descriptivo y políticas.
4. Guardar embeddings en Supabase `pgvector` o un proveedor equivalente.
5. Recuperar candidatos por similitud y validar cada resultado contra el
   repository transaccional.
6. Entregar a OpenAI hechos estructurados; precio, stock y disponibilidad
   siempre deben provenir de consultas actuales al repository.
7. Registrar query, documentos recuperados, scores y respuesta para evaluación.

## Guardrails

- Los embeddings ayudan a descubrir productos, no son fuente de inventario.
- Un SKU inexistente en el repository no puede aparecer en la respuesta.
- Stock, precio y disponibilidad se leen después de la recuperación semántica.
- Si la fuente real falla, se responde con incertidumbre o se escala.
- Se crearán pruebas offline con preguntas ES/EN antes de habilitar producción.

## Estado actual

`src/services/catalogSearchService.js` encapsula la búsqueda simple por keywords.
Esta interfaz podrá incorporar búsqueda híbrida sin modificar los workers.

Sprint 6 añade:

- Catálogo híbrido desde `productRepository`.
- Búsqueda interna en `/api/internal/products/search?q=`.
- Herramienta protegida de staging `/api/internal/products/sync-mocks`.
- Campos `keywords` y `metadata` preparados en Supabase.

## Evolución Sprint 7

1. Habilitar `vector` en staging.
2. Crear una tabla de documentos o embeddings separada del inventario.
3. Versionar embeddings por SKU y checksum de contenido.
4. Implementar búsqueda híbrida keyword + vector.
5. Revalidar cada candidato contra `products`.
6. Crear evaluaciones ES/EN para precisión, abstención y disponibilidad.
