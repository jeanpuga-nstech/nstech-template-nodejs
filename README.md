# nstech-template-nodejs

Template oficial para APIs NestJS da NSTech. Ao criar um novo serviço, clone este repositório e adapte conforme o domínio do seu projeto.

---

## Tecnologias

| Tecnologia | Finalidade |
|---|---|
| [NestJS](https://nestjs.com/) | Framework backend |
| [Prisma](https://www.prisma.io/) | ORM e migrations |
| [PostgreSQL](https://www.postgresql.org/) | Banco de dados |
| [Terminus](https://docs.nestjs.com/recipes/terminus) | Health checks (Kubernetes probes) |
| [Prometheus](https://prometheus.io/) | Métricas da aplicação |
| [Sentry](https://sentry.io/) | Monitoramento de erros |
| [AWS S3](https://aws.amazon.com/s3/) | Upload e download de arquivos |
| [Keycloak / corporate-auth-policies](https://github.com/orgs/nstechhub/packages/npm/package/corporate-auth-policies) | Validação de roles e audience via JWKS |
| [Jest](https://jestjs.io/) | Testes unitários |
| [Biome](https://biomejs.dev/) | Lint e formatação |

---

## Pré-requisitos

- Node.js **22+** (gerenciado via [Volta](https://volta.sh/))
- PostgreSQL rodando localmente ou via Docker
- Acesso ao GitHub Packages para instalar `@nstechhub/corporate-auth-policies`

---

## Configuração inicial

### 1. Instalar dependências

```bash
npm install
```

> Se o `npm install` falhar com erro 404 no pacote `@nstechhub/*`, configure o GitHub Packages:
>
> Crie ou edite `.npmrc` na raiz:
> ```
> @nstechhub:registry=https://npm.pkg.github.com
> //npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
> ```
> Defina `GITHUB_TOKEN` com um token de acesso pessoal com escopo `read:packages`.

### 2. Configurar variáveis de ambiente

Copie o arquivo de exemplo e preencha os valores:

```bash
cp .env.example .env
```

Variáveis obrigatórias:

```bash
# Aplicação
PORT=3000
NODE_ENV=development
TZ=UTC

# Banco de dados
DATABASE_URL=postgres://${DATABASE_USERNAME}:${DATABASE_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=nstech

# Autenticação (chave pública RS256 em base64)
JWT_SECRET=<base64-encoded-public-key>

# Keycloak (URL do realm sem barra final)
# Exemplo: https://auth.nstech.com.br/realms/nstech
KEYCLOAK_ISSUER=https://<keycloak-host>/realms/<realm>

# AWS
AWS_BUCKET_NAME=nstech-bucket
```

### 3. Banco de dados

```bash
# Aplicar migrations
npm run prisma:migrate

# Gerar client tipado (necessário após alterar o schema)
npm run prisma:generate
```

### 4. Executar a aplicação

```bash
# Modo watch (desenvolvimento)
npm run start:dev

# Modo produção
npm run start:prod
```

---

## Estrutura de pastas

```
src/
├── config/
│   └── env/                  # Validação e tipagem das variáveis de ambiente
├── health/                   # Health check endpoints (Kubernetes probes)
├── infra/
│   ├── bucket/               # Upload/download AWS S3
│   ├── database/             # PrismaService e client gerado
│   ├── prometheus/           # Métricas customizadas
│   └── repositories/         # Repository pattern (acesso ao banco)
├── modules/
│   └── example/              # Módulo de exemplo — copie e adapte
│       ├── __test__/
│       ├── http/controllers/
│       └── services/
├── shared/
│   ├── auth/                 # JwtAuthGuard + estratégia JWT (Passport)
│   ├── decorators/           # @Public, etc.
│   ├── filters/              # Filtro global de exceções
│   ├── interceptors/         # Interceptor de métricas
│   ├── policies/             # @Policies decorator + PoliciesGuard (Keycloak roles)
│   └── utils/                # date, number
└── lib/                      # Configurações de libs (dayjs, sentry)
```

---

## Como criar um novo módulo

Copie a pasta `src/modules/example` e renomeie conforme o domínio:

```
src/modules/orders/
├── __test__/
│   └── orders.service.spec.ts
├── http/controllers/
│   ├── dto/
│   │   ├── orders-request.dto.ts
│   │   └── orders-response.dto.ts
│   └── orders.controller.ts
├── services/
│   └── orders.service.ts
└── orders.module.ts
```

Adicione o novo module em `AppModule`:

```ts
// src/app.module.ts
import { OrdersModule } from "./modules/orders/orders.module";

@Module({
  imports: [
    // ...
    OrdersModule,
  ],
})
export class AppModule {}
```

---

## Autenticação e autorização

### Guard global JWT

Todos os endpoints são protegidos por padrão via `JwtAuthGuard`. Para tornar um endpoint público:

```ts
import { Public } from "@/shared/decorators/public.decorator";

@Public()
@Get("ping")
ping() {
  return "pong";
}
```

### Validação de roles Keycloak com `@Policies`

Use o decorator `@Policies(audience, role)` para exigir uma role específica do token Keycloak. O guard verifica `resource_access[audience].roles` no JWT.

```ts
import { Policies } from "@/shared/policies/policies.decorator";

@Get("orders")
@Policies("meu-client-id", "orders:read")
findAll() { ... }

@Post("orders")
@Policies("meu-client-id", "orders:write")
create(@Body() data: CreateOrderDto) { ... }
```

**Respostas de erro padronizadas:**

| Situação | HTTP | Código |
|---|---|---|
| Header Authorization ausente | 401 | `SEC-401-001` |
| Token expirado | 401 | `SEC-401-002` |
| Token inválido / assinatura inválida | 403 | `SEC-403-001` |
| Audience não encontrada no token | 403 | `SEC-403-003` |
| Role insuficiente | 403 | `SEC-403-004` |

---

## Health checks (Kubernetes)

| Endpoint | Probe | O que verifica |
|---|---|---|
| `GET /health/startup` | Startup Probe | Apenas se a aplicação inicializou |
| `GET /health/live` | Liveness Probe | Apenas se o processo está vivo (sem I/O externo) |
| `GET /health/ready` | Readiness Probe | Conexão com o banco de dados |

- Retorna **HTTP 200** quando saudável, **HTTP 503** quando falhar.
- `/health/startup` e `/health/live` nunca fazem I/O externo.
- Para adicionar novos checks em `/health/ready` (ex: Redis, API externa), adicione um `HealthIndicator` em `src/health/` seguindo o padrão de `PrismaHealthIndicator`.

---

## Upload de arquivos (AWS S3)

```ts
import { BucketService } from "@/infra/bucket/bucket.service";

// Gerar URL pré-assinada de upload
const { url, key } = await bucketService.generateUploadUrl(
  "invoices",          // pasta dentro do bucket
  "nota-fiscal.pdf",
  "application/pdf"
);

// Obter URL de download
const downloadUrl = await bucketService.get("invoices/nota-fiscal.pdf");

// Deletar arquivos
await bucketService.deleteObjects(["invoices/old.pdf"]);
```

---

## Repository pattern

Cada entidade do banco tem seu próprio repository em `src/infra/repositories/`. Use `PrismaService` diretamente via injeção:

```ts
// src/infra/repositories/orders.repository.ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class OrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.order.findMany();
  }
}
```

Registre no `RepositoryModule` e exporte para uso nos services.

---

## Utilitários

### Datas

```ts
import { format, isAfter, diffInMinutes } from "@/shared/utils/date";

format(new Date());                            // "2025-01-15"
isAfter("2025-12-25", "2025-12-24");          // true
diffInMinutes(new Date(), pastDate);           // número de minutos
```

### Números

```ts
import { formatDecimal } from "@/shared/utils/number";

formatDecimal(1234.5678, 2); // "1234.57"
```

---

## Testes

O projeto usa `@suites/unit` para testes unitários isolados sem precisar subir o módulo NestJS completo.

```ts
// src/modules/orders/__test__/orders.service.spec.ts
import { Mocked, TestBed } from "@suites/unit";
import { OrdersService } from "../services/orders.service";
import { OrdersRepository } from "@/infra/repositories/orders.repository";

describe("OrdersService", () => {
  let service: OrdersService;
  let repository: Mocked<OrdersRepository>;

  beforeEach(async () => {
    const { unit, unitRef } = await TestBed.solitary(OrdersService).compile();
    service = unit;
    repository = unitRef.get(OrdersRepository);
  });

  it("should return all orders", async () => {
    repository.findAll.mockResolvedValue([]);
    const result = await service.findAll({});
    expect(result).toEqual([]);
  });
});
```

```bash
# Rodar testes
npm run test

# Watch mode
npm run test -- --watch

# Arquivo específico
npm run test -- orders.service.spec.ts
```

---

## Observabilidade

| Recurso | URL | Observação |
|---|---|---|
| Swagger | `/doc` | Disponível apenas fora de `production` |
| Métricas Prometheus | `/metrics` | Protegido por Basic Auth |
| Sentry | — | Configure `SENTRY_DSN` no ambiente |

---

## Convenções

- **Arquivos:** `kebab-case` → `orders.service.ts`
- **Classes:** `PascalCase` → `OrdersService`
- **Métodos/variáveis:** `camelCase` → `findAll`
- **Constantes de injeção:** `UPPER_SNAKE_CASE` → `JWT_VALIDATOR`
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`)

---

## Migrations (Prisma)

```bash
# Criar e aplicar nova migration em desenvolvimento
npm run prisma:migrate

# Regenerar o client após alterar schema.prisma
npm run prisma:generate
```

O arquivo de schema fica em `prisma/schema.prisma`.
