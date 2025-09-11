# 📡 API Documentation - ChantierPro

## Vue d'ensemble de l'API

ChantierPro expose une API REST complète construite avec Next.js API Routes. L'API suit les conventions RESTful et utilise JSON pour les échanges de données.

## 🔐 Authentification

### Headers requis
```
Authorization: Bearer <session-token>
Content-Type: application/json
```

### Status codes
- `200` - Succès
- `201` - Créé avec succès
- `400` - Erreur de validation
- `401` - Non authentifié
- `403` - Accès refusé
- `404` - Ressource non trouvée
- `500` - Erreur serveur

## 🏗️ Chantiers API

### GET `/api/chantiers`
Récupère la liste des chantiers avec pagination et filtres.

**Paramètres de requête :**
```typescript
{
  page?: number;          // Page (défaut: 1)
  limit?: number;         // Limite par page (défaut: 10)
  search?: string;        // Recherche textuelle
  status?: ChantierStatus; // Filtrer par statut
  clientId?: string;      // Filtrer par client
}
```

**Réponse :**
```json
{
  "chantiers": [
    {
      "id": "cuid123",
      "nom": "Rénovation Villa",
      "description": "Rénovation complète d'une villa",
      "adresse": "123 rue de la Paix, Paris",
      "statut": "EN_COURS",
      "progression": 45,
      "dateDebut": "2024-01-15T00:00:00.000Z",
      "dateFin": "2024-06-15T00:00:00.000Z",
      "budget": 150000,
      "superficie": "200m²",
      "client": {
        "id": "client123",
        "name": "Marie Dubois",
        "email": "marie@example.com"
      },
      "assignees": [
        {
          "id": "user123",
          "name": "Pierre Martin",
          "role": "OUVRIER"
        }
      ],
      "_count": {
        "timeline": 5,
        "messages": 12,
        "documents": 8
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### POST `/api/chantiers`
Crée un nouveau chantier.

**Corps de la requête :**
```json
{
  "nom": "Nouveau chantier",
  "description": "Description du chantier",
  "adresse": "Adresse complète",
  "clientId": "client-id",
  "dateDebut": "2024-01-15T00:00:00.000Z",
  "dateFin": "2024-06-15T00:00:00.000Z",
  "budget": 100000,
  "superficie": "150m²"
}
```

### GET `/api/chantiers/[id]`
Récupère les détails d'un chantier.

**Réponse :**
```json
{
  "id": "chantier123",
  "nom": "Rénovation Villa",
  "timeline": [
    {
      "id": "timeline1",
      "titre": "Début des travaux",
      "description": "Démarrage officiel du chantier",
      "date": "2024-01-15T08:00:00.000Z",
      "type": "DEBUT",
      "createdBy": {
        "id": "user123",
        "name": "Jean Superviseur"
      }
    }
  ],
  "messages": [...],
  "documents": [...]
}
```

### PUT `/api/chantiers/[id]`
Met à jour un chantier existant.

### POST `/api/chantiers/[id]/assign`
Assigne des utilisateurs à un chantier.

**Corps de la requête :**
```json
{
  "userIds": ["user1", "user2", "user3"]
}
```

## 💰 Devis/Factures API

### GET `/api/devis`
Récupère la liste des devis/factures.

**Paramètres :**
```typescript
{
  page?: number;
  limit?: number;
  search?: string;
  status?: DevisStatus;
  type?: 'DEVIS' | 'FACTURE';
  clientId?: string;
  chantierId?: string;
}
```

**Réponse :**
```json
{
  "devis": [
    {
      "id": "devis123",
      "numero": "DEV-2024-001",
      "type": "DEVIS",
      "statut": "ENVOYE",
      "objet": "Rénovation salle de bain",
      "montant": 25000,
      "totalHT": 20833.33,
      "totalTVA": 4166.67,
      "totalTTC": 25000,
      "tva": 20,
      "dateCreation": "2024-01-01T00:00:00.000Z",
      "dateEcheance": "2024-01-31T00:00:00.000Z",
      "client": {
        "id": "client123",
        "name": "Sophie Martin",
        "email": "sophie@example.com"
      },
      "ligneDevis": [
        {
          "id": "ligne1",
          "description": "Carrelage salle de bain",
          "quantite": 20,
          "prixUnit": 50,
          "total": 1000
        }
      ]
    }
  ]
}
```

### POST `/api/devis`
Crée un nouveau devis.

**Corps de la requête :**
```json
{
  "clientId": "client123",
  "chantierId": "chantier123",
  "type": "DEVIS",
  "objet": "Rénovation cuisine",
  "dateEcheance": "2024-02-15T00:00:00.000Z",
  "lignes": [
    {
      "description": "Pose carrelage",
      "quantite": 15,
      "prixUnit": 45
    }
  ],
  "tva": 20,
  "notes": "Devis valable 30 jours"
}
```

### POST `/api/devis/[id]/convert`
Convertit un devis en facture.

**Réponse :**
```json
{
  "success": true,
  "facture": {
    "id": "facture123",
    "numero": "FACT-2024-001",
    "statut": "ENVOYE"
  }
}
```

### GET `/api/devis/[id]/tva-multitaux`
Récupère les détails TVA multi-taux d'un devis.

### PUT `/api/devis/[id]/tva-multitaux`
Met à jour la TVA multi-taux.

**Corps de la requête :**
```json
{
  "tva55": 1000,    // Montant HT à 5.5%
  "tva10": 2000,    // Montant HT à 10%
  "tva20": 17000    // Montant HT à 20%
}
```

## 👥 Utilisateurs API

### GET `/api/users`
Récupère la liste des utilisateurs.

**Paramètres :**
```typescript
{
  page?: number;
  limit?: number;
  search?: string;
  role?: Role;
}
```

**Réponse :**
```json
{
  "users": [
    {
      "id": "user123",
      "name": "Jean Dupont",
      "email": "jean@example.com",
      "role": "OUVRIER",
      "phone": "+33123456789",
      "company": "Entreprise BTP",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### POST `/api/users`
Crée un nouvel utilisateur.

**Corps de la requête :**
```json
{
  "name": "Nouvel utilisateur",
  "email": "nouveau@example.com",
  "password": "motdepasse123",
  "role": "OUVRIER",
  "phone": "+33123456789",
  "company": "Entreprise"
}
```

### GET `/api/users/[id]`
Récupère les détails d'un utilisateur.

### PUT `/api/users/[id]`
Met à jour un utilisateur.

## 💬 Messages API

### GET `/api/messages`
Récupère les messages (conversations ou chantier).

**Paramètres :**
```typescript
{
  chantierId?: string;    // Messages d'un chantier
  conversationId?: string; // Messages d'une conversation
  page?: number;
  limit?: number;
}
```

### POST `/api/messages`
Envoie un nouveau message.

**Corps de la requête :**
```json
{
  "message": "Texte du message",
  "chantierId": "chantier123", // ou conversationId
  "destinataireId": "user123", // pour message direct
  "photos": ["photo1.jpg", "photo2.jpg"]
}
```

### GET `/api/messages/conversations/[id]`
Récupère une conversation spécifique.

### POST `/api/messages/conversations/[id]/mark-read`
Marque une conversation comme lue.

### GET `/api/messages/search`
Recherche dans les messages.

**Paramètres :**
```typescript
{
  q: string;              // Terme de recherche
  chantierId?: string;    // Limiter à un chantier
  type?: 'message' | 'contact' | 'file';
}
```

## 📄 Documents API

### GET `/api/documents`
Récupère la liste des documents.

**Paramètres :**
```typescript
{
  chantierId?: string;
  type?: TypeDocument;
  page?: number;
  limit?: number;
}
```

### POST `/api/documents`
Upload un nouveau document.

**Format : `multipart/form-data`**
```
file: File
chantierId?: string
type?: TypeDocument
dossier?: string
```

### GET `/api/documents/[id]`
Récupère les métadonnées d'un document.

### GET `/api/documents/[id]/download`
Télécharge un document.

### DELETE `/api/documents/[id]`
Supprime un document.

## 📅 Planning API

### GET `/api/planning`
Récupère les événements de planning.

**Paramètres :**
```typescript
{
  start?: string;     // Date de début (ISO)
  end?: string;       // Date de fin (ISO)
  chantierId?: string;
  type?: PlanningType;
}
```

**Réponse :**
```json
{
  "events": [
    {
      "id": "event123",
      "titre": "Réunion chantier",
      "description": "Point hebdomadaire",
      "type": "REUNION",
      "dateDebut": "2024-01-15T10:00:00.000Z",
      "dateFin": "2024-01-15T11:00:00.000Z",
      "statut": "PLANIFIE",
      "organisateur": {
        "id": "user123",
        "name": "Marie Coord"
      },
      "participants": [...],
      "chantier": {
        "id": "chantier123",
        "nom": "Villa Dubois"
      }
    }
  ]
}
```

### POST `/api/planning`
Crée un nouvel événement.

### GET `/api/planning/conflicts`
Détecte les conflits de planning.

## 🏢 CRM API

### GET `/api/crm/clients`
Récupère la liste des clients CRM.

**Paramètres :**
```typescript
{
  page?: number;
  search?: string;
  typeClient?: TypeClient;
  ville?: string;
  commercial?: string;
}
```

**Réponse :**
```json
{
  "clients": [
    {
      "id": "client123",
      "name": "Entreprise SARL",
      "email": "contact@entreprise.com",
      "typeClient": "PROFESSIONNEL",
      "secteurActivite": "Construction",
      "chiffreAffaires": 500000,
      "ville": "Paris",
      "commercial": {
        "id": "commercial123",
        "name": "Paul Vendeur"
      },
      "interactions": [
        {
          "id": "interaction123",
          "type": "APPEL",
          "objet": "Devis cuisine",
          "dateContact": "2024-01-10T14:30:00.000Z"
        }
      ],
      "opportunites": [
        {
          "id": "opp123",
          "nom": "Rénovation bureaux",
          "valeurEstimee": 75000,
          "probabilite": 60,
          "statut": "PROPOSITION"
        }
      ]
    }
  ]
}
```

## 📊 Analytics API

### GET `/api/admin/stats`
Statistiques globales (admin seulement).

**Réponse :**
```json
{
  "totalChantiers": 45,
  "chantiersActifs": 12,
  "totalDevis": 128,
  "caTotal": 750000,
  "caMensuel": 125000,
  "evolutionCA": [
    { "mois": "2024-01", "ca": 85000 },
    { "mois": "2024-02", "ca": 92000 }
  ],
  "repartitionStatuts": {
    "PLANIFIE": 8,
    "EN_COURS": 12,
    "TERMINE": 23,
    "ANNULE": 2
  }
}
```

### GET `/api/devis/stats`
Statistiques des devis.

## 📚 Bibliothèque Prix API

### GET `/api/bibliotheque-prix`
Récupère la bibliothèque des prix.

**Réponse :**
```json
{
  "prix": [
    {
      "id": "prix123",
      "code": "CAR001",
      "designation": "Carrelage sol 30x30",
      "unite": "m²",
      "prixHT": 45.00,
      "corpsEtat": "Carrelage",
      "region": "Ile-de-France"
    }
  ]
}
```

### POST `/api/bibliotheque-prix/import`
Importe des prix depuis un fichier CSV.

### GET `/api/bibliotheque-prix/export`
Exporte la bibliothèque au format CSV.

## 🔄 Websockets (Future)

Pour les fonctionnalités temps réel futures :

```typescript
// Événements WebSocket planifiés
socket.on('message:new', (data) => {
  // Nouveau message reçu
});

socket.on('chantier:progress', (data) => {
  // Progression chantier mise à jour
});

socket.on('user:online', (data) => {
  // Utilisateur en ligne
});
```

## 🛠️ Utilitaires de développement

### Exemple de client API

```typescript
// lib/api-client.ts
class ChantierProAPI {
  private baseURL = '/api';
  
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(`${this.baseURL}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) url.searchParams.append(key, String(value));
      });
    }
    
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return response.json();
  }
  
  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return response.json();
  }
}

export const api = new ChantierProAPI();
```

### Tests d'API

```typescript
// __tests__/api/chantiers.test.ts
describe('/api/chantiers', () => {
  it('should return chantiers list', async () => {
    const response = await api.get('/chantiers');
    expect(response).toHaveProperty('chantiers');
    expect(response).toHaveProperty('pagination');
  });
  
  it('should create new chantier', async () => {
    const chantierData = {
      nom: 'Test Chantier',
      clientId: 'client123',
      // ...
    };
    
    const response = await api.post('/chantiers', chantierData);
    expect(response).toHaveProperty('id');
  });
});
```

Cette API REST complète permet de gérer tous les aspects de ChantierPro avec une interface cohérente et bien documentée.