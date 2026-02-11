---
name: mantine-ui
description: "Expert guidance for building React applications with Mantine UI. Use when working with Mantine components, styling, forms, layouts, or theming."
---

# Mantine UI

Expert guidance for building React applications with Mantine UI - a modern React component library with 100+ customizable components.

## Installation & Setup

### Install Packages

```bash
npm install @mantine/core @mantine/hooks
# Optional packages
npm install @mantine/form @mantine/dates @mantine/charts
npm install @mantine/notifications @mantine/modals @mantine/dropzone
```

### Basic Setup

Wrap your app with `MantineProvider`:

```tsx
import '@mantine/core/styles.css';
import { MantineProvider, createTheme } from '@mantine/core';

const theme = createTheme({
  primaryColor: 'blue',
  fontFamily: 'Inter, sans-serif',
});

function App() {
  return (
    <MantineProvider theme={theme}>
      {/* Your app here */}
    </MantineProvider>
  );
}
```

### Theme Customization

```tsx
const theme = createTheme({
  primaryColor: 'cyan',
  fontFamily: 'Inter, system-ui, sans-serif',
  defaultRadius: 'md',

  components: {
    Button: Button.extend({
      defaultProps: {
        variant: 'filled',
      },
    }),
  },
});
```

### Color Scheme (Dark Mode)

```tsx
<MantineProvider
  defaultColorScheme="auto" // 'light' | 'dark' | 'auto'
  theme={theme}
>
  {/* app */}
</MantineProvider>
```

## Core Components

### Button

```tsx
import { Button } from '@mantine/core';
import { IconPhoto, IconDownload, IconTrash } from '@tabler/icons-react';

// Basic variants
<Button variant="filled">Primary Action</Button>
<Button variant="light">Secondary Action</Button>
<Button variant="outline">Tertiary Action</Button>
<Button variant="subtle">Subtle Action</Button>
<Button variant="default">Default</Button>
<Button variant="gradient" gradient={{ from: 'blue', to: 'cyan', deg: 90 }}>
  Gradient
</Button>

// Colors
<Button color="blue">Blue</Button>
<Button color="red">Red</Button>
<Button color="green">Green</Button>
<Button color="gray">Gray</Button>

// With icons
<Button leftSection={<IconPhoto size={14} />}>Upload Photo</Button>
<Button rightSection={<IconDownload size={14} />}>Download</Button>

// Sizes
<Button size="xs">Extra Small</Button>
<Button size="sm">Small</Button>
<Button size="md">Medium (default)</Button>
<Button size="lg">Large</Button>
<Button size="xl">Extra Large</Button>
<Button size="compact-sm">Compact Small</Button>

// States
<Button loading>Processing...</Button>
<Button disabled>Disabled</Button>
<Button fullWidth>Full Width Button</Button>

// As different elements
<Button component="a" href="https://mantine.dev">External Link</Button>
<Button component={Link} to="/dashboard">React Router Link</Button>

// Button groups
<Button.Group>
  <Button variant="default">Left</Button>
  <Button variant="default">Center</Button>
  <Button variant="default">Right</Button>
</Button.Group>

<Button.Group orientation="vertical">
  <Button>Top</Button>
  <Button>Middle</Button>
  <Button>Bottom</Button>
</Button.Group>

// Common patterns
<Group justify="space-between">
  <Button variant="subtle" color="gray">Cancel</Button>
  <Button>Save Changes</Button>
</Group>

<Group justify="flex-end" mt="md">
  <Button variant="outline">Back</Button>
  <Button>Continue</Button>
</Group>

// Icon-only button
<Button variant="light" p={8}>
  <IconTrash size={16} />
</Button>
```

**Props:** variant, size, color, radius, fullWidth, disabled, loading, leftSection, rightSection, component, justify

### Input Components

```tsx
import {
  TextInput,
  Textarea,
  NumberInput,
  PasswordInput,
  Select,
  MultiSelect,
  Checkbox,
  Switch,
  Radio,
} from '@mantine/core';
import { IconMail, IconLock, IconAt, IconSearch } from '@tabler/icons-react';

// TextInput - single line text
<TextInput
  label="Email Address"
  placeholder="your@email.com"
  description="We'll never share your email"
  error="Invalid email format"
  withAsterisk
  leftSection={<IconMail size={16} />}
/>

<TextInput
  label="Username"
  placeholder="@username"
  leftSection={<IconAt size={16} />}
  rightSection={<IconSearch size={16} />}
/>

// Textarea - multi-line text
<Textarea
  label="Bio"
  placeholder="Tell us about yourself"
  description="Brief description for your profile"
  minRows={3}
  maxRows={6}
  autosize
/>

<Textarea
  label="Message"
  placeholder="Your message"
  rows={4}
  maxLength={500}
  withAsterisk
/>

// NumberInput
<NumberInput
  label="Age"
  placeholder="Your age"
  min={0}
  max={120}
  defaultValue={18}
/>

<NumberInput
  label="Price"
  placeholder="0.00"
  prefix="$"
  decimalScale={2}
  fixedDecimalScale
  thousandSeparator=","
/>

// PasswordInput
<PasswordInput
  label="Password"
  placeholder="Enter password"
  description="Must be at least 8 characters"
  withAsterisk
  leftSection={<IconLock size={16} />}
/>

// Select
<Select
  label="Country"
  placeholder="Select country"
  data={['USA', 'Canada', 'Mexico', 'UK']}
  searchable
  clearable
/>

<Select
  label="Role"
  placeholder="Pick one"
  data={[
    { value: 'admin', label: 'Administrator' },
    { value: 'user', label: 'Regular User' },
    { value: 'guest', label: 'Guest' },
  ]}
/>

// MultiSelect
<MultiSelect
  label="Skills"
  placeholder="Select all that apply"
  data={['React', 'TypeScript', 'Node.js', 'Python', 'Go']}
  searchable
  clearable
  maxValues={3}
/>

// Checkbox
<Checkbox label="I agree to terms and conditions" />
<Checkbox
  label="Subscribe to newsletter"
  description="Get weekly updates"
  indeterminate
/>

// Checkbox group
<Checkbox.Group
  label="Select your favorite frameworks"
  description="Choose all that you like"
  withAsterisk
>
  <Group mt="xs">
    <Checkbox value="react" label="React" />
    <Checkbox value="vue" label="Vue" />
    <Checkbox value="angular" label="Angular" />
  </Group>
</Checkbox.Group>

// Switch
<Switch label="Enable notifications" />
<Switch
  label="Auto-save"
  description="Automatically save changes"
  onLabel="ON"
  offLabel="OFF"
/>

// Radio
<Radio.Group
  label="Subscription Plan"
  description="Select your preferred plan"
  withAsterisk
>
  <Group mt="xs">
    <Radio value="free" label="Free" />
    <Radio value="pro" label="Pro - $10/month" />
    <Radio value="enterprise" label="Enterprise" />
  </Group>
</Radio.Group>

// Input variants
<TextInput label="Default" variant="default" placeholder="Default" />
<TextInput label="Filled" variant="filled" placeholder="Filled" />
<TextInput label="Unstyled" variant="unstyled" placeholder="Unstyled" />

// Input states
<TextInput label="Disabled" disabled placeholder="Can't type here" />
<TextInput label="Read only" readOnly value="Read-only value" />
<TextInput label="With error" error="This field is required" />
```

**Common input props:**
- `label` - input label text
- `placeholder` - hint text
- `description` - helper text below input
- `error` - error message (string or boolean)
- `withAsterisk` - show required asterisk
- `disabled` / `readOnly` - input states
- `leftSection` / `rightSection` - icons or controls
- `variant` - default, filled, unstyled
- `size` - xs, sm, md, lg, xl
- `radius` - border radius

**Textarea-specific props:**
- `minRows` / `maxRows` - control height
- `autosize` - auto-adjust height
- `maxLength` - character limit

### Modal, Table, Card, AppShell

```tsx
// Modal
const [opened, { open, close }] = useDisclosure(false);
<Modal opened={opened} onClose={close} title="Title" centered size="lg">
  Content
</Modal>

// Table
const data = { head: ['Name', 'Email'], body: [['John', 'john@email.com']] };
<Table data={data} striped highlightOnHover withTableBorder />

// Card
<Card shadow="sm" padding="lg" withBorder>
  <Card.Section><Image src="img.jpg" height={160} /></Card.Section>
  <Text fw={500}>Title</Text>
  <Button fullWidth mt="md">Action</Button>
</Card>

// AppShell - app layout
const [opened, { toggle }] = useDisclosure();
<AppShell
  header={{ height: 60 }}
  navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: !opened } }}
>
  <AppShell.Header><Burger opened={opened} onClick={toggle} /></AppShell.Header>
  <AppShell.Navbar>Nav</AppShell.Navbar>
  <AppShell.Main>Content</AppShell.Main>
</AppShell>
```

## Layout Components

```tsx
import { Group, Stack, Flex, Grid, Container, Box, Paper, Space, Divider } from '@mantine/core';

// Group - horizontal layout
<Group justify="center" gap="md">
  <Button>Button 1</Button>
  <Button>Button 2</Button>
  <Button>Button 3</Button>
</Group>

<Group justify="space-between">
  <Text>Left aligned</Text>
  <Button>Right aligned</Button>
</Group>

<Group justify="flex-end" gap="sm">
  <Button variant="outline">Cancel</Button>
  <Button>Save</Button>
</Group>

// Group with equal width children
<Group grow>
  <Button>Equal</Button>
  <Button>Width</Button>
  <Button>Buttons</Button>
</Group>

// Stack - vertical layout
<Stack gap="md">
  <TextInput label="Email" />
  <PasswordInput label="Password" />
  <Button>Submit</Button>
</Stack>

<Stack align="center" gap="xs">
  <Avatar size="xl" />
  <Text fw={500}>John Doe</Text>
  <Text c="dimmed" size="sm">john@example.com</Text>
</Stack>

<Stack align="stretch" gap="md">
  <Paper p="md" withBorder>Item 1</Paper>
  <Paper p="md" withBorder>Item 2</Paper>
</Stack>

// Flex - full flexbox control
<Flex
  direction="row"
  wrap="wrap"
  justify="space-between"
  align="center"
  gap="md"
>
  <Box>Item 1</Box>
  <Box>Item 2</Box>
  <Box>Item 3</Box>
</Flex>

<Flex direction="column" gap="sm">
  <Text>Vertical flex</Text>
  <Text>Item 2</Text>
</Flex>

// Responsive flex direction
<Flex
  direction={{ base: 'column', sm: 'row' }}
  gap={{ base: 'sm', sm: 'lg' }}
  justify={{ sm: 'center' }}
>
  <Button>Responsive</Button>
  <Button>Layout</Button>
</Flex>

// Grid - 12 column system
<Grid>
  <Grid.Col span={12}>Full width</Grid.Col>
  <Grid.Col span={6}>Half</Grid.Col>
  <Grid.Col span={6}>Half</Grid.Col>
  <Grid.Col span={4}>1/3</Grid.Col>
  <Grid.Col span={4}>1/3</Grid.Col>
  <Grid.Col span={4}>1/3</Grid.Col>
</Grid>

// Responsive grid
<Grid>
  <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
    <Paper p="md">Responsive column</Paper>
  </Grid.Col>
  <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
    <Paper p="md">Responsive column</Paper>
  </Grid.Col>
  <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
    <Paper p="md">Responsive column</Paper>
  </Grid.Col>
  <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
    <Paper p="md">Responsive column</Paper>
  </Grid.Col>
</Grid>

// Grid with gaps
<Grid gutter="xl">
  <Grid.Col span={6}><Paper p="md">Large gaps</Paper></Grid.Col>
  <Grid.Col span={6}><Paper p="md">Between columns</Paper></Grid.Col>
</Grid>

// Container - centered content with max-width
<Container size="xs">Extra small (540px)</Container>
<Container size="sm">Small (720px)</Container>
<Container size="md">Medium (960px)</Container>
<Container size="lg">Large (1140px)</Container>
<Container size="xl">Extra large (1320px)</Container>

// Box - universal layout wrapper
<Box p="md" bg="blue" c="white">
  Padded box with background
</Box>

<Box
  style={(theme) => ({
    padding: theme.spacing.md,
    backgroundColor: theme.colors.gray[0],
  })}
>
  Box with theme function
</Box>

// Common layout patterns

// Form layout
<Stack gap="md">
  <TextInput label="Name" />
  <TextInput label="Email" />
  <Textarea label="Message" />
  <Group justify="flex-end">
    <Button variant="outline">Cancel</Button>
    <Button>Submit</Button>
  </Group>
</Stack>

// Card grid layout
<Grid>
  {items.map((item) => (
    <Grid.Col key={item.id} span={{ base: 12, sm: 6, md: 4 }}>
      <Card>
        <Text>{item.title}</Text>
      </Card>
    </Grid.Col>
  ))}
</Grid>

// Header with logo and navigation
<Group justify="space-between" p="md">
  <Group>
    <Image src="logo.png" h={30} />
    <Text fw={700}>Brand</Text>
  </Group>
  <Group gap="xs">
    <Button variant="subtle">Home</Button>
    <Button variant="subtle">About</Button>
    <Button variant="subtle">Contact</Button>
  </Group>
</Group>

// Space and Divider utilities
<Stack>
  <Text>Section 1</Text>
  <Space h="md" />
  <Text>Section 2</Text>
  <Divider my="md" />
  <Text>Section 3</Text>
</Stack>
```

**Component Props:**
- **Group**: justify, gap, grow, wrap, align
- **Stack**: gap, align, justify
- **Flex**: direction, wrap, justify, align, gap
- **Grid**: gutter (spacing between columns)
- **Grid.Col**: span (1-12 or responsive object), offset
- **Container**: size (xs, sm, md, lg, xl, or number)
- **Box**: style props (p, m, bg, c, w, h, etc.)

## Form Handling

```tsx
import { useForm } from '@mantine/form';
import { TextInput, Button, Stack } from '@mantine/core';

const form = useForm({
  initialValues: { email: '', name: '' },
  validate: {
    email: (val) => (/^\S+@\S+$/.test(val) ? null : 'Invalid email'),
    name: (val) => (val.length < 2 ? 'Too short' : null),
  },
});

<form onSubmit={form.onSubmit((values) => console.log(values))}>
  <Stack>
    <TextInput label="Email" {...form.getInputProps('email')} />
    <TextInput label="Name" {...form.getInputProps('name')} />
    <Button type="submit">Submit</Button>
  </Stack>
</form>

// Nested: form.getInputProps('user.firstName')
// Lists: form.insertListItem('items', {...}), form.removeListItem('items', idx)
// Methods: getValues(), validate(), setFieldValue(path, val), reset(), isDirty()
```

## Common Hooks & Responsive Design

```tsx
import { useDisclosure, useToggle, useClipboard, useLocalStorage, useMediaQuery } from '@mantine/hooks';

// Boolean state
const [opened, { toggle, open, close }] = useDisclosure(false);

// Toggle values
const [theme, toggle] = useToggle(['light', 'dark']);

// Clipboard
const clipboard = useClipboard();
clipboard.copy('text'); // clipboard.copied is boolean

// localStorage
const [value, setValue] = useLocalStorage({ key: 'my-key', defaultValue: 'default' });

// Media queries
const isMobile = useMediaQuery('(max-width: 768px)');

// Responsive props (breakpoints: base, xs, sm, md, lg, xl)
<Button size={{ base: 'sm', lg: 'lg' }}>Responsive</Button>
<Box hiddenFrom="sm">Hidden on sm+</Box>
<Box visibleFrom="md">Visible on md+</Box>
```

## Styling

### Style Props (Recommended)

```tsx
import { Box, Text, Paper } from '@mantine/core';

// Spacing
<Box p="md">Padding medium</Box>
<Box px="lg" py="xs">Horizontal lg, vertical xs</Box>
<Box m="xl">Margin extra large</Box>
<Box mt="md" mb="sm">Margin top md, bottom sm</Box>

// Size
<Box w={200} h={100}>Fixed size</Box>
<Box w="100%" h="50vh">Relative size</Box>
<Box maw={500} mah={300}>Max width/height</Box>
<Box miw={200} mih={100}>Min width/height</Box>

// Colors
<Box bg="blue">Blue background</Box>
<Box bg="blue.5">Blue shade 5</Box>
<Box bg="rgba(0, 0, 0, 0.5)">Transparent black</Box>
<Text c="dimmed">Dimmed text color</Text>
<Text c="blue">Blue text</Text>
<Text c="red.7">Red shade 7</Text>

// Typography
<Text size="xs">Extra small</Text>
<Text size="sm">Small</Text>
<Text size="md">Medium</Text>
<Text size="lg">Large</Text>
<Text size="xl">Extra large</Text>
<Text fw={700}>Bold</Text>
<Text fs="italic">Italic</Text>
<Text td="underline">Underlined</Text>
<Text tt="uppercase">Uppercase</Text>

// Borders
<Paper withBorder>With border</Paper>
<Box style={{ borderRadius: 8 }}>Rounded corners</Box>

// Display & Position
<Box display="flex">Display flex</Box>
<Box pos="relative">Relative position</Box>
<Box pos="absolute" top={0} left={0}>Absolute</Box>

// Common patterns
<Box
  p="md"
  bg="gray.0"
  style={{ borderRadius: 8 }}
>
  Card-like box
</Box>

<Paper
  p="xl"
  shadow="sm"
  radius="md"
  withBorder
>
  Styled paper
</Paper>
```

**Common style props:**
- **Spacing**: p, px, py, pt, pr, pb, pl, m, mx, my, mt, mr, mb, ml
- **Size**: w, h, maw, mah, miw, mih
- **Colors**: bg (background), c (color)
- **Text**: size, fw (font-weight), fs (font-style), td (text-decoration), tt (text-transform)

### Inline Styles

```tsx
// Simple inline styles
<Button style={{ backgroundColor: 'red', color: 'white' }}>
  Custom Button
</Button>

// With theme function
<Box
  style={(theme) => ({
    padding: theme.spacing.md,
    backgroundColor: theme.colors.blue[0],
    borderRadius: theme.radius.md,
    '&:hover': {
      backgroundColor: theme.colors.blue[1],
    },
  })}
>
  Themed box
</Box>

// Responsive styles
<Box
  style={{
    padding: 16,
    '@media (max-width: 768px)': {
      padding: 8,
    },
  }}
>
  Responsive padding
</Box>
```

### Styles API (Component-Specific)

```tsx
// Target specific parts of a component
<Button
  classNames={{
    root: 'my-button-root',
    inner: 'my-button-inner',
    label: 'my-button-label',
  }}
  styles={{
    root: {
      backgroundColor: 'blue',
      border: '2px solid darkblue',
    },
    label: {
      fontSize: 18,
      fontWeight: 700,
    },
  }}
>
  Fully Custom Button
</Button>

<TextInput
  styles={{
    input: {
      backgroundColor: '#f0f0f0',
      border: '1px solid #ccc',
    },
    label: {
      fontSize: 14,
      fontWeight: 600,
    },
  }}
  label="Custom Input"
/>

// With theme function
<Card
  styles={(theme) => ({
    root: {
      backgroundColor: theme.colors.gray[0],
      '&:hover': {
        backgroundColor: theme.colors.gray[1],
      },
    },
  })}
>
  Custom card
</Card>
```

### CSS Modules

```tsx
// Demo.module.css
/*
.button {
  background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
}

.button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
*/

import classes from './Demo.module.css';

<Button className={classes.button}>
  Styled with CSS Module
</Button>

// Combine with classNames API
<Button
  className={classes.button}
  classNames={{
    label: classes.label,
  }}
>
  Combined styling
</Button>
```

### Using Theme Colors

```tsx
import { useMantineTheme } from '@mantine/core';

function Demo() {
  const theme = useMantineTheme();

  return (
    <Box
      style={{
        backgroundColor: theme.colors.blue[6],
        color: theme.white,
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
      }}
    >
      Using theme values
    </Box>
  );
}

// Color array access
<Box bg="blue.0">Lightest blue</Box>
<Box bg="blue.5">Medium blue</Box>
<Box bg="blue.9">Darkest blue</Box>
```

### Global Styles

```tsx
// In your app root or _app.tsx
import { MantineProvider, createTheme, Global } from '@mantine/core';

const theme = createTheme({
  fontFamily: 'Inter, sans-serif',
  headings: { fontFamily: 'Greycliff CF, sans-serif' },
});

function App() {
  return (
    <MantineProvider theme={theme}>
      <Global
        styles={(theme) => ({
          body: {
            backgroundColor: theme.colors.gray[0],
          },
          'h1, h2, h3': {
            color: theme.colors.dark[8],
          },
        })}
      />
      {/* Your app */}
    </MantineProvider>
  );
}
```

## Additional Components

```tsx
import { notifications } from '@mantine/notifications';
import { Drawer, Menu, Tooltip, Tabs, Badge, Avatar } from '@mantine/core';

// Notifications
notifications.show({ title: 'Success', message: 'Done!', color: 'green' });

// Drawer
<Drawer opened={opened} onClose={close} title="Drawer">Content</Drawer>

// Menu
<Menu>
  <Menu.Target><Button>Menu</Button></Menu.Target>
  <Menu.Dropdown>
    <Menu.Item>Settings</Menu.Item>
    <Menu.Item color="red">Delete</Menu.Item>
  </Menu.Dropdown>
</Menu>

// Tooltip & Badge
<Tooltip label="Info"><Button>Hover</Button></Tooltip>
<Badge>New</Badge>
<Badge color="red">Urgent</Badge>

// Avatar
<Avatar src="avatar.jpg" radius="xl" />
<Avatar color="blue">JD</Avatar>
```

## Best Practices

1. **Always wrap with MantineProvider** at app root
2. **Import CSS** - `import '@mantine/core/styles.css'`
3. **Use theme for consistency** - define colors, fonts, radius in theme
4. **Leverage hooks** - useDisclosure, useForm, etc. for common patterns
5. **Responsive by default** - use responsive props and breakpoints
6. **Accessibility** - always provide labels or aria-labels
7. **Form validation** - use useForm for robust form handling
8. **CSS Modules over inline styles** for better performance
9. **Use Styles API** for component-specific customization
10. **Polymorphic components** - use `component` prop to render as different elements
