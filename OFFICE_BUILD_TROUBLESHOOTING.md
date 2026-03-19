# Office Page Build Troubleshooting

## Current Status

The Office page code has been created and TypeScript syntax fixed, but the build is failing with exit code 1.

## Files Modified

1. **Sidebar:** `/home/ubuntu/openclaw-mission-control/frontend/src/components/organisms/DashboardSidebar.tsx`
2. **Office Page:** `/home/ubuntu/openclaw-mission-control/frontend/src/app/office/page.tsx`

## To Debug the Build

### 1. See the Full Build Error

```bash
cd /home/ubuntu/openclaw-mission-control/frontend
npm run build 2>&1 | tee build-error.log
```

This will show the full error output and save it to `build-error.log`.

### 2. Check TypeScript Directly

```bash
cd /home/ubuntu/openclaw-mission-control/frontend
npx tsc --noEmit
```

This will show any TypeScript errors without building.

### 3. Test Linting

```bash
cd /home/ubuntu/openclaw-mission-control/frontend
npm run lint
```

## Common Issues to Check

### Issue 1: ESLint React Hooks Rules

The animation useEffect depends on `agents` and `taskCount`, which changes frequently. This might trigger ESLint exhaustive-deps warnings.

**Potential Fix:** If ESLint is blocking the build, you can:

1. Add eslint-disable comment:
   ```typescript
   // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [agents, taskCount]);
   ```

2. Or restructure to not depend on these values directly

### Issue 2: Canvas API Type Issues

The canvas API might need explicit types in strict mode.

### Issue 3: Inline Styles

The inline `style={{ background: "#1a1a2e" }}` might need to be in a CSS module instead.

## Quick Rollback

If you need to quickly rollback the changes:

```bash
cd /home/ubuntu/openclaw-mission-control/frontend

# Restore sidebar
git checkout src/components/organisms/DashboardSidebar.tsx

# Remove office page
rm -rf src/app/office

# Rebuild
npm run build
```

## Alternative: Simplified Version

If the animated canvas is causing issues, I can create a simpler static version without canvas animations.

## Next Steps

1. Run the full build command to see the actual error
2. Share the error output
3. I can then provide a targeted fix
