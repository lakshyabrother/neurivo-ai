import { getProjects } from "@/app/actions/projects";
import ProjectsClient from "@/components/projects-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects - NEXORA",
};

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <ProjectsClient initialProjects={projects} />
  );
}
