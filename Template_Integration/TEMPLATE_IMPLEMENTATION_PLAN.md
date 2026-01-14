# 🎨 Template Implementation Plan - Driver App

## Complete Design System Integration with Dark/Light Theme

**Project:** Fleet Management System (Driver App)  
**Current Status:** 40% Complete (Backend 100%, Frontend 20%)  
**Target:** Integrate Adminto-Django & Main-Files templates  
**Priority:** Implement switchable Dark/Light theme

---

## 📊 Current Project Analysis

### **What We Have**

```
✅ Backend: FastAPI + MongoDB (Complete)
✅ Frontend: React 18 + TypeScript + Vite
✅ Styling: TailwindCSS (Basic setup)
✅ State: Zustand
✅ Components: 15 components created
✅ Pages: 17 pages (8 user, 8 admin, 1 auth)
✅ Routes: Protected routes with role-based access
```

### **What We Need**

```
❌ Consistent design system
❌ Dark/Light theme switching
❌ Professional UI components
❌ Better layout structure
❌ Enhanced visual hierarchy
❌ Color scheme implementation
❌ Icon system integration
```

---

## 🎯 Recommended Theme Selection

### **Primary Choice: Adminto-Django (Vertical Menu)**

**Why?**

- ✅ Built for admin dashboards
- ✅ Complete dark theme support
- ✅ Modern, professional design
- ✅ Bootstrap 5 based (mature & stable)
- ✅ Extensive component library
- ✅ Perfect for fleet management
- ✅ Mobile responsive

### **Secondary Choice: Main-Files Mobile-App**

**For:** Driver mobile interface (future enhancement)
**Why?**

- ✅ Designed for mobile-first
- ✅ Financial/transaction UI
- ✅ Clean, modern interface
- ✅ Perfect for driver view

### **Tertiary: Main-Files eCommerce**

**For:** Future marketplace features (if needed)

---

## 🎨 Design System Implementation

### **Phase 1: Foundation Setup (Week 3 - Days 1-2)**

#### **1.1 Install Required Dependencies**

```bash
cd frontend
npm install @radix-ui/react-dropdown-menu
npm install @radix-ui/react-dialog
npm install @radix-ui/react-tabs
npm install @radix-ui/react-switch
npm install lucide-react
npm install class-variance-authority
npm install clsx tailwind-merge
```

#### **1.2 Create Theme System**

**File:** `frontend/src/theme/colors.ts`

```typescript
export const lightTheme = {
  // From Adminto _variables.scss
  primary: "#188ae2",
  secondary: "#5b69bc",
  success: "#10c469",
  danger: "#ff5b5b",
  warning: "#f9c851",
  info: "#35b8e0",

  // Backgrounds
  body: {
    bg: "#f0f4f7",
    color: "#4c4c5c",
    secondaryBg: "#ffffff",
    secondaryColor: "#9ba6b7",
    tertiaryBg: "#f6f7fb",
  },

  // Grays
  gray: {
    100: "#f6f7fb",
    200: "#eef2f7",
    300: "#e7e9eb",
    400: "#ced4da",
    500: "#a1a9b1",
    600: "#8a969c",
    700: "#6c757d",
    800: "#343a40",
    900: "#313a46",
  },

  // Borders
  border: "#e7e9eb",
  borderTranslucent: "#ced4da",
};

export const darkTheme = {
  // From Adminto _variables-dark.scss
  primary: "#188ae2",
  secondary: "#5b69bc",
  success: "#10c469",
  danger: "#ff5b5b",
  warning: "#f9c851",
  info: "#35b8e0",

  // Dark Backgrounds
  body: {
    bg: "#1c1d27",
    color: "#aab8c5",
    secondaryBg: "#252631",
    secondaryColor: "#8391a2",
    tertiaryBg: "#404954",
  },

  // Dark Grays
  gray: {
    100: "#404954",
    200: "#37394d",
    300: "#323d4b",
    400: "#464f5b",
    500: "#8391a2",
    600: "#aab8c5",
    700: "#dee2e6",
    800: "#f1f1f1",
    900: "#ffffff",
  },

  // Dark Borders
  border: "#37394d",
  borderTranslucent: "#323d4b",
};
```

#### **1.3 Update Tailwind Config**

**File:** `frontend/tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class", // Enable class-based dark mode
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Adminto Primary Colors
        primary: {
          DEFAULT: "#188ae2",
          50: "#e8f4fd",
          100: "#d1e9fb",
          200: "#a3d3f7",
          300: "#75bdf3",
          400: "#47a7ef",
          500: "#188ae2",
          600: "#136eb5",
          700: "#0e5388",
          800: "#0a375a",
          900: "#051c2d",
        },
        secondary: {
          DEFAULT: "#5b69bc",
          50: "#eff1fc",
          100: "#dfe3f9",
          200: "#bfc7f3",
          300: "#9fabec",
          400: "#7f8fe6",
          500: "#5b69bc",
          600: "#495497",
          700: "#373f71",
          800: "#252a4c",
          900: "#121526",
        },
        success: {
          DEFAULT: "#10c469",
          50: "#e7fbf1",
          100: "#cff7e3",
          200: "#9fefc7",
          300: "#6fe7ab",
          400: "#3fdf8f",
          500: "#10c469",
          600: "#0d9d54",
          700: "#0a763f",
          800: "#064e2a",
          900: "#032715",
        },
        danger: {
          DEFAULT: "#ff5b5b",
          50: "#ffebeb",
          100: "#ffd7d7",
          200: "#ffafaf",
          300: "#ff8787",
          400: "#ff6f6f",
          500: "#ff5b5b",
          600: "#cc4949",
          700: "#993737",
          800: "#662525",
          900: "#331212",
        },
        warning: {
          DEFAULT: "#f9c851",
          50: "#fef9ed",
          100: "#fdf3db",
          200: "#fbe7b7",
          300: "#fadb93",
          400: "#f8cf6f",
          500: "#f9c851",
          600: "#c7a041",
          700: "#957831",
          800: "#645020",
          900: "#322810",
        },
        info: {
          DEFAULT: "#35b8e0",
          50: "#eaf8fd",
          100: "#d5f1fb",
          200: "#abe3f7",
          300: "#81d5f3",
          400: "#57c7ef",
          500: "#35b8e0",
          600: "#2a93b3",
          700: "#206e86",
          800: "#15495a",
          900: "#0b252d",
        },
        // Gray scale
        gray: {
          50: "#f6f7fb",
          100: "#eef2f7",
          200: "#e7e9eb",
          300: "#ced4da",
          400: "#a1a9b1",
          500: "#8a969c",
          600: "#6c757d",
          700: "#343a40",
          800: "#313a46",
          900: "#1c1d27",
        },
      },
      fontFamily: {
        sans: ['"Public Sans"', "system-ui", "sans-serif"],
      },
      fontSize: {
        xs: "0.75rem", // 12px
        sm: "0.85rem", // 13.6px
        base: "0.875rem", // 14px - Adminto base
        lg: "1.09rem", // ~15.3px
        xl: "1.25rem", // 20px
        "2xl": "1.5rem", // 24px
        "3xl": "1.875rem", // 30px
        "4xl": "2.25rem", // 36px
      },
      spacing: {
        18: "4.5rem", // 72px
        88: "22rem", // 352px
      },
      borderRadius: {
        sm: "0.25rem",
        DEFAULT: "0.3rem",
        md: "0.3rem",
        lg: "0.4rem",
        xl: "1rem",
        "2xl": "2rem",
      },
      boxShadow: {
        sm: "0 0.125rem 0.25rem rgba(154,161,171,.15)",
        DEFAULT: "0 0 15px 0 rgba(154,161,171,.05)",
        lg: "0 0 45px 0 rgba(154,161,171,.2)",
      },
    },
  },
  plugins: [],
};
```

#### **1.4 Create Theme Context & Hook**

**File:** `frontend/src/contexts/ThemeContext.tsx`

```typescript
import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check localStorage first
    const saved = localStorage.getItem("theme") as Theme;
    if (saved) return saved;

    // Check system preference
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }

    return "light";
  });

  useEffect(() => {
    // Update document class
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);

    // Save to localStorage
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};
```

#### **1.5 Create Theme Toggle Component**

**File:** `frontend/src/components/ThemeToggle.tsx`

```typescript
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex items-center justify-center w-10 h-10 rounded-lg
                 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
                 transition-colors duration-200"
      aria-label="Toggle theme"
    >
      {theme === "light" ? (
        <Moon className="w-5 h-5 text-gray-700 dark:text-gray-200" />
      ) : (
        <Sun className="w-5 h-5 text-yellow-500" />
      )}
    </button>
  );
};
```

---

### **Phase 2: Layout Components (Week 3 - Days 3-4)**

#### **2.1 Enhanced Layout Component**

**File:** `frontend/src/components/Layout.tsx`

```typescript
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useTheme } from "../contexts/ThemeContext";
import { ThemeToggle } from "./ThemeToggle";
import {
  LayoutDashboard,
  Users,
  Truck,
  Route,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  User,
  ChevronDown,
} from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
  isAdmin?: boolean;
}

const Layout = ({ children, isAdmin = false }: LayoutProps) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const adminLinks = [
    { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/admin/users", icon: Users, label: "Users" },
    { to: "/admin/drivers", icon: User, label: "Drivers" },
    { to: "/admin/fleet", icon: Truck, label: "Fleet" },
    { to: "/admin/trips", icon: Route, label: "Trips" },
    { to: "/admin/statuses", icon: Settings, label: "Statuses" },
  ];

  const userLinks = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/user/trips", icon: Route, label: "My Trips" },
    { to: "/user/my-vehicle", icon: Truck, label: "My Vehicle" },
    { to: "/user/my-earnings", icon: Settings, label: "Earnings" },
    { to: "/profile", icon: User, label: "Profile" },
  ];

  const links = isAdmin ? adminLinks : userLinks;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Topbar */}
      <header
        className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-800 
                         border-b border-gray-200 dark:border-gray-700 z-50
                         shadow-sm transition-colors duration-200"
      >
        <div className="flex items-center justify-between h-full px-4">
          {/* Left section */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700
                       transition-colors duration-200 lg:hidden"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <Link
              to={isAdmin ? "/admin" : "/dashboard"}
              className="flex items-center gap-2"
            >
              <Truck className="w-8 h-8 text-primary-500" />
              <span className="text-xl font-semibold text-gray-900 dark:text-white">
                Fleet Manager
              </span>
            </Link>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <button
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700
                             transition-colors duration-200 hidden md:block"
            >
              <Search size={20} className="text-gray-600 dark:text-gray-300" />
            </button>

            {/* Notifications */}
            <button
              className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700
                             transition-colors duration-200"
            >
              <Bell size={20} className="text-gray-600 dark:text-gray-300" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full" />
            </button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Menu */}
            <div className="flex items-center gap-2 pl-3 border-l border-gray-200 dark:border-gray-700">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.full_name || user?.email}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.role}
                </p>
              </div>
              <button
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 
                               dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.full_name?.charAt(0) || user?.email?.charAt(0)}
                  </span>
                </div>
                <ChevronDown
                  size={16}
                  className="text-gray-600 dark:text-gray-300 hidden md:block"
                />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`
        fixed top-16 left-0 bottom-0 w-64 bg-white dark:bg-gray-800 
        border-r border-gray-200 dark:border-gray-700 z-40
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        <nav className="p-4 space-y-2 overflow-y-auto h-full">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;

            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg
                  transition-all duration-200
                  ${
                    isActive
                      ? "bg-primary-500 text-white shadow-lg"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }
                `}
              >
                <Icon size={20} />
                <span className="font-medium">{link.label}</span>
              </Link>
            );
          })}

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg w-full
                     text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20
                     transition-all duration-200 mt-8"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="pt-16 lg:pl-64 transition-all duration-300">
        <div className="p-6">{children}</div>
      </main>

      {/* Sidebar Overlay (Mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
```

---

### **Phase 3: Component Library (Week 3 - Days 5-7)**

#### **3.1 Card Component**

**File:** `frontend/src/components/ui/Card.tsx`

```typescript
import { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const cardVariants = cva("rounded-lg transition-all duration-200", {
  variants: {
    variant: {
      default: "bg-white dark:bg-gray-800 shadow-sm",
      bordered:
        "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
      ghost: "bg-transparent",
    },
    padding: {
      none: "p-0",
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
    },
    hover: {
      true: "hover:shadow-lg cursor-pointer",
      false: "",
    },
  },
  defaultVariants: {
    variant: "default",
    padding: "md",
    hover: false,
  },
});

interface CardProps extends VariantProps<typeof cardVariants> {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card = ({
  children,
  variant,
  padding,
  hover,
  className,
  onClick,
}: CardProps) => {
  return (
    <div
      className={cn(cardVariants({ variant, padding, hover }), className)}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "pb-4 border-b border-gray-200 dark:border-gray-700",
      className
    )}
  >
    {children}
  </div>
);

export const CardTitle = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <h3
    className={cn(
      "text-lg font-semibold text-gray-900 dark:text-white",
      className
    )}
  >
    {children}
  </h3>
);

export const CardBody = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => <div className={cn("pt-4", className)}>{children}</div>;
```

#### **3.2 Button Component**

**File:** `frontend/src/components/ui/Button.tsx`

```typescript
import { ReactNode, ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary: "bg-primary-500 text-white hover:bg-primary-600 shadow-sm",
        secondary:
          "bg-secondary-500 text-white hover:bg-secondary-600 shadow-sm",
        success: "bg-success-500 text-white hover:bg-success-600 shadow-sm",
        danger: "bg-danger-500 text-white hover:bg-danger-600 shadow-sm",
        warning: "bg-warning-500 text-white hover:bg-warning-600 shadow-sm",
        info: "bg-info-500 text-white hover:bg-info-600 shadow-sm",
        outline:
          "border-2 border-primary-500 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20",
        ghost:
          "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700",
        link: "text-primary-500 hover:underline",
      },
      size: {
        sm: "px-3 py-1.5 text-sm",
        md: "px-4 py-2 text-base",
        lg: "px-6 py-3 text-lg",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      fullWidth: false,
    },
  }
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  children: ReactNode;
  isLoading?: boolean;
}

export const Button = ({
  children,
  variant,
  size,
  fullWidth,
  isLoading,
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
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  );
};
```

#### **3.3 Badge Component**

**File:** `frontend/src/components/ui/Badge.tsx`

```typescript
import { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md font-semibold transition-colors",
  {
    variants: {
      variant: {
        primary:
          "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300",
        secondary:
          "bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-300",
        success:
          "bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300",
        danger:
          "bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-300",
        warning:
          "bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300",
        info: "bg-info-100 text-info-700 dark:bg-info-900/30 dark:text-info-300",
        gray: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-1 text-sm",
        lg: "px-3 py-1.5 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

interface BadgeProps extends VariantProps<typeof badgeVariants> {
  children: ReactNode;
  className?: string;
}

export const Badge = ({ children, variant, size, className }: BadgeProps) => {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)}>
      {children}
    </span>
  );
};
```

#### **3.4 Utility Functions**

**File:** `frontend/src/lib/utils.ts`

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

### **Phase 4: Update Existing Pages (Week 4 - Days 1-3)**

#### **4.1 Update App.tsx**

```typescript
// Add ThemeProvider wrapper
import { ThemeProvider } from "./contexts/ThemeContext";

function App() {
  // ... existing code

  return (
    <ThemeProvider>
      <ToastContainer />
      <BrowserRouter>{/* ... existing routes */}</BrowserRouter>
    </ThemeProvider>
  );
}
```

#### **4.2 Update index.css**

**File:** `frontend/src/index.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom CSS Variables for theme colors */
:root {
  /* Light theme colors */
  --color-primary: 24 138 226;
  --color-secondary: 91 105 188;
  --color-success: 16 196 105;
  --color-danger: 255 91 91;
  --color-warning: 249 200 81;
  --color-info: 53 184 224;
}

.dark {
  /* Dark theme inherits same colors but different backgrounds */
}

/* Smooth transitions */
* {
  @apply transition-colors duration-200;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  @apply bg-gray-100 dark:bg-gray-800;
}

::-webkit-scrollbar-thumb {
  @apply bg-gray-300 dark:bg-gray-600 rounded-full;
}

::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-400 dark:bg-gray-500;
}

/* Animation classes */
@keyframes slideIn {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.animate-slide-in {
  animation: slideIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.animate-fade-in {
  animation: fadeIn 0.2s ease-out;
}
```

---

### **Phase 5: Stats Cards & Dashboard (Week 4 - Days 4-5)**

#### **5.1 Stats Card Component**

**File:** `frontend/src/components/StatsCard.tsx`

```typescript
import { ReactNode } from "react";
import { Card } from "./ui/Card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: "primary" | "success" | "danger" | "warning" | "info";
}

export const StatsCard = ({
  title,
  value,
  icon,
  trend,
  color = "primary",
}: StatsCardProps) => {
  const colorClasses = {
    primary:
      "bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400",
    success:
      "bg-success-100 text-success-600 dark:bg-success-900/30 dark:text-success-400",
    danger:
      "bg-danger-100 text-danger-600 dark:bg-danger-900/30 dark:text-danger-400",
    warning:
      "bg-warning-100 text-warning-600 dark:bg-warning-900/30 dark:text-warning-400",
    info: "bg-info-100 text-info-600 dark:bg-info-900/30 dark:text-info-400",
  };

  return (
    <Card hover className="group">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </h3>
          {trend && (
            <div
              className={`flex items-center gap-1 mt-2 text-sm ${
                trend.isPositive ? "text-success-600" : "text-danger-600"
              }`}
            >
              {trend.isPositive ? (
                <TrendingUp size={16} />
              ) : (
                <TrendingDown size={16} />
              )}
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        <div
          className={`w-14 h-14 rounded-lg flex items-center justify-center ${colorClasses[color]}`}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
};
```

---

## 📋 Implementation Checklist

### **Week 3: Foundation (Days 1-7)**

- [ ] Day 1: Install dependencies & setup theme system
- [ ] Day 2: Create ThemeContext, ThemeToggle, update Tailwind
- [ ] Day 3: Update Layout component with new design
- [ ] Day 4: Test layout on all pages, fix responsive issues
- [ ] Day 5: Create UI component library (Card, Button, Badge)
- [ ] Day 6: Create StatsCard, update Dashboard
- [ ] Day 7: Update all forms with new styling

### **Week 4: Enhancement (Days 1-5)**

- [ ] Day 1: Update Fleet page with new components
- [ ] Day 2: Update Trips pages with new styling
- [ ] Day 3: Update all modals with Card component
- [ ] Day 4: Add animations and transitions
- [ ] Day 5: Final testing and polish

---

## 🎨 Color Usage Guide

### **When to Use Each Color**

```typescript
// Status Colors
const statusColors = {
  active: "success", // Green - Active vehicles, completed trips
  pending: "warning", // Yellow - Pending approvals, scheduled
  inactive: "gray", // Gray - Inactive, offline
  error: "danger", // Red - Errors, expired docs, overdue
  info: "info", // Cyan - Information, notifications
  primary: "primary", // Blue - Primary actions, links
};

// Vehicle Types
const vehicleTypeColors = {
  electric: "success", // Green for EV
  fuel: "warning", // Yellow for fuel vehicles
};

// Trip Status
const tripStatusColors = {
  completed: "success",
  ongoing: "info",
  scheduled: "warning",
  cancelled: "danger",
};
```

---

## 🚀 Benefits of This Implementation

### **1. Consistency**

- ✅ Unified color system across app
- ✅ Consistent spacing and typography
- ✅ Reusable component library

### **2. Theme Support**

- ✅ Full dark/light mode
- ✅ System preference detection
- ✅ Persistent user choice

### **3. Professional UI**

- ✅ Modern, clean design
- ✅ Smooth transitions
- ✅ Better visual hierarchy

### **4. Developer Experience**

- ✅ Type-safe components
- ✅ Variant-based styling
- ✅ Easy to extend

### **5. Performance**

- ✅ CSS-in-JS with TailwindCSS (JIT)
- ✅ Minimal runtime overhead
- ✅ Tree-shakeable

---

## 📚 Resources & References

### **Documentation**

- Tailwind Dark Mode: https://tailwindcss.com/docs/dark-mode
- CVA (Variants): https://cva.style/docs
- Lucide Icons: https://lucide.dev

### **Inspiration**

- Adminto-Django: /Adminto-Django_v2.0/Adminto-Django/
- Main-Files Admin: /main-files/admin/
- Main-Files Mobile: /main-files/mobile-app/

---

## 🎯 Success Metrics

### **After Implementation**

- [ ] All pages support dark/light theme
- [ ] Theme persists across sessions
- [ ] No layout shifts during theme change
- [ ] Consistent spacing throughout
- [ ] All colors use design system
- [ ] Responsive on mobile, tablet, desktop
- [ ] Smooth transitions and animations
- [ ] Accessible (WCAG AA)

---

## 📞 Next Steps

1. **Review this document** - Ensure you understand the approach
2. **Create a branch** - `git checkout -b feature/template-integration`
3. **Follow Phase 1** - Start with foundation setup
4. **Test incrementally** - Test each phase before moving to next
5. **Update progressively** - Update one page at a time
6. **Get feedback** - Test with users for UX feedback

---

**Last Updated:** December 24, 2024  
**Status:** Ready for Implementation  
**Estimated Time:** 12-15 days (2 weeks)  
**Complexity:** Medium

---

💡 **Pro Tip:** Implement the theme system first (Phase 1), then you can gradually update components while maintaining the app's functionality!

🚀 **Let's build something amazing!**
