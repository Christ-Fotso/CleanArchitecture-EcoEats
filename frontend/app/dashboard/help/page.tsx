export default function HelpPage() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-black text-slate-900 mb-2">Aide & Support</h1>
      <p className="text-slate-500 text-sm mb-8">Comment pouvons-nous vous aider ?</p>

      <div className="space-y-4">
        {[
          { q: "Comment suivre ma commande ?", a: "Rendez-vous dans la section \"Commandes\" pour voir le statut en temps réel de votre livraison." },
          { q: "Comment annuler une commande ?", a: "Vous pouvez annuler une commande dans les 2 minutes suivant sa validation depuis la page Commandes." },
          { q: "Comment contacter le support ?", a: "Envoyez un email à support@ecoeats.fr — nous répondons sous 24h." },
          { q: "Problème de paiement ?", a: "Vérifiez que votre carte est active et que vous avez suffisamment de fonds. Contactez-nous si le problème persiste." },
        ].map(({ q, a }) => (
          <div key={q} className="bg-white rounded-2xl border border-slate-100 p-5">
            <p className="font-bold text-slate-900 mb-1">{q}</p>
            <p className="text-sm text-slate-500">{a}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-orange-50 rounded-2xl p-6 text-center">
        <p className="font-bold text-slate-900 mb-1">Besoin d&apos;aide supplémentaire ?</p>
        <p className="text-sm text-slate-500 mb-3">Notre équipe est disponible 7j/7 de 8h à 22h.</p>
        <a href="mailto:support@ecoeats.fr"
          className="inline-block bg-orange-600 text-white text-sm font-bold px-6 py-2.5 rounded-xl hover:bg-orange-700 transition">
          Contacter le support
        </a>
      </div>
    </div>
  );
}
