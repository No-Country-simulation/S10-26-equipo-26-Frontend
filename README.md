# PriceScope — Frontend

Dashboard de analítica de precios e inflación multimoneda para el monitoreo de productos de e-commerce, la comparación de precios históricos y la visualización de anomalías.

## 1. Descripción

PriceScope es una plataforma de analítica B2B que permite monitorear la evolución de precios de productos publicados en distintas tiendas, comparar su comportamiento frente a las variaciones del tipo de cambio y detectar cambios atípicos mediante un sistema de alertas.

El frontend proporciona una interfaz ejecutiva para explorar los datos procesados por el backend.

### Objetivos del frontend

- Visualizar la evolución histórica de precios.
- Comparar precios en moneda local y USD.
- Consultar indicadores de variación de precios y tipo de cambio.
- Filtrar información por período, tienda y categoría.
- Mostrar alertas de anomalías detectadas por el sistema.
- Facilitar la interpretación de los resultados mediante gráficos y tablas.

### Problemas clave del proyecto y responsabilidad de este repo

El equipo enfrenta tres problemas técnicos centrales (detalle en `problematica.md` en la raíz del proyecto; plan de trabajo ágil en `PLAN-AGIL.md`). Este repo es la capa de visualización:

| Problema | Responsabilidad del Frontend | Decisión clave |
|---|---|---|
| **1. Identidad de productos entre tiendas** | Tabla que muestra el producto canónico con sus variantes/precios por tienda y el spread entre competidores. | El mapeo producto↔tienda lo define el backend; el frontend solo lo consume. |
| **2. Promociones, stock y reduflación** | Visualizar promo vs precio regular (series y badges) y la alerta de reduflación detectada por el sistema. | La lógica de exclusión de promos del índice de inflación vive en el backend; aquí solo se muestra. |
| **3. Sincronización timestamp ↔ tipo de cambio** | Filtro de moneda de visualización (local / USD); el usuario ve el precio ya convertido. | **No convertir en el cliente.** Se consume el `price_usd` calculado por el backend con el FX del momento de la captura. |

Flujo de datos y orden de dependencias:

- El backend define la API y el esquema; este repo la consume.
- Puede desarrollarse con datos mockeados mientras la API no esté lista.
- Orden de implementación sugerido: Backend → Data (en paralelo) → Frontend.

## 2. Alcance del MVP

La primera versión prioriza una experiencia funcional, clara y reproducible.

### Funcionalidades incluidas

| Funcionalidad | Descripción | Prioridad |
|---|---|---|
| Dashboard ejecutivo | Resumen de indicadores principales. | P0 |
| Evolución de precios | Gráfico temporal de precios históricos. | P0 |
| Comparación multimoneda | Visualización de precios en moneda local y USD. | P0 |
| Filtros globales | Período, tienda y categoría. | P0 |
| Tabla de productos | Consulta de productos y precios observados. | P0 |
| Comparación entre tiendas | Producto canónico vs precios por tienda y spread. | P0 |
| Promo vs precio regular | Series y badges que distinguen descuento de baja real. | P0 |
| Alertas de anomalías | Listado de productos con variaciones atípicas y reduflación. | P0 |
| Estados de interfaz | Carga, ausencia de datos y errores. | P0 |

### Fuera del alcance inicial

- Autenticación y gestión avanzada de usuarios.
- Notificaciones externas por correo o mensajería.
- Panel de administración de scrapers.
- Gestión avanzada de catálogos y matching semántico.
- Predicciones de inflación futura.
- Personalización avanzada de dashboards.
- Funcionalidades multi-tenant.

Estas funcionalidades podrán evaluarse en futuras iteraciones.

## 3. Stack tecnológico

Stack propuesto para el MVP:

| Tecnología | Propósito |
|---|---|
| React | Construcción de interfaces. |
| TypeScript | Tipado estático y contratos de datos. |
| Vite | Servidor de desarrollo y compilación. |
| Recharts | Gráficos y visualización analítica. |
| React Router | Navegación entre vistas, si se requiere. |
| Fetch API | Comunicación con el backend REST. |
| CSS Modules o solución de estilos existente | Organización de estilos. |
| ESLint | Análisis estático del código. |

Las versiones de las dependencias deben quedar fijadas en el archivo de bloqueo del gestor de paquetes utilizado por el proyecto.

> Este stack es una propuesta inicial. La implementación debe respetar las tecnologías y convenciones que ya existan en el repositorio.

## 4. Arquitectura del frontend

El frontend se organiza por responsabilidades, separando presentación, acceso a datos, componentes reutilizables y tipos.

```text
src/
├── app/
│   ├── App.tsx
│   ├── router.tsx
│   └── providers.tsx
│
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx
│   │   ├── Header.tsx
│   │   └── Sidebar.tsx
│   ├── filters/
│   │   └── DashboardFilters.tsx
│   ├── charts/
│   │   ├── PriceHistoryChart.tsx
│   │   └── CurrencyComparisonChart.tsx
│   ├── metrics/
│   │   └── MetricCard.tsx
│   ├── products/
│   │   └── ProductTable.tsx
│   └── alerts/
│       └── AnomalyAlertsTable.tsx
│
├── features/
│   └── dashboard/
│       ├── pages/
│       │   └── DashboardPage.tsx
│       ├── hooks/
│       └── types.ts
│
├── services/
│   ├── apiClient.ts
│   ├── productsService.ts
│   ├── pricesService.ts
│   ├── indicatorsService.ts
│   └── alertsService.ts
│
├── hooks/
├── types/
│   ├── product.ts
│   ├── price.ts
│   ├── indicator.ts
│   └── alert.ts
│
├── utils/
│   ├── currency.ts
│   ├── dates.ts
│   └── formatters.ts
│
├── styles/
├── main.tsx
└── vite-env.d.ts
```

La estructura es orientativa y debe adaptarse a la organización existente. No es necesario crear todos los archivos si el MVP todavía no los necesita.

### Principios arquitectónicos

1. Los componentes visuales no realizan llamadas HTTP directamente.
2. Los servicios encapsulan las peticiones al backend.
3. Los tipos TypeScript representan los contratos de datos.
4. Los gráficos consumen datos procesados por los servicios.
5. El frontend no recalcula indicadores financieros que corresponden al backend.
6. Los filtros deben producir resultados consistentes entre las distintas visualizaciones.
7. Los estados de carga, error y ausencia de datos forman parte de cada funcionalidad.

## 5. Diseño funcional

### 5.1 Dashboard ejecutivo

Vista principal de la aplicación.

Debe incluir:

- Precio promedio de la canasta seleccionada.
- Variación porcentual de precios en el período.
- Variación del tipo de cambio en el mismo período.
- Cantidad de productos monitoreados.
- Cantidad de alertas activas.
- Gráfico de evolución histórica.
- Tabla de alertas recientes.

Los indicadores deben mostrar su período de referencia y la moneda utilizada.

### 5.2 Filtros globales

Filtros mínimos:

- Fecha de inicio.
- Fecha de término.
- Tienda.
- Categoría.
- Moneda de visualización, cuando corresponda.

Los filtros deben actualizar los indicadores, los gráficos y las tablas que dependan de ellos.

### 5.3 Evolución histórica

El gráfico debe permitir visualizar cómo cambia el precio de un producto o de una canasta durante el período seleccionado.

Requisitos:

- Eje temporal.
- Valores identificados por moneda.
- Tooltip con fecha y valor.
- Manejo de datos faltantes.
- Indicador de carga y estado vacío.
- Leyenda cuando se comparen varias series.

### 5.4 Comparación multimoneda

Permite analizar la evolución del precio en moneda local y en USD.

La conversión debe utilizar los valores calculados por el backend, incluyendo la metodología y el tipo de cotización definidos para el análisis.

**Regla (problema 3):** el frontend **no** convierte monedas por su cuenta. Consume el `price_usd` calculado por el backend (que usa la cotización vigente al timestamp de la observación) y solo aplica el **filtro de moneda de visualización** (local / USD).

### 5.5 Comparación entre tiendas (problema 1)

Tabla de producto canónico con su precio en cada tienda observada, para comparar competidores:

- Columnas: producto canónico, precio por tienda, precio mínimo, precio máximo y spread (diferencia entre tiendas).
- Filtro por categoría y tienda.
- Cada fila enlaza a la publicación original en la tienda (`source_url`) cuando exista.
- El mapeo producto↔tienda proviene del backend; el frontend no deduce equivalencias.

### 5.6 Promociones y reduflación (problema 2)

- **Badge de promoción** en tablas y tooltips cuando la observación tenga `is_promotion = true`.
- **Serie de precio regular vs precio promocional** en el gráfico de evolución histórica.
- **Badge de alerta de reduflación** en productos cuya presentación/gramaje haya cambiado (viene del backend como `anomaly_type = shrinkflation`).
- El frontend muestra la señal; la lógica de detección y la exclusión de promos del índice de inflación viven en el backend.