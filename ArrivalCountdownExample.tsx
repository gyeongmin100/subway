import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import { formatArrivalDisplay, tickRemainingSeconds } from "./arrival-time";

type Props = {
  barvlDt: string | number;
  arvlMsg2?: string;
  destination: string;
};

export function ArrivalCountdownExample({
  barvlDt,
  arvlMsg2,
  destination,
}: Props) {
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    Math.max(0, Number(barvlDt) || 0),
  );

  useEffect(() => {
    setRemainingSeconds(Math.max(0, Number(barvlDt) || 0));
  }, [barvlDt]);

  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingSeconds((current) => tickRemainingSeconds(current, 1));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const display = formatArrivalDisplay(remainingSeconds, arvlMsg2);

  return (
    <View>
      <Text>{`${destination} ${display.text}`}</Text>
      <Text>{`\uB0A8\uC740 \uCD08: ${display.remainingSeconds}`}</Text>
    </View>
  );
}
