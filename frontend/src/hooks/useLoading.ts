import { useState } from "react";

export function useLoading(initial = false) {
  const [loading, setLoading] = useState(initial);

  const start = () => setLoading(true);
  const stop = () => setLoading(false);

  return { loading, start, stop };
}
