export default function TestStylesPage() {
  return (
    <div className="min-h-screen bg-blue-500 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Test des Styles Tailwind
        </h1>
        <p className="text-gray-600 mb-4">
          Si vous voyez cette page avec des styles (fond bleu, carte blanche, ombres), 
          alors Tailwind CSS fonctionne correctement.
        </p>
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Bouton de Test
        </button>
      </div>
    </div>
  );
}