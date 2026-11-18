# G1 Shift Management

Hebrew RTL demo for manager shift scheduling.

## Run

```bash
npm run dev -- -p 3001
```

Open [http://localhost:3001/schedule](http://localhost:3001/schedule).

## Notes

- Demo state persists in `localStorage` (`g1-shift-management-v1`).
- `settings.notifications` is always merged with defaults on load to avoid undefined crashes.
- Schedule board supports weekly/daily views; drag-and-drop activates after client mount.
