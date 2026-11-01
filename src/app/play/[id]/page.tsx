import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PlayClient from "@/components/PlayClient";
import { encodeId, parseId } from "@/lib/maze/id";

type PlayPageProps = { params: Promise<{ id: string }> };

export const generateMetadata = async ({ params }: PlayPageProps): Promise<Metadata> => {
  const { id } = await params;
  const spec = parseId(id);
  return { title: spec === null ? "Maze not found" : encodeId(spec) };
};

const PlayPage = async ({ params }: PlayPageProps) => {
  const { id } = await params;
  const spec = parseId(id);
  if (spec === null) notFound();

  // The key resets all run state if the ID in the address changes
  const mazeId = encodeId(spec);
  return <PlayClient key={mazeId} mazeId={mazeId} />;
};

export default PlayPage;