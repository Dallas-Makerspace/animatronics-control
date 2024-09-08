"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [pageURL, setPageURL] = useState("");
  useEffect(() => {
    setPageURL(window.location.href);
  }, []);
  // Now, use can use pageURL in code

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <p>
        This is where we start to talk about what we are doing and tell the user what they can do.
      </p>
    </main>
  );
}
