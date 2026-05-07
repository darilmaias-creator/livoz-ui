# Livoz

App infantil de aprendizagem de idiomas com Next.js, TypeScript, Tailwind CSS, Prisma e PostgreSQL.

## Configuracao do banco

Antes de rodar migrations do Prisma, configure a variavel `DATABASE_URL`.

1. Crie ou edite o arquivo `.env` na raiz do projeto.
2. Defina a URL do PostgreSQL, por exemplo:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
```

3. Substitua `USER`, `PASSWORD`, `HOST`, `PORT` e `DATABASE` pelos dados reais do seu banco, como o PostgreSQL do Supabase.

Nao coloque credenciais reais em arquivos versionados. O arquivo `.env` deve permanecer fora do Git.

## Prisma

Depois de configurar `DATABASE_URL`, rode:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

Se `DATABASE_URL` nao estiver configurada corretamente, as migrations nao conseguirão conectar ao banco.
