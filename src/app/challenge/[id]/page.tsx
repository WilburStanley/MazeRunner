import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PlayClient from "@/components/PlayClient";
import { parseChallengeId } from "@/lib/challenge-id";
import { getSigningSecret } from "@/lib/tokens";

type ChallengePageProps = { params: Promise<{ id: string }> };

export const metadata: Metadata = { title: "Maze challenge" };

// A challenge ID is signed, so the time and name on this page cannot be edited by anyone
const ChallengePage = async ({ params }: ChallengePageProps) => {
  const { id } = await params;
  const details = parseChallengeId(id, getSigningSecret());
  if (details === null) notFound();

  const { mazeId, elapsedMs, nickname } = details;
  return <PlayClient key={mazeId} mazeId={mazeId} challenge={{ elapsedMs, nickname }} />;
};

export default ChallengePage;