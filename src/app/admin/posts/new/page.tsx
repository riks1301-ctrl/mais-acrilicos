import { PostEditor } from "@/components/admin/PostEditor";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function NewPostPage() {
  if (!(await getSession())) redirect("/admin/login");
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  return (<div><h1 className="mb-6 text-2xl font-bold">Novo Post</h1><PostEditor categories={categories} /></div>);
}
