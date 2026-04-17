import { Suspense } from "react";
import ProcessingClient from "./ProcessingClient";

/**
 * This is a SERVER component (safe for build)
 * It wraps your client logic in Suspense
 */
export default function Page() {
  return (
    <Suspense fallback={<div>Loading processing page...</div>}>
      <ProcessingClient />
    </Suspense>
  );
}