# Toast Notification Implementation Guide

This document provides a guide for implementing the Toast Notification system across different pages in the sports management application.

## Step 1: Import the Toast Component

Add the following import to your component file:

```tsx
import { ToastNotification, useToast, ToastType } from "@/components/ui/toast-notification"
```

## Step 2: Add Toast State to Your Component

Inside your component function, add the toast hook:

```tsx
export function YourComponent() {
  // Toast notification state
  const { toastState, showToast, hideToast } = useToast();
  
  // Rest of your component state...
}
```

## Step 3: Add Toast Component to JSX

Add the toast notification component at the beginning of your JSX:

```tsx
return (
  <div>
    {/* Toast Notification */}
    <ToastNotification toast={toastState} onClose={hideToast} />
    
    {/* Rest of your component */}
  </div>
);
```

## Step 4: Use Toast Notifications in Your Actions

Show a success toast:

```tsx
// Action succeeded
showToast(
  "Operation completed successfully.",
  "success",
  "Success Title"
);
```

Show an error toast:

```tsx
// Action failed
showToast(
  "An error occurred while performing the operation.",
  "error",
  "Error Title"
);
```

Show an info toast:

```tsx
// Information message
showToast(
  "Here's some helpful information.",
  "info",
  "Information"
);
```

Show a warning toast:

```tsx
// Warning message
showToast(
  "Please be careful with this action.",
  "warning",
  "Warning"
);
```

## Toast Types

The following toast types are supported:
- `success`: Green background with check icon
- `error`: Red background with alert icon
- `info`: Blue background with info icon
- `warning`: Yellow background with alert icon

## Customization

You can customize the appearance of toast notifications by editing the `components/ui/toast-notification.tsx` file:

- Change the auto-dismiss timeout (default is 4 seconds)
- Modify the styling of different toast types
- Adjust the position of the toast on the screen
