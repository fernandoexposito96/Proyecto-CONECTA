import {
  blockConnectionMutation,
  connectMutation,
  joinPlanMutation,
  leavePlanMutation,
  loadConectaData,
  refreshConnections,
  refreshConversations,
  refreshPlanMembers,
  refreshSavedItems,
  savePlanMutation,
  unsavePlanMutation,
} from "./optimizedDataLayer";

// Compile-time guard: keeps the staged data-layer API connected and type-checked
// before App.tsx is switched over to it.
export const optimizedDataLayerApi = {
  loadConectaData,
  refreshPlanMembers,
  refreshSavedItems,
  refreshConnections,
  refreshConversations,
  joinPlanMutation,
  leavePlanMutation,
  savePlanMutation,
  unsavePlanMutation,
  connectMutation,
  blockConnectionMutation,
};
