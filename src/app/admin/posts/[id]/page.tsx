import { PostEditor } from "@/components/admin/PostEditor";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";

export default async function EditPostPage({ params }: { params: { id: string } }) {
  if (!(await getSession())) redirect("/admin/login");
  const [post, categories] = await Promise.all([prisma.post.findUnique({ where: { id: params.id } }), prisma.category.findMany()]);
  if (!post) notFound();
  return (<div><h1 className="mb-6 text-2xl font-bold">Editar Post</h1><PostEditor post={post} categories={categories} /></div>);
}
