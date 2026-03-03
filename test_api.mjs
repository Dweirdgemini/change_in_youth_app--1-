import { createTRPCClient, httpBatchLink } from '@trpc/client';
import superjson from 'superjson';

const client = createTRPCClient({
  links: [
    httpBatchLink({
      url: 'http://localhost:3000/api/trpc',
      headers: {
        cookie: 'session=test-admin-session',
      },
    }),
  ],
  transformer: superjson,
});

try {
  console.log('Testing getAllProjects...');
  const projects = await client.scheduling.getAllProjects.query();
  console.log('Projects:', JSON.stringify(projects, null, 2));
} catch (error) {
  console.error('Error:', error.message);
}
