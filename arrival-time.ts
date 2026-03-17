export type ArrivalDisplay =
  | {
      kind: "status";
      text: string;
      remainingSeconds: 0;
    }
  | {
      kind: "countdown";
      text: string;
      remainingSeconds: number;
    };

const STATUS_KEYWORDS = [
  "\uC804\uC5ED \uB3C4\uCC29",
  "\uB3C4\uCC29",
  "\uC9C4\uC785",
];

function hasArrivalStatus(message?: string): boolean {
  if (!message) return false;
  return STATUS_KEYWORDS.some((keyword) => message.includes(keyword));
}

export function formatArrivalDisplay(
  barvlDt: string | number | null | undefined,
  arvlMsg2?: string,
): ArrivalDisplay {
  const totalSeconds = Number(barvlDt);

  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    if (hasArrivalStatus(arvlMsg2)) {
      return {
        kind: "status",
        text: arvlMsg2 as string,
        remainingSeconds: 0,
      };
    }

    return {
      kind: "status",
      text: arvlMsg2 || "\uB3C4\uCC29 \uC815\uBCF4 \uC5C6\uC74C",
      remainingSeconds: 0,
    };
  }

  if (totalSeconds <= 10) {
    return {
      kind: "countdown",
      text: "\uACF3 \uB3C4\uCC29",
      remainingSeconds: totalSeconds,
    };
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return {
    kind: "countdown",
    text: `${minutes}\uBD84 ${seconds}\uCD08`,
    remainingSeconds: totalSeconds,
  };
}

export function tickRemainingSeconds(
  remainingSeconds: number,
  elapsedSeconds = 1,
): number {
  if (!Number.isFinite(remainingSeconds) || remainingSeconds <= 0) {
    return 0;
  }

  return Math.max(0, remainingSeconds - elapsedSeconds);
}
