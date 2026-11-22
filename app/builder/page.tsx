import { Suspense } from "react";
import BuilderClient from "./BuilderClient";

export default function BuilderPage() {
  return (
    <Suspense fallback={<BuilderLoading />}>
      <BuilderClient />
    </Suspense>
  );
}

function BuilderLoading() {
  return (
    <div role="status" className="flex min-h-[60dvh] items-center justify-center text-sm text-muted-foreground">
      Loading the builder…
    </div>
  );
}
