"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ArchiveTruckButton({ truckId, active }: { truckId: string; active: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (active && !confirm("Archive this truck? It will no longer be available for route planning.")) {
      return;
    }
    setLoading(true);
    await fetch(`/api/trucks/${truckId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <Button variant="danger" onClick={handleClick} loading={loading}>
      {active ? "Archive" : "Restore"}
    </Button>
  );
}
