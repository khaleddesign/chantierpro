"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDevis } from "@/hooks/useDevis";
import { useToastContext } from "@/components/providers/ToastProvider";
import { X, Pen, RotateCcw, Check, AlertCircle } from "lucide-react";

interface SignatureComponentProps {
  devis: any;
  onClose: () => void;
  onSigned?: () => void;
}

export function SignatureComponent({ devis, onClose, onSigned }: SignatureComponentProps) {
  const { signDevis, loading } = useDevis();
  const { success, error: showError } = useToastContext();
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [signatureType, setSignatureType] = useState<'draw' | 'type'>('draw');
  const [typedSignature, setTypedSignature] = useState('');
  const [signerName, setSignerName] = useState(devis.client?.name || '');
  const [signerTitle, setSignerTitle] = useState('');

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1f2937';
    ctx.lineTo(x, y);
    ctx.stroke();
    
    setIsEmpty(false);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
  };

  const generateTypedSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !typedSignature) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Nettoyer le canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Configurer la police pour la signature
    ctx.font = '32px Dancing Script, cursive';
    ctx.fillStyle = '#1f2937';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Dessiner la signature tapée
    ctx.fillText(typedSignature, canvas.width / 2, canvas.height / 2);
    
    setIsEmpty(false);
  }, [typedSignature]);

  const handleSignature = async () => {
    if (isEmpty && signatureType === 'draw') {
      showError('Erreur', 'Veuillez signer avant de valider');
      return;
    }

    if (signatureType === 'type' && !typedSignature.trim()) {
      showError('Erreur', 'Veuillez saisir votre signature');
      return;
    }

    if (!signerName.trim()) {
      showError('Erreur', 'Le nom du signataire est obligatoire');
      return;
    }

    try {
      // Générer la signature si tapée
      if (signatureType === 'type') {
        generateTypedSignature();
      }

      // Convertir le canvas en base64
      const canvas = canvasRef.current;
      const signatureData = canvas?.toDataURL('image/png');

      // Signer le devis
      await signDevis(devis.id, signatureData);

      success('Succès', 'Le devis a été signé avec succès');
      onSigned?.();
      onClose();

    } catch (error: any) {
      showError('Erreur', error.message || 'Erreur lors de la signature');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Pen className="text-indigo-600" size={20} />
            Signature du devis
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Informations du devis */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Devis à signer</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Numéro :</span>
                <span className="ml-2 font-medium">{devis.numero}</span>
              </div>
              <div>
                <span className="text-gray-600">Montant :</span>
                <span className="ml-2 font-medium">
                  {devis.montant?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600">Objet :</span>
                <span className="ml-2 font-medium">{devis.objet}</span>
              </div>
            </div>
          </div>

          {/* Type de signature */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Type de signature
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="signatureType"
                  value="draw"
                  checked={signatureType === 'draw'}
                  onChange={(e) => setSignatureType('draw')}
                  className="mr-2"
                />
                <span className="text-sm">Dessiner à la souris</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="signatureType"
                  value="type"
                  checked={signatureType === 'type'}
                  onChange={(e) => setSignatureType('type')}
                  className="mr-2"
                />
                <span className="text-sm">Saisir au clavier</span>
              </label>
            </div>
          </div>

          {/* Signature tapée */}
          {signatureType === 'type' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Votre signature
              </label>
              <div className="flex gap-2">
                <Input
                  value={typedSignature}
                  onChange={(e) => setTypedSignature(e.target.value)}
                  placeholder="Saisissez votre nom pour signature..."
                  className="font-serif text-lg"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateTypedSignature}
                  disabled={!typedSignature.trim()}
                >
                  Prévisualiser
                </Button>
              </div>
            </div>
          )}

          {/* Zone de signature */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {signatureType === 'draw' ? 'Dessinez votre signature' : 'Prévisualisation'}
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <canvas
                ref={canvasRef}
                width={500}
                height={200}
                className="w-full h-32 border border-gray-200 rounded cursor-crosshair bg-white"
                onMouseDown={signatureType === 'draw' ? startDrawing : undefined}
                onMouseMove={signatureType === 'draw' ? draw : undefined}
                onMouseUp={signatureType === 'draw' ? stopDrawing : undefined}
                onMouseLeave={signatureType === 'draw' ? stopDrawing : undefined}
              />
              
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {signatureType === 'draw' 
                    ? 'Cliquez et faites glisser pour dessiner votre signature'
                    : 'Prévisualisez votre signature saisie'
                  }
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearSignature}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <RotateCcw size={16} className="mr-1" />
                  Effacer
                </Button>
              </div>
            </div>
          </div>

          {/* Informations signataire */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom du signataire *
              </label>
              <Input
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Nom complet"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fonction (optionnel)
              </label>
              <Input
                value={signerTitle}
                onChange={(e) => setSignerTitle(e.target.value)}
                placeholder="Directeur, Gérant..."
              />
            </div>
          </div>

          {/* Conditions d'acceptation */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Conditions d'acceptation</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• En signant ce devis, vous acceptez les conditions générales de vente</p>
              <p>• Vous confirmez avoir lu et approuvé l'ensemble des prestations détaillées</p>
              <p>• Cette signature vaut pour validation et engagement contractuel</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSignature}
              disabled={loading || (signatureType === 'draw' && isEmpty) || !signerName.trim()}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signature en cours...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Signer le devis
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}