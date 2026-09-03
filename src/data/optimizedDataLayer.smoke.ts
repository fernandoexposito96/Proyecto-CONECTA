import {
  acceptConnectionMutation,
  blockConnectionMutation,
  deleteConnectionMutation,
  joinPlanMutation,
  leavePlanMutation,
  loadConectaData,
  refreshConnections,
  refreshConversations,
  refreshPlanMembers,
  refreshSavedItems,
  requestConnectionMutation,
  savePlanMutation,
  unsavePlanMutation,
} from "./optimizedDataLayer";

// Compile-time guard: keeps the staged data-layer API connected and type-checked.
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
  requestConnectionMutation,
  acceptConnectionMutation,
  deleteConnectionMutation,
  blockConnectionMutation,
};
