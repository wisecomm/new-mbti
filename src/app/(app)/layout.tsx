import { Suspense } from "react";
import { TabBar } from "@/components/TabBar";

/** Mobile shell: page content above a fixed bottom tab bar. Pages and data functions do their own requireUser() check. */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <main className="flex flex-1 flex-col gap-6 px-5 pt-8 pb-24">{children}</main>
      <Suspense>
        <TabBar />
      </Suspense>
    </>
  );
}
