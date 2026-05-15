export default function PromotionsPage() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-black text-slate-900 mb-2">Promotions</h1>
      <p className="text-slate-500 text-sm mb-8">Vos offres et codes de réduction disponibles.</p>
      <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center">
        <p className="text-4xl mb-3">🏷️</p>
        <p className="text-slate-500 font-medium">Aucune promotion disponible pour le moment.</p>
        <p className="text-slate-400 text-sm mt-1">Revenez bientôt pour découvrir nos offres !</p>
      </div>
    </div>
  );
}
