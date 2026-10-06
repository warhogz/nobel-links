import { OFFICES, officeById } from "@/lib/config";
import OfficeView from "./OfficeView";

type Params = Promise<{ office: string }>;

export function generateStaticParams() {
  return OFFICES.map((o) => ({ office: o.id }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Params }) {
  const { office } = await params;
  const o = officeById(office);
  return {
    title: o ? `NOBÉL — ${o.city}` : "NOBÉL",
    description: o ? `NOBÉL ${o.city} — ${o.country}` : undefined,
  };
}

export default async function OfficePage({ params }: { params: Params }) {
  const { office } = await params;
  return <OfficeView id={office} />;
}
