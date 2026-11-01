import type { ChallengeTarget } from "@/lib/challenge-link";
import { formatDuration } from "@/lib/format";

type ChallengeBannerProps = { challenge: ChallengeTarget };

const ChallengeBanner = ({ challenge }: ChallengeBannerProps) => (
  <div className="challenge-banner">
    <p className="label">Challenge</p>
    <p className="challenge-banner-time">{formatDuration(challenge.elapsedMs)}</p>
    <p className="dim small">
      {challenge.nickname === null
        ? "Can you beat this time?"
        : `Can you beat ${challenge.nickname}'s time?`}
    </p>
  </div>
);

export default ChallengeBanner;