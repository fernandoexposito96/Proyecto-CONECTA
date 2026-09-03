# CONECTA data layer

This directory separates Supabase reads and writes from the React shell.

- `loadConectaData.ts`: bounded initial/manual synchronization.
- `refreshConectaSlices.ts`: targeted bounded refreshes after mutations.
- `conectaMutations.ts`: write operations.
- `optimizedDataLayer.ts`: stable public API for the optimized layer.
- `optimizedDataLayer.integration.ts`: state-level adapter for `App.tsx`.

## Integration rule

`App.tsx` must keep full synchronization for startup and explicit manual refresh only. Frequent actions (join/leave, save, connect, block, chat creation) should use the targeted adapter instead of calling the global `loadData(user)`.

The Premium UI and realtime subscriptions must remain unchanged while this migration is completed.
