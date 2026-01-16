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
    <div className="min-h-screen flex items-center justify-center text-gray-500">
      Loading agent builder...
    </div>
  );
}
