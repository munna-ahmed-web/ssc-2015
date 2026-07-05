import React from "react";

import NuqsProvider from "./NuqsProvider";
import QueryProvider from "./QueryProvider";

export default function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <NuqsProvider>{children}</NuqsProvider>
    </QueryProvider>
  );
}
