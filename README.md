This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

1. First, install the required dependencies:

```bash
npm i
# or
yarn
# or
pnpm install
# or
bun add
```

2. After installing all the dependencies, make sure you already start and install your [Postgresql Database](https://www.postgresql.org/)
3. Change the database url in the `.env` file to your own database url.
4. If you have custom port, make sure you change the NEXT_PUBLIC_HOST inside the `.env` file.
5. Initiate the prisma client
   ```bash
   npx prisma generate
   #and
   npx prisma migrate dev
   ```
6. You pretty much good to go.

## Project Information
1. This project uses [Lucia Auth](https://lucia-auth.com/) and [Prisma](https://www.prisma.io/) to handle the authentication and user session.
2. For the component library and styling, this project uses [Shadcn-UI](https://ui.shadcn.com/) and [TailwindCss](https://tailwindcss.com/)
