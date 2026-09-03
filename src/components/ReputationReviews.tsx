import { useEffect, useMemo, useState } from "react";
import { MessageCircle, Star } from "lucide-react";
import { supabase } from "../supabase";

type Review = { id: string; score: number; punctuality: number | null; comment: string | null; created_at: string };

export function ReputationReviews({ userId }: { userId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  useEffect(() => { void supabase.from("plan_ratings").select("id,score,punctuality,comment,created_at").eq("reviewed_user_id", userId).order("created_at", { ascending: false }).limit(12).then(({ data }) => setReviews((data as Review[] | null) ?? [])); }, [userId]);
  const average = useMemo(() => reviews.length ? reviews.reduce((sum, review) => sum + review.score, 0) / reviews.length : null, [reviews]);
  return <article className="profile-card reviews-card"><span>RESEÑAS DE ASISTENTES</span><header><div><Star fill="currentColor" /><strong>{average?.toFixed(1) ?? "—"}</strong><small>{reviews.length ? `${reviews.length} reseñas verificadas por plan` : "Aún no hay reseñas"}</small></div></header><div className="review-list">{reviews.filter((review) => review.comment).map((review) => <blockquote key={review.id}><MessageCircle /><p>{review.comment}</p><footer>{review.score}/5 · {new Date(review.created_at).toLocaleDateString("es-ES")}</footer></blockquote>)}</div></article>;
}
