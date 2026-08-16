import { PageHeader } from "@/components/ui/page-header";
import { TruckForm } from "@/components/trucks/truck-form";

export const metadata = { title: "Add truck" };

export default function NewTruckPage() {
  return (
    <>
      <PageHeader title="Add truck" description="Vehicle dimensions are used to check restrictions during route planning." />
      <div className="px-4 py-6 md:px-6 max-w-3xl">
        <TruckForm />
      </div>
    </>
  );
}
