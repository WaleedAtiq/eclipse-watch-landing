"use client";

import { useState } from "react";

// Demo only: this is a concept build, so nothing is actually ordered or sent anywhere.
export default function ReserveButton() {
  const [reserved, setReserved] = useState(false);

  return (
    <button className="btn cursor-pointer" onClick={() => setReserved(true)} disabled={reserved}>
      {reserved ? "Reserved ✓ (concept demo)" : "Secure allocation →"}
    </button>
  );
}
