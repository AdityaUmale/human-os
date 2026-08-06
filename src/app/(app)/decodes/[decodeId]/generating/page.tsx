import { DecodeGenerationPoll } from "@/components/decodes/DecodeGenerationPoll";

export default async function DecodeGeneratingPage({ params, searchParams }: { params: Promise<{ decodeId: string }>; searchParams: Promise<{ return?: string }> }) {
  const { decodeId } = await params;
  const query = await searchParams;
  const destination = query.return || "/people";
  return <DecodeGenerationPoll decodeId={decodeId} destination={destination} />;
}
