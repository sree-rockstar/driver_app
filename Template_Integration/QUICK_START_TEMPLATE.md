# 🚀 Quick Start: Template Integration

## Get Started in 15 Minutes!

This guide will help you start implementing the template system **right now**.

---

## ⚡ Step 1: Install Dependencies (2 minutes)

```bash
cd /Users/sree/Documents/DriverApp/driver_app/frontend

# Install all required packages at once
npm install @radix-ui/react-dropdown-menu @radix-ui/react-dialog @radix-ui/react-tabs @radix-ui/react-switch lucide-react class-variance-authority clsx tailwind-merge
```

**What we're installing:**

- `@radix-ui/*` - Headless UI primitives (accessible, unstyled)
- `lucide-react` - Icon library (you already have this, but ensuring latest)
- `class-variance-authority` - Type-safe variant styling
- `clsx` + `tailwind-merge` - Utility for merging class names

---

## 📝 Step 2: Update Tailwind Config (3 minutes)

**Replace** your `frontend/tailwind.config.js` with:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
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
        xs: "0.75rem",
        sm: "0.85rem",
        base: "0.875rem",
        lg: "1.09rem",
        xl: "1.25rem",
        "2xl": "1.5rem",
        "3xl": "1.875rem",
        "4xl": "2.25rem",
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

---

## 🎨 Step 3: Create Theme System (5 minutes)

### 3.1 Create Theme Context

**Create:** `frontend/src/contexts/ThemeContext.tsx`

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
    const saved = localStorage.getItem("theme") as Theme;
    if (saved) return saved;

    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }

    return "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
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

### 3.2 Create Utility Functions

**Create:** `frontend/src/lib/utils.ts`

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### 3.3 Create Theme Toggle Component

**Create:** `frontend/src/components/ThemeToggle.tsx`

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
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? (
        <Moon className="w-5 h-5 text-gray-700" />
      ) : (
        <Sun className="w-5 h-5 text-yellow-400" />
      )}
    </button>
  );
};
```

---

## 🔌 Step 4: Update App.tsx (2 minutes)

**Wrap your app** with ThemeProvider:

```typescript
import { ThemeProvider } from "./contexts/ThemeContext";

function App() {
  // ... existing code

  return (
    <ThemeProvider>
      <ToastContainer />
      <BrowserRouter>
        <Routes>{/* ... existing routes */}</Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
```

---

## 🎯 Step 5: Add Theme Toggle to Layout (3 minutes)

**Update:** `frontend/src/components/Layout.tsx`

Add the import:

```typescript
import { ThemeToggle } from "./ThemeToggle";
```

Add the toggle button in the header (find the right section in your existing navbar):

```typescript
{
  /* Add before or after other buttons in topbar */
}
<ThemeToggle />;
```

---

## ✅ Step 6: Test It! (1 minute)

```bash
# Make sure you're in frontend directory
cd /Users/sree/Documents/DriverApp/driver_app/frontend

# Start the dev server
npm run dev
```

**Open your browser** and click the theme toggle button in the header!

---

## 🎨 Bonus: Update Your First Component (Optional - 5 minutes)

Let's update a simple component to see the theme in action:

**Example: Update a card in your Dashboard**

**Before:**

```typescript
<div className="bg-white rounded shadow p-6">
  <h3 className="text-xl font-bold">Total Vehicles</h3>
  <p className="text-2xl">150</p>
</div>
```

**After:**

```typescript
<div
  className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 
                transition-colors duration-200"
>
  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
    Total Vehicles
  </h3>
  <p className="text-2xl text-gray-700 dark:text-gray-300">150</p>
</div>
```

---

## 🔥 Common Issues & Solutions

### Issue 1: Dark mode not working

**Solution:**

```bash
# Make sure darkMode is set to 'class' in tailwind.config.js
# Check that ThemeProvider wraps your entire app
# Clear browser cache and reload
```

### Issue 2: Colors not showing

**Solution:**

```bash
# Restart the dev server after changing tailwind.config.js
npm run dev
```

### Issue 3: TypeScript errors

**Solution:**

```bash
# Make sure to create the contexts folder
mkdir -p src/contexts
mkdir -p src/lib
```

---

## 📋 Verification Checklist

After completing the steps above, verify:

- [ ] Theme toggle button appears in header
- [ ] Clicking toggle switches between light and dark
- [ ] Theme persists on page reload
- [ ] All text is readable in both themes
- [ ] Background colors change smoothly
- [ ] No console errors

---

## 🎯 What's Next?

After basic theme is working, you can:

1. **Create UI Components** (see `TEMPLATE_IMPLEMENTATION_PLAN.md`)

   - Card component
   - Button component
   - Badge component

2. **Update Pages Gradually**

   - Start with Dashboard
   - Then Fleet page
   - Then other pages

3. **Add Animations**
   - Smooth transitions
   - Hover effects

---

## 🚀 Quick Commands Reference

```bash
# Install dependencies
npm install @radix-ui/react-dropdown-menu @radix-ui/react-dialog @radix-ui/react-tabs @radix-ui/react-switch lucide-react class-variance-authority clsx tailwind-merge

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 📚 Files Created/Modified

### New Files (3):

```
✅ frontend/src/contexts/ThemeContext.tsx
✅ frontend/src/lib/utils.ts
✅ frontend/src/components/ThemeToggle.tsx
```

### Modified Files (2):

```
✅ frontend/tailwind.config.js
✅ frontend/src/App.tsx
```

---

## 💡 Pro Tips

1. **Start Simple:** Get the theme toggle working first, then enhance
2. **Test Often:** Check both light and dark modes after each change
3. **Use Dark Class:** Add `dark:` prefix for all dark mode styles
4. **Gradual Migration:** Update components one at a time
5. **Check Contrast:** Ensure text is readable in both themes

---

## 🆘 Need Help?

If you encounter issues:

1. Check browser console for errors
2. Verify all files are created in correct locations
3. Restart dev server after config changes
4. Clear browser cache if styles don't update

---

## 🎉 Success!

If your theme toggle is working, congratulations! 🎊

You now have:

- ✅ Professional color system
- ✅ Dark/Light theme switching
- ✅ Persistent theme preference
- ✅ Foundation for enhanced UI

**Next Step:** Check out `TEMPLATE_IMPLEMENTATION_PLAN.md` for the full component library!

---

**Created:** December 24, 2024  
**Time to Complete:** 15 minutes  
**Difficulty:** Easy  
**Prerequisites:** Node.js, npm, basic React knowledge

---

💪 **You've got this!** Start with this quick setup, and then gradually enhance your UI!
