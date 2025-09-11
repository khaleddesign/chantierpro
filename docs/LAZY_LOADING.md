# Guide d'utilisation du Lazy Loading

## Vue d'ensemble

Le système de lazy loading implémenté permet de charger les composants de manière différée pour améliorer les performances de l'application ChantierPro.

## Composants Lazy Disponibles

### Planning
- `LazyGanttChart` - Diagramme de Gantt avec chargement différé
- `LazyCalendar` - Composant calendrier avec lazy loading

### Documents
- `LazyMediaViewer` - Visualiseur de médias avec chargement à la demande

### CRM
- `LazyOpportunitesPipeline` - Pipeline des opportunités commerciales

## Utilisation de Base

### Import des composants lazy

```tsx
import { 
  LazyGanttChart, 
  LazyCalendar, 
  LazyMediaViewer 
} from '@/components/lazy';
```

### Utilisation simple

```tsx
function PlanningPage() {
  return (
    <div>
      <h1>Planning</h1>
      <LazyGanttChart 
        taches={taches}
        onTacheClick={handleTacheClick}
      />
    </div>
  );
}
```

## Composants Utilitaires

### LazyWrapper

Wrapper générique pour rendre n'importe quel composant lazy :

```tsx
import { LazyWrapper } from '@/components/lazy';

<LazyWrapper
  importFn={() => import('./MonComposantLourd')}
  props={{ data: monData }}
  fallback={<div>Chargement personnalisé...</div>}
/>
```

### SmartLazyComponent

Composant avec intersection observer pour charger uniquement quand visible :

```tsx
import SmartLazyComponent from '@/components/ui/SmartLazyComponent';

<SmartLazyComponent
  importFn={() => import('./ComposantLourd')}
  threshold={0.1}
  rootMargin="100px"
  loadingMessage="Chargement du composant..."
  placeholderHeight={400}
/>
```

## Hooks Utilitaires

### useLazyLoad

Hook pour détecter quand un élément entre dans la viewport :

```tsx
import { useLazyLoad } from '@/hooks/useLazyLoad';

function MonComposant() {
  const { elementRef, shouldLoad } = useLazyLoad({
    threshold: 0.1,
    rootMargin: '50px'
  });

  return (
    <div ref={elementRef}>
      {shouldLoad ? <ComposantLourd /> : <Placeholder />}
    </div>
  );
}
```

### useLazyLoadWithDelay

Hook avec délai avant chargement :

```tsx
const { shouldLoad } = useLazyLoadWithDelay({
  delay: 500, // 500ms de délai
  threshold: 0.1
});
```

### usePreloadComponent

Hook pour pre-charger un composant :

```tsx
const isPreloaded = usePreloadComponent(
  () => import('./ComposantLourd'),
  shouldPreload
);
```

### useSmartLazyLoad

Hook combiné avec pre-loading au hover :

```tsx
const { elementRef, shouldLoad } = useSmartLazyLoad(
  () => import('./ComposantLourd'),
  {
    preloadOnHover: true,
    preloadDelay: 1000
  }
);
```

## Configuration des Lazy Components

### Fallbacks personnalisés

Chaque composant lazy peut avoir un fallback personnalisé :

```tsx
<LazyGanttChart 
  taches={taches}
  fallback={
    <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
      <span>Chargement du Gantt...</span>
    </div>
  }
/>
```

### Seuils de chargement

Vous pouvez ajuster quand les composants se chargent :

```tsx
<SmartLazyComponent
  threshold={0.25} // Charge quand 25% visible
  rootMargin="200px" // Charge 200px avant d'être visible
/>
```

## Meilleures Pratiques

### 1. Utiliser pour les composants lourds

Appliquez le lazy loading aux composants qui :
- Contiennent beaucoup de logique
- Importent des bibliothèques tierces lourdes
- Affichent des visualisations complexes
- Ne sont pas immédiatement visibles

### 2. Fallbacks appropriés

Créez des fallbacks qui :
- Ont la même taille que le composant final
- Montrent un état de chargement clair
- Correspondent au design de l'application

### 3. Préchargement intelligent

- Préchargez au hover pour les interactions utilisateur
- Préchargez après le chargement initial de la page
- Préchargez selon la navigation probable de l'utilisateur

### 4. Tests et monitoring

- Testez les performances avant/après lazy loading
- Surveillez les métriques de chargement
- Vérifiez l'expérience utilisateur sur différentes connexions

## Exemples Complets

### Dashboard avec sections lazy

```tsx
import { SmartLazySection } from '@/components/ui/SmartLazyComponent';
import { LazyGanttChart, LazyOpportunitesPipeline } from '@/components/lazy';

function Dashboard() {
  return (
    <div className="space-y-8">
      <SmartLazySection 
        title="Planning des Projets"
        description="Vue Gantt des tâches en cours"
      >
        <LazyGanttChart taches={taches} />
      </SmartLazySection>

      <SmartLazySection 
        title="Pipeline Commercial"
        description="Suivi des opportunités"
      >
        <LazyOpportunitesPipeline clientId={clientId} />
      </SmartLazySection>
    </div>
  );
}
```

### Composant conditionnel avec lazy loading

```tsx
function DocumentViewer({ document }: { document: Document }) {
  const { shouldLoad } = useLazyLoad();

  return (
    <div>
      {document.type === 'PHOTO' && shouldLoad ? (
        <LazyMediaViewer document={document} />
      ) : (
        <DocumentThumbnail document={document} />
      )}
    </div>
  );
}
```

## Performance

Le lazy loading apporte les améliorations suivantes :

- **Réduction du bundle initial** : Jusqu'à 30-50% de réduction
- **Time to Interactive** : Amélioration de 20-40%
- **Mémoire** : Réduction de l'usage mémoire des composants non utilisés
- **Bande passante** : Chargement uniquement du nécessaire

## Debugging

Pour debugger les problèmes de lazy loading :

1. Vérifiez les erreurs de console
2. Utilisez les outils de développement pour voir les chunks
3. Testez l'intersection observer
4. Vérifiez les imports dynamiques

```tsx
// Debug logging pour les imports
const importFn = () => {
  console.log('Chargement du composant...');
  return import('./MonComposant').then(module => {
    console.log('Composant chargé !');
    return module;
  });
};
```