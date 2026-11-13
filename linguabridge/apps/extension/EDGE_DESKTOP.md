# LinguaBridge pour Microsoft Edge (ordinateur)

Microsoft Edge sur Windows et macOS prend en charge les extensions Chromium Manifest V3. Le même code source et le même paquet de production servent à Chrome et Edge. Aucune modification du site bancaire n'est nécessaire.

## Construire

Depuis le dossier `linguabridge/` :

```bash
pnpm install
pnpm --filter @linguabridge/translation-engine build
pnpm --filter @linguabridge/extension build:edge
```

Le dossier à charger est `linguabridge/apps/extension/dist/` (et **non** la racine `apps/extension/`). Le postbuild y génère `manifest.json`, `popup.html` et les scripts compilés.

## Installer sur Edge (Windows ou macOS)

1. Ouvrir `edge://extensions`.
2. Activer **Mode développeur**.
3. Cliquer sur **Charger l'extension décompressée** / **Load unpacked**.
4. Sélectionner le dossier `linguabridge/apps/extension/dist/` après compilation.
5. Ouvrir le site de test SAFINUM, actualiser l'onglet et cliquer sur l'icône LinguaBridge.
6. Choisir la langue source (français ou anglais), la langue cible, puis lancer la traduction.

Le bouton **Activer la traduction automatique** enregistre la préférence. Les prochaines pages HTTP(S) et leurs cadres correspondants sont traduits au chargement, y compris les nouveaux cadres et les composants avec Shadow DOM ouvert. **Arrêter et restaurer le texte original** désactive ce mode. Après une reconstruction locale, rechargez l'extension dans `edge://extensions` puis actualisez les onglets ouverts.

La traduction intégrée utilise un lexique local. Elle ne couvre pas toutes les phrases des sites publics et laisse les passages inconnus dans la langue source. Le script `node scripts/audit-extension-coverage.mjs URL` mesure les segments inchangés du HTML public sans exécuter le JavaScript du site. Il ne remplace pas un test visuel dans Edge. Les pages internes du navigateur, PDF, images, Shadow DOM fermé et certains cadres protégés ne sont pas accessibles à l'extension. Une traduction générale demande un moteur avec des paires linguistiques évaluées, une licence compatible et une politique explicite pour les textes de pages.

## Vérifications avant présentation

- Tester sur la version Edge desktop réellement utilisée pour le hackathon.
- Vérifier les textes injectés après le chargement initial, les montants, frais, bénéficiaires et avertissements.
- Ne pas utiliser de vrais comptes ou données bancaires.
- Le service API local (`localhost:3001`) est optionnel pour les fonctions disposant d'un repli local. La qualité et la couverture des traductions hors ligne doivent être vérifiées; ne pas présumer qu'une traduction inconnue est correcte.
- Le service vocal local (`localhost:3002`) n'est pas fourni par Edge et doit être démarré séparément si nécessaire.
- L'installation décompressée sert aux tests. Une publication publique demande un processus de soumission Microsoft Edge Add-ons.

## Compatibilité

Aucune API spécifique à Google Chrome n'est requise pour le chargement de cette extension : les API `chrome.*` de Manifest V3 sont prises en charge par Edge desktop. La compatibilité réelle et les permissions restent à vérifier sur l'environnement de test.
