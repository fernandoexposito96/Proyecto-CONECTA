import { lazy, Suspense } from "react";
import type { Conversation, Message, Profile } from "../types";
import { ScreenSkeleton } from "../components/AppResilience";

const AdvancedChatView = lazy(() =>
  import("./AdvancedChatView").then((module) => ({ default: module.AdvancedChatView })),
);

type ChatViewProps = {
  conversations: Conversation[];
  selected: string | null;
  setSelected: (id: string) => void;
  messages: Message[];
  profiles: Profile[];
  profile: Profile | null;
  userId: string;
  onSend: (content: string) => Promise<void>;
};

export function ChatView(props: ChatViewProps) {
  return (
    <Suspense fallback={<ScreenSkeleton />}>
      <AdvancedChatView
        conversations={props.conversations}
        selected={props.selected}
        setSelected={props.setSelected}
        messages={props.messages}
        profiles={props.profiles}
        profile={props.profile}
        userId={props.userId}
      />
    </Suspense>
  );
}
