import { loadMuseum } from "@/lib/pictures";
import { MuseumApp } from "@/components/museum/MuseumApp";

export default async function Home() {
  const { museum } = await loadMuseum();
  return <MuseumApp artist={museum} />;
}
