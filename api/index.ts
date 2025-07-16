// ./api/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Task = {
  id: string
  description: string
  isComplete: boolean
  createdDate: Date
  targetDate: Date
  order: number
};

interface CompletedTask {
  id: string;
  description: string;
  isComplete: true;
  createdDate: Date;
  completedDate: Date;
  order: number;
}

type Bindings = {
  TASK_PRIORITY: KVNamespace
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type']
}));

app.get('/tasks', async (c) => {
  const raw = await c.env.TASK_PRIORITY.get('taskList');
  console.log("Raw:", raw);
  const tasks: Task[] = raw ? JSON.parse(raw) : [];
  return c.json(tasks);
});

app.post('/tasks', async (c) => {
  const tasks: Task[] = await c.req.json();
  await c.env.TASK_PRIORITY.put('taskList', JSON.stringify(tasks));
  return c.text('okiedokie');
});

app.get('/history', async (c) => {
  const raw = await c.env.TASK_PRIORITY.get('taskHistory');
  console.log("Raw:", raw);
  const tasks: CompletedTask[] = raw ? JSON.parse(raw) : [];
  return c.json(tasks);
});

app.post('/history', async (c) => {
  const tasks: CompletedTask[] = await c.req.json();
  await c.env.TASK_PRIORITY.put('taskHistory', JSON.stringify(tasks));
  return c.text('okiedokie');
});

export default app;
