
## Fix: Medications Dropdown Search Not Working

### Problem
Products like "Quma Antacid suspension" and "Tramadol" exist in inventory with stock available, but don't appear when searching in the Medications dropdown during prescription creation.

### Root Cause
The `CommandItem` component uses `value={product.id}` (a UUID) for filtering. When you type a product name, the search fails because it's trying to match against the UUID instead of the product name.

### Solution
Update the `value` attribute in `src/components/PrescriptionForm.tsx` to include searchable text fields.

**Change line 396 from:**
```tsx
value={product.id}
```

**To:**
```tsx
value={`${product.name} ${product.generic_name || ''} ${product.barcode || ''}`}
```

### Impact
- Fixes search for ALL products in the Medications dropdown
- Users can search by product name, generic name, or barcode
- Matches the pattern already used for Patient and Doctor dropdowns in the same file
