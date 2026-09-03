import type { User } from "@supabase/supabase-js";
import type { Connection, Conversation, PlanMember, SavedItem } from "../types";
import {
  acceptConnectionMutation,
  blockConnectionMutation,
  deleteConnectionMutation,
  joinPlanMutation,
  leavePlanMutation,
  refreshConnections,
  refreshConversations,
  refreshPlanMembers,
  refreshSavedItems,
  requestConnectionMutation,
  savePlanMutation,
  unsavePlanMutation,
} from "./optimizedDataLayer";

export type OptimizedStateSetters = {
  setPlanMembers: (value: PlanMember[]) => void;
  setSavedItems: (value: SavedItem[]) => void;
  setConnections: (value: Connection[]) => void;
  setConversations: (value: Conversation[]) => void;
};

export function createOptimizedActions(user: User, setters: OptimizedStateSetters) {
  return {
    async joinPlan(planId: string) {
      await joinPlanMutation(planId, user.id);
      setters.setPlanMembers(await refreshPlanMembers());
    },
    async leavePlan(planId: string) {
      await leavePlanMutation(planId, user.id);
      setters.setPlanMembers(await refreshPlanMembers());
    },
    async savePlan(planId: string, isSaved: boolean) {
      if (isSaved) await unsavePlanMutation(planId, user.id);
      else await savePlanMutation(planId, user.id);
      setters.setSavedItems(await refreshSavedItems(user.id));
    },
    async requestConnection(personId: string) {
      await requestConnectionMutation(user.id, personId);
      setters.setConnections(await refreshConnections());
    },
    async acceptConnection(connectionId: string) {
      await acceptConnectionMutation(connectionId);
      setters.setConnections(await refreshConnections());
    },
    async deleteConnection(connectionId: string) {
      await deleteConnectionMutation(connectionId);
      setters.setConnections(await refreshConnections());
    },
    async block(personId: string) {
      await blockConnectionMutation(user.id, personId);
      setters.setConnections(await refreshConnections());
    },
    async refreshChats() {
      setters.setConversations(await refreshConversations());
    },
  };
}
