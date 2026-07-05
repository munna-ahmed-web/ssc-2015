# UI Redesign Rules

## Goal

All color, typography, and spacing must flow from a single source of truth: `src/styles/global.css`.
No hardcoded hex values, no `text-[#818898]`, no `bg-[#F8FAFB]` in component files.
Functionality is never touched — only the visual layer is replaced.

---

## Component Lookup Order

When you need a UI element, check in this order:

### 1. `src/components/shared/`

High-level layout composites. Use these before building anything new.

| Component | Use for |
|---|---|
| `Header` | Page / app header |
| `Sidebar` | App sidebar navigation |
| `Footer` | Page footer |
| `Modal/ItemDeleteModal` | Confirmation / delete dialogs |
| `CommonTable` | Data tables |
| `Loading/ItemLoading` | Loading skeletons / spinners |
| `Error/ItemError` | Error boundary display |
| `NotFound/ItemNotFound` | Empty-state display |
| `Date/DateNavigation` | Date pickers / navigation |

### 2. `src/components/ui/`

shadcn atomic components. Already installed and token-wired.

| Component | Import from |
|---|---|
| `Button` | `@/components/ui/button` |
| `Input` | `@/components/ui/input` |
| `Label` | `@/components/ui/label` |
| `Checkbox` | `@/components/ui/checkbox` |
| `Select`, `SelectTrigger`, `SelectContent`, `SelectItem`, `SelectValue` | `@/components/ui/select` |
| `Textarea` | `@/components/ui/textarea` |
| `Card`, `CardHeader`, `CardContent`, `CardFooter` | `@/components/ui/card` |
| `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter` | `@/components/ui/dialog` |
| `Drawer`, `DrawerContent`, `DrawerHeader`, `DrawerTitle`, `DrawerFooter` | `@/components/ui/drawer` |
| `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` | `@/components/ui/tabs` |
| `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem` | `@/components/ui/dropdown-menu` |
| `Popover`, `PopoverTrigger`, `PopoverContent` | `@/components/ui/popover` |
| `Badge` | `@/components/ui/badge` |
| `Avatar`, `AvatarImage`, `AvatarFallback` | `@/components/ui/avatar` |
| `Separator` | `@/components/ui/separator` |
| `Skeleton` | `@/components/ui/skeleton` |
| `Switch` | `@/components/ui/switch` |
| `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` | `@/components/ui/table` |
| `Calendar` | `@/components/ui/calendar` |
| `Field`, `FieldLabel`, `FieldError`, `FieldGroup`, `FieldDescription` | `@/components/ui/field` |

### 3. Install a new shadcn component

If neither `shared` nor `ui` has what you need, ask the developer to install it:

```bash
npx shadcn@latest add <component-name>
```

Never build a custom atom when a shadcn component exists.

---

## Token System

All design values are defined in `src/styles/global.css` in three layers:

```
LAYER 1 — Primitives       :root { --color-brand-500: #647247; }
LAYER 2 — Semantic tokens  @theme { --color-primary: ...; }
LAYER 3 — shadcn bridge    @theme inline { --color-primary: var(--primary); }
```

**Use only token-driven Tailwind classes in JSX:**

| Intent | Class to use | NOT |
|---|---|---|
| Page background | `bg-background` | `bg-[#F8FAFB]` |
| Card surface | `bg-card` | `bg-white` |
| Primary button | `bg-primary` | `bg-[#647247]` |
| Body text | `text-foreground` | `text-[#1b1f14]` |
| Muted / caption text | `text-muted-foreground` | `text-[#818898]` |
| Input border | `border-input` | `border-gray-300` |
| Error text | `text-destructive` | `text-red-500` |
| Error border | `border-destructive` | `border-red-400` |
| Focus ring | `ring-ring` | `ring-blue-500` |
| Divider / separator | `bg-border` | `bg-gray-200` |

Layout and spacing utilities (`flex`, `gap-4`, `px-6`, `rounded-md`) are structural — they are fine to use directly.

---

## Form Pattern

Use this pattern for every form field. `FieldError` handles multi-error lists and null-safety automatically.

```tsx
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FieldError } from '@/components/ui/field';

<div className="space-y-1.5">
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    type="email"
    placeholder="example@mail.com"
    aria-invalid={!!errors.email}
    className={errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}
    {...register('email')}
  />
  <FieldError errors={[{ message: errors.email?.message }]} />
</div>
```

**Checkbox with react-hook-form** — Radix `Checkbox` is not a native input, must use `Controller`:

```tsx
import { Controller } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';

<Controller
  name="rememberMe"
  control={control}
  render={({ field }) => (
    <Checkbox
      id="rememberMe"
      checked={!!field.value}
      onCheckedChange={field.onChange}
    />
  )}
/>
```

**Select with react-hook-form** — same pattern, use `Controller`:

```tsx
import { Controller } from 'react-hook-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

<Controller
  name="category"
  control={control}
  render={({ field }) => (
    <Select value={field.value} onValueChange={field.onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Choose..." />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.id} value={opt.value}>{opt.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )}
/>
```

---

## Rules

1. **Never modify `src/components/ui/*.tsx`** — shadcn components are owned by the library. Customize via `className` prop at the call site only.

2. **Never modify `src/components/shared/*.tsx` functionality** — shared components have logic and data fetching wired in. Only wrap or extend them visually if needed.

3. **Never hardcode colors** — if a design spec gives you a hex, find the matching token in `global.css` or ask for a new primitive to be added.

4. **Use `lucide-react` for icons** — it is already installed. Do not add new icon libraries. Browse icons at [lucide.dev](https://lucide.dev).

5. **Typography comes from `@layer base`** — bare `h1`–`h4`, `p`, `a`, `button` elements get font-size, line-height, and color automatically from `global.css`. Do not add `text-2xl font-bold` to every heading.

6. **Dark mode is automatic** — tokens flip via `.dark` class in `global.css`. Never write `dark:text-[#fff]` or similar.

7. **Do not add functionality** — the redesign scope is visual only. Move no business logic, change no API calls, alter no form validation schemas.

---

## Reference: Completed Redesigns

| File | What changed |
|---|---|
| `src/app/[locale]/(unauth)/auth/sign-in/page.tsx` | Full Card shell, token-driven, no hardcoded colors |
| `src/components/auth/SignInForm/SignInForm.tsx` | shadcn Label + Input + Checkbox + FieldError |
| `src/components/auth/GoogleLogin/GoogleLogin.tsx` | `Button variant="outline"` replacing raw button |
| `src/components/header/MobileMenu/MobileMenu.tsx` | Drawer `direction="top"` with correct className overrides |
| `src/components/promptGallery/DynamicPlaceholderForm/DynamicPlaceholderForm.tsx` | shadcn Select replacing undefined CustomSelect |
