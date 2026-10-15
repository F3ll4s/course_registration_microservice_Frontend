import { CartDock } from "@/features/cart/CartDock";
import { CatalogPane } from "@/features/catalog/CatalogPane";
import { TimetableCard } from "@/features/timetable/TimetableCard";

// Penpot "Design #1" > Desktop - Registration Portal: the catalog on the left (820px of 1392),
// the weekly timetable and the cart on the right (548px). Below 1024px the right pane moves under the catalog.
export function RegistrationPage() {
  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,820fr)_minmax(0,548fr)]">
      <CatalogPane />
      <div className="flex flex-col gap-4">
        <TimetableCard />
        <CartDock />
      </div>
    </div>
  );
}
