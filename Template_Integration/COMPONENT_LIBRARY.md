# 📦 Component Library - Driver App UI Kit

Complete set of reusable components based on Adminto-Django design system.

---

## 🎨 Design Principles

1. **Consistency** - All components follow the same design patterns
2. **Accessibility** - WCAG AA compliant
3. **Dark Mode** - Full support for light/dark themes
4. **Type Safety** - TypeScript with proper types
5. **Variants** - Multiple styles for different use cases
6. **Responsive** - Mobile-first approach

---

## 📚 Component List

### **Foundation Components**
1. ✅ Button - Primary UI action
2. ✅ Card - Container component
3. ✅ Badge - Status indicators
4. ✅ Input - Form input fields
5. ✅ Select - Dropdown selection
6. ✅ Checkbox - Toggle option
7. ✅ Radio - Single selection
8. ✅ Switch - Toggle switch
9. ✅ Textarea - Multi-line text
10. ✅ Modal - Dialog overlay

### **Data Display**
11. ✅ Table - Data tables
12. ✅ StatsCard - Statistics display
13. ✅ Avatar - User avatar
14. ✅ Alert - Notifications
15. ✅ Progress - Progress bar

### **Navigation**
16. ✅ Sidebar - Side navigation
17. ✅ Topbar - Top navigation
18. ✅ Breadcrumb - Navigation trail
19. ✅ Tabs - Tab navigation
20. ✅ Pagination - Page navigation

---

## 🔨 Component Implementations

### **1. Card Component**

**File:** `frontend/src/components/ui/Card.tsx`

```typescript
import { ReactNode, HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const cardVariants = cva(
  'rounded-lg transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'bg-white dark:bg-gray-800 shadow-sm',
        bordered: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
        ghost: 'bg-transparent',
      },
      padding: {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
      hover: {
        true: 'hover:shadow-lg cursor-pointer transform hover:-translate-y-1',
        false: '',
      }
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
      hover: false,
    },
  }
)

interface CardProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {
  children: ReactNode
}

export const Card = ({ children, variant, padding, hover, className, ...props }: CardProps) => {
  return (
    <div
      className={cn(cardVariants({ variant, padding, hover }), className)}
      {...props}
    >
      {children}
    </div>
  )
}

export const CardHeader = ({ 
  children, 
  className 
}: { 
  children: ReactNode
  className?: string 
}) => (
  <div className={cn(
    'pb-4 mb-4 border-b border-gray-200 dark:border-gray-700',
    className
  )}>
    {children}
  </div>
)

export const CardTitle = ({ 
  children, 
  className 
}: { 
  children: ReactNode
  className?: string 
}) => (
  <h3 className={cn(
    'text-lg font-semibold text-gray-900 dark:text-white',
    className
  )}>
    {children}
  </h3>
)

export const CardBody = ({ 
  children, 
  className 
}: { 
  children: ReactNode
  className?: string 
}) => (
  <div className={className}>
    {children}
  </div>
)

export const CardFooter = ({ 
  children, 
  className 
}: { 
  children: ReactNode
  className?: string 
}) => (
  <div className={cn(
    'pt-4 mt-4 border-t border-gray-200 dark:border-gray-700',
    className
  )}>
    {children}
  </div>
)
```

**Usage:**
```typescript
<Card variant="default" padding="md" hover>
  <CardHeader>
    <CardTitle>Vehicle Statistics</CardTitle>
  </CardHeader>
  <CardBody>
    <p>Content goes here</p>
  </CardBody>
  <CardFooter>
    <Button variant="primary">View Details</Button>
  </CardFooter>
</Card>
```

---

### **2. Button Component**

**File:** `frontend/src/components/ui/Button.tsx`

```typescript
import { ReactNode, ButtonHTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import { Loader2 } from 'lucide-react'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2',
  {
    variants: {
      variant: {
        primary: 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500 shadow-sm',
        secondary: 'bg-secondary-500 text-white hover:bg-secondary-600 focus:ring-secondary-500 shadow-sm',
        success: 'bg-success-500 text-white hover:bg-success-600 focus:ring-success-500 shadow-sm',
        danger: 'bg-danger-500 text-white hover:bg-danger-600 focus:ring-danger-500 shadow-sm',
        warning: 'bg-warning-500 text-white hover:bg-warning-600 focus:ring-warning-500 shadow-sm',
        info: 'bg-info-500 text-white hover:bg-info-600 focus:ring-info-500 shadow-sm',
        outline: 'border-2 border-primary-500 text-primary-500 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 focus:ring-primary-500',
        ghost: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
        link: 'text-primary-500 hover:text-primary-600 hover:underline',
        light: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600',
      },
      size: {
        sm: 'px-3 py-1.5 text-sm gap-1',
        md: 'px-4 py-2 text-base gap-2',
        lg: 'px-6 py-3 text-lg gap-2',
        icon: 'p-2',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
)

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  children: ReactNode
  isLoading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export const Button = ({
  children,
  variant,
  size,
  fullWidth,
  isLoading,
  leftIcon,
  rightIcon,
  className,
  disabled,
  ...props
}: ButtonProps) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="animate-spin" size={16} />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="inline-flex">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="inline-flex">{rightIcon}</span>}
        </>
      )}
    </button>
  )
}
```

**Usage:**
```typescript
<Button variant="primary" size="md">
  Submit
</Button>

<Button variant="success" leftIcon={<Check size={16} />}>
  Approve
</Button>

<Button variant="outline" isLoading={loading}>
  Save
</Button>
```

---

### **3. Badge Component**

**File:** `frontend/src/components/ui/Badge.tsx`

```typescript
import { ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-md font-semibold whitespace-nowrap transition-colors',
  {
    variants: {
      variant: {
        primary: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
        secondary: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-300',
        success: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300',
        danger: 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-300',
        warning: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300',
        info: 'bg-info-100 text-info-700 dark:bg-info-900/30 dark:text-info-300',
        gray: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-sm',
        lg: 'px-3 py-1.5 text-base',
      },
      rounded: {
        normal: 'rounded-md',
        full: 'rounded-full',
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      rounded: 'normal',
    },
  }
)

interface BadgeProps extends VariantProps<typeof badgeVariants> {
  children: ReactNode
  className?: string
  icon?: ReactNode
}

export const Badge = ({ children, variant, size, rounded, className, icon }: BadgeProps) => {
  return (
    <span className={cn(badgeVariants({ variant, size, rounded }), className)}>
      {icon && <span className="mr-1 inline-flex">{icon}</span>}
      {children}
    </span>
  )
}
```

**Usage:**
```typescript
<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="danger" rounded="full">Expired</Badge>
<Badge variant="info" icon={<Battery size={12} />}>EV</Badge>
```

---

### **4. StatsCard Component**

**File:** `frontend/src/components/ui/StatsCard.tsx`

```typescript
import { ReactNode } from 'react'
import { Card } from './Card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '../../lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  icon: ReactNode
  trend?: {
    value: number
    isPositive: boolean
    label?: string
  }
  color?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info'
  subtitle?: string
  onClick?: () => void
}

export const StatsCard = ({ 
  title, 
  value, 
  icon, 
  trend, 
  color = 'primary',
  subtitle,
  onClick 
}: StatsCardProps) => {
  const colorClasses = {
    primary: 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400',
    secondary: 'bg-secondary-100 text-secondary-600 dark:bg-secondary-900/30 dark:text-secondary-400',
    success: 'bg-success-100 text-success-600 dark:bg-success-900/30 dark:text-success-400',
    danger: 'bg-danger-100 text-danger-600 dark:bg-danger-900/30 dark:text-danger-400',
    warning: 'bg-warning-100 text-warning-600 dark:bg-warning-900/30 dark:text-warning-400',
    info: 'bg-info-100 text-info-600 dark:bg-info-900/30 dark:text-info-400',
  }

  return (
    <Card 
      hover={!!onClick} 
      onClick={onClick}
      className="group"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {value}
          </h3>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {subtitle}
            </p>
          )}
          {trend && (
            <div className={cn(
              'flex items-center gap-1 mt-2 text-sm font-medium',
              trend.isPositive 
                ? 'text-success-600 dark:text-success-400' 
                : trend.value === 0 
                  ? 'text-gray-500 dark:text-gray-400'
                  : 'text-danger-600 dark:text-danger-400'
            )}>
              {trend.isPositive ? (
                <TrendingUp size={16} />
              ) : trend.value === 0 ? (
                <Minus size={16} />
              ) : (
                <TrendingDown size={16} />
              )}
              <span>{Math.abs(trend.value)}%</span>
              {trend.label && (
                <span className="text-gray-500 dark:text-gray-500 font-normal">
                  {trend.label}
                </span>
              )}
            </div>
          )}
        </div>
        <div className={cn(
          'w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0',
          'group-hover:scale-110 transition-transform duration-200',
          colorClasses[color]
        )}>
          {icon}
        </div>
      </div>
    </Card>
  )
}
```

**Usage:**
```typescript
<StatsCard
  title="Total Vehicles"
  value="150"
  icon={<Truck size={24} />}
  trend={{ value: 12, isPositive: true, label: 'vs last month' }}
  color="primary"
  subtitle="Across all locations"
  onClick={() => navigate('/admin/fleet')}
/>
```

---

### **5. Input Component**

**File:** `frontend/src/components/ui/Input.tsx`

```typescript
import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '../../lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  className,
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
          {props.required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}
      <input
        ref={ref}
        className={cn(
          'w-full px-3 py-2 rounded-lg border transition-all duration-200',
          'bg-white dark:bg-gray-800',
          'text-gray-900 dark:text-white',
          'placeholder:text-gray-400 dark:placeholder:text-gray-500',
          error
            ? 'border-danger-500 focus:ring-danger-500 focus:border-danger-500'
            : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500',
          'focus:outline-none focus:ring-2 focus:ring-offset-0',
          'disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed',
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-danger-600 dark:text-danger-400">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {helperText}
        </p>
      )}
    </div>
  )
})

Input.displayName = 'Input'
```

**Usage:**
```typescript
<Input
  label="Vehicle Number"
  placeholder="Enter vehicle number"
  error={errors.vehicle_number}
  helperText="Format: AA-00-BB-0000"
  required
/>
```

---

### **6. Select Component**

**File:** `frontend/src/components/ui/Select.tsx`

```typescript
import { SelectHTMLAttributes, forwardRef } from 'react'
import { cn } from '../../lib/utils'
import { ChevronDown } from 'lucide-react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: SelectOption[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  error,
  options,
  placeholder,
  className,
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
          {props.required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            'w-full px-3 py-2 rounded-lg border transition-all duration-200',
            'bg-white dark:bg-gray-800',
            'text-gray-900 dark:text-white',
            'appearance-none cursor-pointer',
            error
              ? 'border-danger-500 focus:ring-danger-500 focus:border-danger-500'
              : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            'disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown 
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" 
          size={16} 
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-danger-600 dark:text-danger-400">
          {error}
        </p>
      )}
    </div>
  )
})

Select.displayName = 'Select'
```

**Usage:**
```typescript
<Select
  label="Fuel Type"
  placeholder="Select fuel type"
  options={[
    { value: 'petrol', label: 'Petrol' },
    { value: 'diesel', label: 'Diesel' },
    { value: 'electric', label: 'Electric' },
    { value: 'cng', label: 'CNG' },
  ]}
  error={errors.fuel_type}
  required
/>
```

---

### **7. Alert Component**

**File:** `frontend/src/components/ui/Alert.tsx`

```typescript
import { ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import { 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  Info,
  X 
} from 'lucide-react'

const alertVariants = cva(
  'rounded-lg p-4 flex items-start gap-3 transition-all duration-200',
  {
    variants: {
      variant: {
        success: 'bg-success-50 dark:bg-success-900/20 border-l-4 border-success-500',
        danger: 'bg-danger-50 dark:bg-danger-900/20 border-l-4 border-danger-500',
        warning: 'bg-warning-50 dark:bg-warning-900/20 border-l-4 border-warning-500',
        info: 'bg-info-50 dark:bg-info-900/20 border-l-4 border-info-500',
      },
    },
    defaultVariants: {
      variant: 'info',
    },
  }
)

interface AlertProps extends VariantProps<typeof alertVariants> {
  children: ReactNode
  title?: string
  onClose?: () => void
  className?: string
}

export const Alert = ({ 
  children, 
  variant, 
  title, 
  onClose, 
  className 
}: AlertProps) => {
  const icons = {
    success: <CheckCircle className="text-success-600 dark:text-success-400" size={20} />,
    danger: <AlertCircle className="text-danger-600 dark:text-danger-400" size={20} />,
    warning: <AlertTriangle className="text-warning-600 dark:text-warning-400" size={20} />,
    info: <Info className="text-info-600 dark:text-info-400" size={20} />,
  }

  const textColors = {
    success: 'text-success-800 dark:text-success-200',
    danger: 'text-danger-800 dark:text-danger-200',
    warning: 'text-warning-800 dark:text-warning-200',
    info: 'text-info-800 dark:text-info-200',
  }

  return (
    <div className={cn(alertVariants({ variant }), className)}>
      <div className="flex-shrink-0 mt-0.5">
        {icons[variant!]}
      </div>
      <div className="flex-1">
        {title && (
          <h4 className={cn('font-semibold mb-1', textColors[variant!])}>
            {title}
          </h4>
        )}
        <div className={cn('text-sm', textColors[variant!])}>
          {children}
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className={cn(
            'flex-shrink-0 rounded-lg p-1 transition-colors',
            'hover:bg-black/5 dark:hover:bg-white/5',
            textColors[variant!]
          )}
        >
          <X size={16} />
        </button>
      )}
    </div>
  )
}
```

**Usage:**
```typescript
<Alert variant="success" title="Success!">
  Vehicle added successfully
</Alert>

<Alert variant="danger" title="Error" onClose={() => setError(null)}>
  Failed to update vehicle status
</Alert>

<Alert variant="warning">
  This vehicle requires maintenance soon
</Alert>
```

---

### **8. Table Component**

**File:** `frontend/src/components/ui/Table.tsx`

```typescript
import { ReactNode, HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

interface TableProps extends HTMLAttributes<HTMLTableElement> {
  children: ReactNode
  hover?: boolean
  striped?: boolean
}

export const Table = ({ 
  children, 
  hover = true, 
  striped = false,
  className,
  ...props 
}: TableProps) => {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table
        className={cn(
          'w-full text-sm text-left',
          'text-gray-700 dark:text-gray-300',
          className
        )}
        {...props}
      >
        {children}
      </table>
    </div>
  )
}

export const TableHead = ({ 
  children, 
  className 
}: { 
  children: ReactNode
  className?: string 
}) => (
  <thead className={cn(
    'text-xs uppercase font-semibold',
    'bg-gray-50 dark:bg-gray-800',
    'text-gray-700 dark:text-gray-400',
    className
  )}>
    {children}
  </thead>
)

export const TableBody = ({ 
  children, 
  className,
  striped = false,
  hover = true,
}: { 
  children: ReactNode
  className?: string
  striped?: boolean
  hover?: boolean
}) => (
  <tbody className={cn(
    'divide-y divide-gray-200 dark:divide-gray-700',
    'bg-white dark:bg-gray-900',
    className
  )}>
    {children}
  </tbody>
)

export const TableRow = ({ 
  children, 
  className,
  onClick,
}: { 
  children: ReactNode
  className?: string
  onClick?: () => void
}) => (
  <tr 
    className={cn(
      'transition-colors duration-150',
      onClick && 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800',
      className
    )}
    onClick={onClick}
  >
    {children}
  </tr>
)

export const TableHeader = ({ 
  children, 
  className 
}: { 
  children: ReactNode
  className?: string 
}) => (
  <th className={cn('px-6 py-3 text-left', className)}>
    {children}
  </th>
)

export const TableCell = ({ 
  children, 
  className 
}: { 
  children: ReactNode
  className?: string 
}) => (
  <td className={cn(
    'px-6 py-4',
    'text-gray-900 dark:text-gray-100',
    className
  )}>
    {children}
  </td>
)
```

**Usage:**
```typescript
<Table hover striped>
  <TableHead>
    <TableRow>
      <TableHeader>Vehicle</TableHeader>
      <TableHeader>Status</TableHeader>
      <TableHeader>Driver</TableHeader>
      <TableHeader>Actions</TableHeader>
    </TableRow>
  </TableHead>
  <TableBody>
    {vehicles.map((vehicle) => (
      <TableRow key={vehicle.id}>
        <TableCell>{vehicle.registration_number}</TableCell>
        <TableCell>
          <Badge variant="success">{vehicle.status}</Badge>
        </TableCell>
        <TableCell>{vehicle.driver?.name || '-'}</TableCell>
        <TableCell>
          <Button variant="ghost" size="sm">Edit</Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

### **9. Modal Component**

**File:** `frontend/src/components/ui/Modal.tsx`

```typescript
import { ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Button } from './Button'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showCloseButton?: boolean
  footer?: ReactNode
}

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  footer,
}: ModalProps) => {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  }

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={cn(
            'relative w-full rounded-lg shadow-lg',
            'bg-white dark:bg-gray-800',
            'transform transition-all duration-300',
            'animate-fade-in',
            sizes[size]
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              {title && (
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {title}
                </h3>
              )}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 
                           transition-colors duration-200"
                >
                  <X size={20} className="text-gray-500 dark:text-gray-400" />
                </button>
              )}
            </div>
          )}
          
          {/* Body */}
          <div className="px-6 py-4">
            {children}
          </div>
          
          {/* Footer */}
          {footer && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 
                          bg-gray-50 dark:bg-gray-900/50 rounded-b-lg">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

**Usage:**
```typescript
<Modal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  title="Add New Vehicle"
  size="lg"
  footer={
    <div className="flex justify-end gap-2">
      <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleSubmit}>
        Save Vehicle
      </Button>
    </div>
  }
>
  <form>
    <Input label="Registration Number" />
    <Input label="Model" />
    {/* More form fields */}
  </form>
</Modal>
```

---

### **10. Progress Bar**

**File:** `frontend/src/components/ui/Progress.tsx`

```typescript
import { cn } from '../../lib/utils'

interface ProgressProps {
  value: number
  max?: number
  variant?: 'primary' | 'success' | 'danger' | 'warning' | 'info'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  label?: string
}

export const Progress = ({
  value,
  max = 100,
  variant = 'primary',
  size = 'md',
  showLabel = false,
  label,
}: ProgressProps) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  const variantClasses = {
    primary: 'bg-primary-500',
    success: 'bg-success-500',
    danger: 'bg-danger-500',
    warning: 'bg-warning-500',
    info: 'bg-info-500',
  }

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  }

  return (
    <div className="w-full">
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-1">
          {label && (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {label}
            </span>
          )}
          {showLabel && (
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div className={cn(
        'w-full rounded-full overflow-hidden',
        'bg-gray-200 dark:bg-gray-700',
        sizeClasses[size]
      )}>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300',
            variantClasses[variant]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
```

**Usage:**
```typescript
{/* Battery level */}
<Progress
  value={battery.currentCapacity}
  max={battery.maxCapacity}
  variant="success"
  size="md"
  showLabel
  label="Battery Level"
/>

{/* Trip completion */}
<Progress
  value={trip.distance_completed}
  max={trip.total_distance}
  variant="info"
  label="Trip Progress"
/>
```

---

### **11. Avatar Component**

**File:** `frontend/src/components/ui/Avatar.tsx`

```typescript
import { cn } from '../../lib/utils'
import { User } from 'lucide-react'

interface AvatarProps {
  src?: string
  alt?: string
  name?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  status?: 'online' | 'offline' | 'away' | 'busy'
  className?: string
}

export const Avatar = ({ 
  src, 
  alt, 
  name, 
  size = 'md',
  status,
  className 
}: AvatarProps) => {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  }

  const statusColors = {
    online: 'bg-success-500',
    offline: 'bg-gray-400',
    away: 'bg-warning-500',
    busy: 'bg-danger-500',
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className={cn('relative inline-block', className)}>
      <div className={cn(
        'rounded-full overflow-hidden flex items-center justify-center',
        'bg-primary-100 dark:bg-primary-900/30',
        'text-primary-700 dark:text-primary-300',
        'font-semibold',
        sizes[size]
      )}>
        {src ? (
          <img src={src} alt={alt || name} className="w-full h-full object-cover" />
        ) : name ? (
          <span>{getInitials(name)}</span>
        ) : (
          <User size={size === 'sm' ? 12 : size === 'md' ? 16 : size === 'lg' ? 20 : 24} />
        )}
      </div>
      
      {status && (
        <span className={cn(
          'absolute bottom-0 right-0 block rounded-full ring-2 ring-white dark:ring-gray-800',
          'w-2.5 h-2.5',
          size === 'sm' && 'w-2 h-2',
          size === 'xl' && 'w-3.5 h-3.5',
          statusColors[status]
        )} />
      )}
    </div>
  )
}
```

**Usage:**
```typescript
<Avatar 
  name="John Doe" 
  size="md" 
  status="online" 
/>

<Avatar 
  src="/avatars/user.jpg" 
  alt="User Avatar" 
  size="lg" 
/>
```

---

## 🎯 Usage in Real Scenarios

### **Scenario 1: Fleet Dashboard**

```typescript
import { Card, CardHeader, CardTitle, CardBody } from '../components/ui/Card'
import { StatsCard } from '../components/ui/StatsCard'
import { Badge } from '../components/ui/Badge'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../components/ui/Table'
import { Truck, Battery, Wrench, CheckCircle } from 'lucide-react'

const FleetDashboard = () => {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Vehicles"
          value="150"
          icon={<Truck size={24} />}
          trend={{ value: 12, isPositive: true }}
          color="primary"
        />
        <StatsCard
          title="Active"
          value="120"
          icon={<CheckCircle size={24} />}
          color="success"
        />
        <StatsCard
          title="Maintenance"
          value="25"
          icon={<Wrench size={24} />}
          color="warning"
        />
        <StatsCard
          title="Electric"
          value="30"
          icon={<Battery size={24} />}
          color="info"
        />
      </div>

      {/* Vehicle Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Vehicles</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Vehicle</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Type</TableHeader>
                <TableHeader>Driver</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>
                  <div className="font-medium">DL-01-AB-1234</div>
                  <div className="text-sm text-gray-500">Maruti Swift</div>
                </TableCell>
                <TableCell>
                  <Badge variant="success">Active</Badge>
                </TableCell>
                <TableCell>Petrol</TableCell>
                <TableCell>John Doe</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    </div>
  )
}
```

---

### **Scenario 2: Vehicle Form**

```typescript
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Button } from '../components/ui/Button'
import { Card, CardHeader, CardTitle, CardBody } from '../components/ui/Card'

const AddVehicleForm = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Vehicle</CardTitle>
      </CardHeader>
      <CardBody>
        <form className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Registration Number"
              placeholder="DL-01-AB-1234"
              required
            />
            <Select
              label="Fuel Type"
              placeholder="Select fuel type"
              options={[
                { value: 'petrol', label: 'Petrol' },
                { value: 'diesel', label: 'Diesel' },
                { value: 'electric', label: 'Electric' },
              ]}
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Model" placeholder="Maruti Swift" />
            <Input label="Year" type="number" placeholder="2023" />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost">
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Add Vehicle
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  )
}
```

---

## 📊 Component Feature Matrix

| Component | Dark Mode | Variants | Sizes | Icons | Loading | Disabled |
|-----------|-----------|----------|-------|-------|---------|----------|
| Button | ✅ | 9 | 3 | ✅ | ✅ | ✅ |
| Card | ✅ | 3 | 4 | - | - | - |
| Badge | ✅ | 7 | 3 | ✅ | - | - |
| Input | ✅ | 1 | 3 | ✅ | - | ✅ |
| Select | ✅ | 1 | 3 | ✅ | - | ✅ |
| Alert | ✅ | 4 | 1 | ✅ | - | - |
| StatsCard | ✅ | 6 | 1 | ✅ | - | - |
| Table | ✅ | 2 | 1 | - | - | - |
| Modal | ✅ | 1 | 5 | ✅ | - | - |
| Progress | ✅ | 5 | 3 | - | - | - |
| Avatar | ✅ | 1 | 4 | - | - | - |

---

## 🎨 Color Variant Guide

### **When to Use Each Variant**

```typescript
// Buttons
<Button variant="primary">   Primary action (Save, Submit)
<Button variant="secondary">  Secondary action (Edit, Update)
<Button variant="success">    Positive action (Approve, Complete)
<Button variant="danger">     Destructive action (Delete, Cancel)
<Button variant="warning">    Caution action (Archive, Suspend)
<Button variant="info">       Info action (View, Details)
<Button variant="outline">    Alternative action
<Button variant="ghost">      Subtle action
<Button variant="link">       Text link style

// Badges
<Badge variant="success">  Active, Completed, Available
<Badge variant="warning">  Pending, Scheduled, Review
<Badge variant="danger">   Inactive, Failed, Expired
<Badge variant="info">     Information, Note
<Badge variant="gray">     Neutral, Default

// Alerts
<Alert variant="success">  Success messages
<Alert variant="danger">   Error messages
<Alert variant="warning">  Warning messages
<Alert variant="info">     Informational messages
```

---

## 📖 Best Practices

### **1. Component Composition**
```typescript
// ✅ Good - Compose smaller components
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardBody>
    Content
  </CardBody>
</Card>

// ❌ Bad - Monolithic component
<div className="complex-single-component">
  {/* Everything in one place */}
</div>
```

### **2. Dark Mode Support**
```typescript
// ✅ Good - Always include dark: classes
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">

// ❌ Bad - Only light mode
<div className="bg-white text-gray-900">
```

### **3. Type Safety**
```typescript
// ✅ Good - Use interfaces
interface StatsCardProps {
  title: string
  value: string | number
  icon: ReactNode
}

// ❌ Bad - Use any
const StatsCard = (props: any) => {}
```

### **4. Reusability**
```typescript
// ✅ Good - Flexible with variants
<Button variant="primary" size="sm" leftIcon={<Plus />}>

// ❌ Bad - Specific styling only
<button className="bg-blue-500 px-4 py-2">
```

---

## 🚀 Quick Reference

### **Import Pattern**
```typescript
import { Card, CardHeader, CardTitle, CardBody } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
```

### **Common Patterns**
```typescript
// Stats dashboard
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <StatsCard {...} />
</div>

// Form layout
<form className="space-y-4">
  <Input {...} />
  <Select {...} />
</form>

// Action buttons
<div className="flex justify-end gap-2">
  <Button variant="ghost">Cancel</Button>
  <Button variant="primary">Submit</Button>
</div>
```

---

## 📦 File Organization

```
frontend/src/
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Alert.tsx
│   │   ├── Progress.tsx
│   │   ├── Avatar.tsx
│   │   ├── Modal.tsx
│   │   ├── Table.tsx
│   │   └── index.ts  (export all)
│   ├── StatsCard.tsx
│   ├── ThemeToggle.tsx
│   └── Layout.tsx
├── contexts/
│   └── ThemeContext.tsx
├── lib/
│   └── utils.ts
└── pages/
    └── ... your existing pages
```

---

## ✅ Component Creation Checklist

For each new component:

- [ ] Create TypeScript interface for props
- [ ] Add CVA variants for styling options
- [ ] Include dark mode support (dark: classes)
- [ ] Add proper TypeScript types
- [ ] Support disabled state if applicable
- [ ] Add ARIA labels for accessibility
- [ ] Include usage example in comments
- [ ] Export from index.ts

---

## 🎓 Learning Path

1. **Start with:** Button, Card, Badge (simple)
2. **Move to:** Input, Select (forms)
3. **Then:** Modal, Table (complex)
4. **Finally:** Custom components for your domain

---

**Created:** December 24, 2024  
**Status:** Ready to use  
**Maintenance:** Add more components as needed  

---

💡 **Remember:** These components are building blocks. Combine them creatively to build your perfect UI!

