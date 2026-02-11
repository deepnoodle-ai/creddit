---
name: react-router-v7
description: "Expert guidance for building React applications with React Router v7 Framework Mode. Use when working with routing, data loading, actions, SSR/SSG, navigation, or route modules."
---

# React Router v7 (Framework Mode)

Expert guidance for building React applications with React Router v7 in **Framework Mode** - a full-stack React framework with SSR, SSG, data loading, actions, and type-safe routing.

## Framework Modes Overview

React Router v7 has three modes:

1. **Framework Mode** ✅ (THIS PROJECT) - Full framework features: type-safe routes, SSR/SSG, code splitting, loaders/actions, middleware
2. **Data Mode** - Data router with loaders/actions but manual configuration
3. **Declarative Mode** - Basic routing with `<BrowserRouter>` and `<Route>`

This skill focuses on **Framework Mode**, which uses Vite plugin integration and provides the most features.

## Route Configuration

Routes are defined in `app/routes.ts` using configuration objects:

```ts filename=app/routes.ts
import {
  type RouteConfig,
  route,
  index,
  layout,
  prefix,
} from "@react-router/dev/routes";

export default [
  // Index route - renders at parent's URL
  index("./home.tsx"),

  // Basic route
  route("about", "./about.tsx"),

  // Dynamic segments with :param
  route("users/:userId", "./user.tsx"),
  route("teams/:teamId/projects/:projectId", "./project.tsx"),

  // Optional segments with ?
  route(":lang?/categories", "./categories.tsx"),
  route("users/:userId/edit?", "./user.tsx"),

  // Splat/catchall routes with *
  route("files/*", "./files.tsx"),
  route("*", "./404.tsx"), // Catch-all for 404s

  // Nested routes - children inherit parent path
  route("dashboard", "./dashboard.tsx", [
    index("./dashboard-home.tsx"), // /dashboard
    route("settings", "./settings.tsx"), // /dashboard/settings
    route("profile", "./profile.tsx"), // /dashboard/profile
  ]),

  // Layout routes - add nesting without URL segments
  layout("./auth/layout.tsx", [
    route("login", "./auth/login.tsx"),
    route("register", "./auth/register.tsx"),
  ]),

  // Prefix - add path prefix without parent route
  ...prefix("concerts", [
    index("./concerts/home.tsx"), // /concerts
    route(":city", "./concerts/city.tsx"), // /concerts/:city
    route("trending", "./concerts/trending.tsx"), // /concerts/trending
  ]),
] satisfies RouteConfig;
```

### File System Routing (Optional)

You can use file-based routing conventions instead:

```ts filename=app/routes.ts
import { flatRoutes } from "@react-router/fs-routes";

export default [
  route("/", "./home.tsx"),
  ...(await flatRoutes()), // Auto-generates routes from file structure
] satisfies RouteConfig;
```

## Route Modules

Route module files define the behavior and UI for each route. All exports are optional.

### Component (default export)

```tsx filename=app/routes/product.tsx
import type { Route } from "./+types/product";

export default function Product({
  loaderData,
  actionData,
  params,
  matches,
}: Route.ComponentProps) {
  return (
    <div>
      <h1>{loaderData.name}</h1>
      <p>{loaderData.description}</p>
    </div>
  );
}
```

**Props available:**
- `loaderData` - Data from loader
- `actionData` - Data from action
- `params` - URL parameters
- `matches` - Route hierarchy matches

### Loader (Server Data Loading)

Loaders fetch data on the server for SSR and during client navigation:

```tsx filename=app/routes/product.tsx
import type { Route } from "./+types/product";
import { fakeDb } from "~/db";

export async function loader({ params, request }: Route.LoaderArgs) {
  const product = await fakeDb.getProduct(params.pid);

  if (!product) {
    throw new Response("Not Found", { status: 404 });
  }

  return { product };
}

export default function Product({ loaderData }: Route.ComponentProps) {
  return <h1>{loaderData.product.name}</h1>;
}
```

**Loader features:**
- Runs on server during SSR and client navigations
- Removed from client bundle (use server-only APIs safely)
- Supports all serializable types: primitives, Dates, Maps, Sets, Promises
- Can throw `Response` or `redirect()` for errors/redirects

### Client Loader (Client-Side Data Loading)

Fetch data in the browser only:

```tsx filename=app/routes/product.tsx
import type { Route } from "./+types/product";

export async function clientLoader({
  params,
  serverLoader,
}: Route.ClientLoaderArgs) {
  // Option 1: Call server loader
  const serverData = await serverLoader();

  // Option 2: Fetch from API
  const res = await fetch(`/api/products/${params.pid}`);
  const clientData = await res.json();

  // Combine or use either
  return { ...serverData, ...clientData };
}

// Run during hydration (blocks initial render)
clientLoader.hydrate = true as const;

// Show while client loader runs
export function HydrateFallback() {
  return <div>Loading...</div>;
}

export default function Product({ loaderData }: Route.ComponentProps) {
  return <h1>{loaderData.name}</h1>;
}
```

### Actions (Data Mutations)

Handle form submissions and data mutations:

```tsx filename=app/routes/project.tsx
import type { Route } from "./+types/project";
import { Form, redirect } from "react-router";
import { fakeDb } from "~/db";

// Server action - runs on server only
export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "delete") {
    await fakeDb.deleteProject(params.projectId);
    return redirect("/projects");
  }

  if (intent === "update") {
    const title = formData.get("title");
    const project = await fakeDb.updateProject(params.projectId, { title });
    return { success: true, project };
  }

  throw new Response("Bad Request", { status: 400 });
}

export default function Project({ actionData }: Route.ComponentProps) {
  return (
    <div>
      {actionData?.success && <p>Project updated!</p>}

      <Form method="post">
        <input type="text" name="title" />
        <button type="submit" name="intent" value="update">
          Update
        </button>
        <button type="submit" name="intent" value="delete">
          Delete
        </button>
      </Form>
    </div>
  );
}
```

### Client Actions

```tsx filename=app/routes/task.tsx
import type { Route } from "./+types/task";
import { Form } from "react-router";

export async function clientAction({
  request,
  serverAction,
}: Route.ClientActionArgs) {
  const formData = await request.formData();

  // Option 1: Call server action
  await serverAction();

  // Option 2: Client-side only
  const res = await fetch("/api/tasks", {
    method: "POST",
    body: formData,
  });

  return res.json();
}
```

### Middleware

Server middleware runs before/after loaders and actions:

```tsx filename=app/routes/_auth.tsx
import type { Route } from "./+types/_auth";
import { redirect } from "react-router";

async function authMiddleware({ request, context }: Route.MiddlewareArgs, next) {
  const session = await getSession(request);
  const user = session.get("userId");

  if (!user) {
    throw redirect("/login");
  }

  // Add user to context for loaders
  context.set(userContext, user);

  // Continue to next middleware or loader
  const response = await next();

  // Can modify response
  response.headers.set("X-User-Id", user);

  return response;
}

export const middleware = [authMiddleware];
```

### Client Middleware

Runs in browser during client navigations:

```tsx filename=app/root.tsx
async function loggingMiddleware({ request }: Route.MiddlewareArgs, next) {
  console.log(`${request.method} ${request.url}`);
  const start = performance.now();

  await next(); // No Response returned on client

  const duration = performance.now() - start;
  console.log(`Completed in ${duration}ms`);
}

export const clientMiddleware = [loggingMiddleware];
```

### Error Boundary

```tsx filename=app/routes/product.tsx
import { isRouteErrorResponse, useRouteError } from "react-router";

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div>
        <h1>{error.status} {error.statusText}</h1>
        <p>{error.data}</p>
      </div>
    );
  }

  if (error instanceof Error) {
    return (
      <div>
        <h1>Error</h1>
        <p>{error.message}</p>
        <pre>{error.stack}</pre>
      </div>
    );
  }

  return <h1>Unknown Error</h1>;
}
```

### Headers

```tsx
export function headers({ loaderHeaders, actionHeaders, parentHeaders }) {
  return {
    "Cache-Control": "max-age=300, s-maxage=3600",
    "X-Custom-Header": "value",
  };
}
```

### Meta Tags

**Note:** In React 19+, prefer using built-in `<meta>` elements in components:

```tsx
export default function Product({ loaderData }: Route.ComponentProps) {
  return (
    <div>
      <title>{loaderData.product.name} - Store</title>
      <meta name="description" content={loaderData.product.description} />
      <meta property="og:title" content={loaderData.product.name} />
      <meta property="og:image" content={loaderData.product.image} />

      <h1>{loaderData.product.name}</h1>
      {/* rest of component */}
    </div>
  );
}
```

**Alternative:** Export `meta` function (legacy approach):

```tsx
export function meta({ data }: Route.MetaArgs) {
  return [
    { title: `${data.product.name} - Store` },
    { name: "description", content: data.product.description },
    { property: "og:title", content: data.product.name },
  ];
}
```

### Links (Stylesheets, Preloads)

```tsx
export function links() {
  return [
    { rel: "icon", href: "/favicon.png", type: "image/png" },
    { rel: "stylesheet", href: "/styles/product.css" },
    { rel: "preload", href: "/images/banner.jpg", as: "image" },
  ];
}
```

### shouldRevalidate

Control when loaders revalidate (Framework Mode revalidates by default after all navigations):

```tsx
import type { ShouldRevalidateFunctionArgs } from "react-router";

export function shouldRevalidate({
  currentUrl,
  nextUrl,
  formAction,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs) {
  // Only revalidate on form submissions
  if (formAction) return true;

  // Don't revalidate on query param changes
  if (currentUrl.pathname === nextUrl.pathname) return false;

  return defaultShouldRevalidate;
}
```

### Handle (Custom Route Data)

Add custom data to routes accessible via `useMatches`:

```tsx
export const handle = {
  breadcrumb: "Products",
  permissions: ["admin"],
};
```

```tsx
// Access in components
const matches = useMatches();
const breadcrumbs = matches
  .filter(match => match.handle?.breadcrumb)
  .map(match => match.handle.breadcrumb);
```

## Rendering Strategies

Configure in `react-router.config.ts`:

### Server-Side Rendering (SSR)

```ts filename=react-router.config.ts
import type { Config } from "@react-router/dev/config";

export default {
  ssr: true, // Default in Framework Mode
} satisfies Config;
```

### Client-Side Rendering (SPA Mode)

```ts filename=react-router.config.ts
export default {
  ssr: false, // Pure SPA - no server rendering
} satisfies Config;
```

### Static Pre-rendering (SSG)

```ts filename=react-router.config.ts
export default {
  async prerender() {
    // Return URLs to pre-render at build time
    const products = await getProductsFromDB();

    return [
      "/",
      "/about",
      "/contact",
      ...products.map(p => `/products/${p.id}`),
    ];
  },
} satisfies Config;
```

**Note:** Pre-rendering works with SSR - unrendered URLs fall back to server rendering.

## Navigation

### Link Components

```tsx
import { Link, NavLink, Form } from "react-router";

// Basic link
<Link to="/about">About</Link>

// NavLink - adds active/pending classes
<NavLink to="/dashboard" end>
  Dashboard
</NavLink>

<NavLink
  to="/profile"
  className={({ isActive, isPending }) =>
    isActive ? "active" : isPending ? "pending" : ""
  }
>
  {({ isActive }) => (
    <span>{isActive ? "👤" : ""} Profile</span>
  )}
</NavLink>

// Form - for GET requests with search params
<Form action="/search">
  <input type="text" name="q" />
  <button type="submit">Search</button>
</Form>

// Form - for POST requests (data mutations)
<Form method="post" action="/projects/new">
  <input type="text" name="title" />
  <button type="submit">Create</button>
</Form>
```

### Programmatic Navigation

```tsx
import { redirect, useNavigate } from "react-router";

// In loaders/actions - return redirect
export async function action() {
  const project = await createProject();
  return redirect(`/projects/${project.id}`);
}

export async function loader({ request }) {
  const user = await getUser(request);
  if (!user) return redirect("/login");
  return { user };
}

// In components - useNavigate hook
function Component() {
  const navigate = useNavigate();

  const handleTimeout = () => {
    navigate("/logout");
  };

  return <button onClick={() => navigate(-1)}>Back</button>;
}
```

## Pending UI & Optimistic Updates

### Global Navigation State

```tsx
import { useNavigation } from "react-router";

export default function Root() {
  const navigation = useNavigation();
  const isNavigating = Boolean(navigation.location);

  return (
    <div>
      {isNavigating && <GlobalSpinner />}
      <Outlet />
    </div>
  );
}
```

### Local Link Pending State

```tsx
import { NavLink } from "react-router";

<NavLink to="/profile">
  {({ isPending }) => (
    <span>
      Profile {isPending && <Spinner />}
    </span>
  )}
</NavLink>
```

### Form Pending State

```tsx
import { Form, useNavigation } from "react-router";

function NewProject() {
  const navigation = useNavigation();
  const isSubmitting = navigation.formAction === "/projects/new";

  return (
    <Form method="post" action="/projects/new">
      <input type="text" name="title" />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create Project"}
      </button>
    </Form>
  );
}
```

### Fetcher for Non-Navigation Mutations

```tsx
import { useFetcher } from "react-router";

function Task({ task }) {
  const fetcher = useFetcher();

  // Optimistic UI
  const isComplete = fetcher.formData
    ? fetcher.formData.get("status") === "complete"
    : task.status === "complete";

  return (
    <div>
      <p>{task.title}</p>
      <fetcher.Form method="post" action={`/tasks/${task.id}`}>
        <button
          name="status"
          value={isComplete ? "incomplete" : "complete"}
        >
          {fetcher.state !== "idle" ? "Saving..." : ""}
          {isComplete ? "Mark Incomplete" : "Mark Complete"}
        </button>
      </fetcher.Form>
    </div>
  );
}
```

## Type Safety

React Router v7 generates types automatically from your routes.

### Route Module Types

```tsx filename=app/routes/product.tsx
// Import generated types
import type { Route } from "./+types/product";

export async function loader({ params }: Route.LoaderArgs) {
  // params.pid is typed based on route path
  return { name: "Product" };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  return { success: true };
}

export default function Component({
  loaderData,
  actionData,
  params,
}: Route.ComponentProps) {
  // All props are correctly typed
  loaderData.name; // string
  actionData?.success; // boolean | undefined
  params.pid; // string

  return <h1>{loaderData.name}</h1>;
}
```

### Hooks with Types

```tsx
import { useLoaderData, useParams, useActionData } from "react-router";
import type { Route } from "./+types/product";

function Component() {
  const loaderData = useLoaderData<Route.LoaderData>();
  const params = useParams<Route.Params>();
  const actionData = useActionData<Route.ActionData>();

  return <div>{loaderData.name}</div>;
}
```

## Testing

Use `createRoutesStub` to test components that use React Router hooks:

```tsx filename=app/components/LoginForm.test.tsx
import { createRoutesStub } from "react-router";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "./LoginForm";

test("LoginForm renders error messages", async () => {
  const Stub = createRoutesStub([
    {
      path: "/login",
      Component: LoginForm,
      action() {
        return {
          errors: {
            username: "Username is required",
            password: "Password is required",
          },
        };
      },
    },
  ]);

  render(<Stub initialEntries={["/login"]} />);

  userEvent.click(screen.getByText("Login"));
  await waitFor(() => screen.findByText("Username is required"));
  await waitFor(() => screen.findByText("Password is required"));
});
```

**Important:** `createRoutesStub` is for testing **reusable components** that use router hooks, not for testing route modules with `Route.*` types. For route module testing, use integration/E2E tests (Playwright, Cypress).

## Common Patterns

### Protected Routes

```tsx filename=app/routes/_protected.tsx
import { redirect } from "react-router";
import { Outlet } from "react-router";
import type { Route } from "./+types/_protected";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUser(request);
  if (!user) throw redirect("/login");
  return { user };
}

export default function ProtectedLayout() {
  return <Outlet />;
}

// Child routes automatically get protection
// app/routes.ts:
// route("_protected", "./_protected.tsx", [
//   route("dashboard", "./dashboard.tsx"),
//   route("settings", "./settings.tsx"),
// ])
```

### Loading States with Suspense

```tsx filename=app/routes/dashboard.tsx
import { Suspense } from "react";
import { Await, defer } from "react-router";
import type { Route } from "./+types/dashboard";

export async function loader() {
  const criticalData = await getCriticalData();
  const slowData = getSlowData(); // Don't await

  return defer({
    critical: criticalData,
    slow: slowData,
  });
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  return (
    <div>
      <h1>{loaderData.critical.title}</h1>

      <Suspense fallback={<p>Loading slow data...</p>}>
        <Await resolve={loaderData.slow}>
          {(data) => <SlowComponent data={data} />}
        </Await>
      </Suspense>
    </div>
  );
}
```

### Form Validation

```tsx filename=app/routes/contact.tsx
import { Form, useActionData } from "react-router";
import type { Route } from "./+types/contact";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = formData.get("email");
  const message = formData.get("message");

  const errors: Record<string, string> = {};

  if (!email || !/\S+@\S+/.test(email.toString())) {
    errors.email = "Valid email is required";
  }

  if (!message || message.toString().length < 10) {
    errors.message = "Message must be at least 10 characters";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  await sendEmail({ email, message });
  return { success: true };
}

export default function Contact() {
  const actionData = useActionData<Route.ActionData>();

  return (
    <Form method="post">
      <div>
        <label>Email</label>
        <input type="email" name="email" />
        {actionData?.errors?.email && (
          <p className="error">{actionData.errors.email}</p>
        )}
      </div>

      <div>
        <label>Message</label>
        <textarea name="message" />
        {actionData?.errors?.message && (
          <p className="error">{actionData.errors.message}</p>
        )}
      </div>

      <button type="submit">Send</button>

      {actionData?.success && <p>Message sent!</p>}
    </Form>
  );
}
```

### Breadcrumbs

```tsx filename=app/root.tsx
import { useMatches } from "react-router";

export const handle = { breadcrumb: "Home" };

function Breadcrumbs() {
  const matches = useMatches();

  return (
    <nav>
      {matches
        .filter(match => match.handle?.breadcrumb)
        .map((match, index) => (
          <span key={match.pathname}>
            {index > 0 && " > "}
            <Link to={match.pathname}>{match.handle.breadcrumb}</Link>
          </span>
        ))}
    </nav>
  );
}
```

## Best Practices

1. **Use Framework Mode** - Get type safety, SSR/SSG, automatic code splitting, and all framework features
2. **Co-locate route logic** - Keep loaders, actions, components in same file
3. **Type everything** - Use `Route.*` types from `+types` imports
4. **Server code stays on server** - Loaders/actions are removed from client bundles
5. **Automatic revalidation** - After actions, all page loaders rerun automatically
6. **Prefer `<Form>` over fetch** - Get pending states, revalidation, and accessibility for free
7. **Use fetchers for non-navigation mutations** - No browser history changes
8. **Throw responses for errors** - ErrorBoundary catches them
9. **Use middleware for cross-cutting concerns** - Auth, logging, etc.
10. **Pre-render static content** - Configure `prerender()` for SEO-critical pages
11. **Client loaders for hybrid data** - Combine server data with client APIs
12. **Test reusable components** - Use `createRoutesStub` for unit tests
13. **Integration test routes** - Use Playwright/Cypress for full route testing

## Common Gotchas

- **Don't use `Route.*` types with `createRoutesStub`** - They won't align; test reusable components instead
- **Middleware runs on every request in SSR** - Be mindful of performance
- **`clientLoader.hydrate` blocks rendering** - Provide `HydrateFallback`
- **Params are always strings** - Convert with `Number(params.id)` or `parseInt()`
- **Loaders can't access component state** - Use search params or hidden form fields
- **Actions only run on POST/PUT/DELETE** - GET requests call loaders
