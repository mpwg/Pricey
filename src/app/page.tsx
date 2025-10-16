export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-4xl w-full text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to Pricey 🏷️</h1>
        <p className="text-xl text-gray-600 mb-8">
          Your smart price comparison assistant
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="p-6 border rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-2">📊 Compare Prices</h2>
            <p className="text-gray-600">
              Track prices across multiple retailers
            </p>
          </div>
          <div className="p-6 border rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-2">🔔 Price Alerts</h2>
            <p className="text-gray-600">Get notified when prices drop</p>
          </div>
          <div className="p-6 border rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-2">💰 Save Money</h2>
            <p className="text-gray-600">Find the best deals automatically</p>
          </div>
        </div>
      </div>
    </main>
  );
}
