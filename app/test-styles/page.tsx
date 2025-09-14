export default function TestStylesPage() {
  return (
    <div className="min-h-screen bg-blue-500 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Test des Styles
        </h1>
        <p className="text-gray-600 mb-6">
          Si vous voyez cette page avec des couleurs et une mise en forme,
          Tailwind CSS fonctionne correctement.
        </p>
        <div className="space-y-4">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            <strong className="font-bold">Success!</strong> Les styles sont chargés.
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full transition-colors">
            Bouton de Test
          </button>
        </div>
      </div>
    </div>
  );
}