import { PostDetail } from "@/components/admin/instagram/PostDetail";

export default function InstagramPostDetailPage({ params }: { params: { id: string } }) {
  return <PostDetail id={params.id} />;
}
