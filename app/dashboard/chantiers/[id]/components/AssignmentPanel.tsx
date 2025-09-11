"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  UserPlus, 
  X, 
  Search, 
  Phone, 
  Mail,
  UserCheck,
  AlertCircle 
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  company?: string;
}

interface AssignmentPanelProps {
  chantierId: string;
  assignees: User[];
  onAssignmentChange: (assignees: User[]) => void;
}

export default function AssignmentPanel({ 
  chantierId, 
  assignees, 
  onAssignmentChange 
}: AssignmentPanelProps) {
  const [availableWorkers, setAvailableWorkers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAddPanel, setShowAddPanel] = useState(false);

  // Récupérer les ouvriers disponibles
  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const response = await fetch('/api/users?role=OUVRIER&limit=50');
        const data = await response.json();
        if (data.users) {
          setAvailableWorkers(data.users);
        }
      } catch (error) {
        console.error('Erreur chargement ouvriers:', error);
      }
    };

    fetchWorkers();
  }, []);

  // Filtrer les ouvriers non assignés
  const unassignedWorkers = availableWorkers.filter(worker => 
    !assignees.some(assignee => assignee.id === worker.id) &&
    worker.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Assigner un ouvrier
  const assignWorker = async (worker: User) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/chantiers/${chantierId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: worker.id })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erreur HTTP ${response.status}`);
      }

      const result = await response.json();
      const newAssignees = [...assignees, worker];
      onAssignmentChange(newAssignees);
      setShowAddPanel(false);
      
      // TODO: Afficher un message de succès
    } catch (error) {
      console.error('Erreur assignment:', error);
      // TODO: Afficher un message d'erreur à l'utilisateur
      alert(`Erreur lors de l'assignation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  };

  // Retirer un ouvrier
  const removeWorker = async (workerId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/chantiers/${chantierId}/assign`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: workerId })
      });

      if (response.ok) {
        const newAssignees = assignees.filter(a => a.id !== workerId);
        onAssignmentChange(newAssignees);
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          Ouvriers Assignés ({assignees.length})
        </h3>
        <Button 
          onClick={() => setShowAddPanel(!showAddPanel)}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Assigner Ouvrier
        </Button>
      </div>

      {/* Liste des ouvriers assignés */}
      <div className="space-y-3 mb-6">
        {assignees.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Aucun ouvrier assigné à ce chantier</p>
          </div>
        ) : (
          assignees.map((assignee) => (
            <div key={assignee.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">{assignee.name}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {assignee.email}
                    </span>
                    {assignee.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {assignee.phone}
                      </span>
                    )}
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {assignee.role}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeWorker(assignee.id)}
                disabled={loading}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>

      {/* Panel d'ajout d'ouvriers */}
      {showAddPanel && (
        <div className="border-t pt-6">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher un ouvrier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {unassignedWorkers.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">
                  {searchTerm ? 'Aucun ouvrier trouvé' : 'Tous les ouvriers sont déjà assignés'}
                </p>
              </div>
            ) : (
              unassignedWorkers.map((worker) => (
                <div key={worker.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <Users className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{worker.name}</p>
                      <p className="text-xs text-gray-500">{worker.email}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {worker.role}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => assignWorker(worker)}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}