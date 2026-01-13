// Market detail page
export default function MarketDetailPage({ params }: { params: { id: string } }) {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold">Market #{params.id}</h1>
      <p className="text-gray-400 mt-2">Market details and betting</p>
    </main>
  );
}
