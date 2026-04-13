import { PricingTable } from "@clerk/nextjs";

export default function PricingPage() {
  return (
    <div className="flex flex-1 flex-col items-center px-4 py-12">
      <h1 className="mb-2 text-4xl font-bold tracking-tight">Pricing</h1>
      <p className="mb-10 text-lg text-muted-foreground">
        Choose the plan that works for you
      </p>
      <PricingTable />
    </div>
  );
}
