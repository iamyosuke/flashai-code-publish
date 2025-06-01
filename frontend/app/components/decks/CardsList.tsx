"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Trash, Clock, CheckCircle, AlertCircle, Check, X } from "lucide-react";
import { Card } from "@/lib/types";
import { useState } from "react";

interface CardsListProps {
  cards: Card[];
  onEdit: (cardId: string, data: { front: string; back: string }) => void;
  onDelete: (cardId: string) => void;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "mastered":
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case "learning":
      return <Clock className="w-4 h-4 text-orange-500" />;
    case "new":
      return <AlertCircle className="w-4 h-4 text-blue-500" />;
    default:
      return <Clock className="w-4 h-4 text-gray-500" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "mastered":
      return "bg-green-100 text-green-800 border-green-200";
    case "learning":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "new":
      return "bg-blue-100 text-blue-800 border-blue-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export function CardsList({ cards, onEdit, onDelete }: CardsListProps) {
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ front: "", back: "" });

  const handleEditStart = (card: Card) => {
    setEditingCardId(card.id);
    setEditForm({ front: card.front, back: card.back });
  };

  const handleEditSave = async () => {
    if (editingCardId) {
      await onEdit(editingCardId, editForm);
      setEditingCardId(null);
      setEditForm({ front: "", back: "" });
    }
  };

  const handleEditCancel = () => {
    setEditingCardId(null);
    setEditForm({ front: "", back: "" });
  };

  if (cards.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 gradient-bg rounded-full flex items-center justify-center mx-auto mb-4 floating-animation">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">No cards yet</h3>
        <p className="text-gray-600">Start adding flashcards to build your deck</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cards Grid */}
      <div className="grid gap-4">
        {cards.map((card, index) => {
          const isEditing = editingCardId === card.id;
          
          return (
            <div 
              key={card.id} 
              className="glass-effect rounded-2xl p-6 card-hover fade-in-up"
              style={{animationDelay: `${index * 0.1}s`}}
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Card Content */}
                <div className="flex-1 grid md:grid-cols-2 gap-4">
                  {/* Front */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 gradient-bg-success rounded-lg flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-gray-600">Front</span>
                    </div>
                    <div className="glass-effect rounded-xl p-4 min-h-[80px] flex items-center">
                      {isEditing ? (
                        <div className="w-full">
                          <Textarea
                            value={editForm.front}
                            onChange={(e) => setEditForm(prev => ({ ...prev, front: e.target.value }))}
                            className="w-full min-h-[60px] resize-none border-2 border-blue-200 rounded-lg p-3 bg-white/80 backdrop-blur-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 text-gray-800 font-medium placeholder-gray-400"
                            placeholder="Front of the card..."
                            autoFocus
                          />
                        </div>
                      ) : (
                        <p className="text-gray-800 font-medium">{card.front}</p>
                      )}
                    </div>
                  </div>

                  {/* Back */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 gradient-bg-warning rounded-lg flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-gray-600">Back</span>
                    </div>
                    <div className="glass-effect rounded-xl p-4 min-h-[80px] flex items-center">
                      {isEditing ? (
                        <div className="w-full">
                          <Textarea
                            value={editForm.back}
                            onChange={(e) => setEditForm(prev => ({ ...prev, back: e.target.value }))}
                            className="w-full min-h-[60px] resize-none border-2 border-orange-200 rounded-lg p-3 bg-white/80 backdrop-blur-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-200 focus:outline-none transition-all duration-200 text-gray-800 placeholder-gray-400"
                            placeholder="Back of the card..."
                          />
                        </div>
                      ) : (
                        <p className="text-gray-800">{card.back}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Meta & Actions */}
                <div className="flex lg:flex-col items-center lg:items-end gap-4 lg:gap-3">
                  {/* Status */}
                  <div className="flex items-center gap-2">
                    {getStatusIcon(card.status)}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(card.status)}`}>
                      {card.status || "new"}
                    </span>
                  </div>

                  {/* Last Review */}
                  <div className="text-sm text-gray-600 text-center lg:text-right">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{card.lastReview ? new Date(card.lastReview).toLocaleDateString() : "Not reviewed"}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl border-2 border-green-300 text-green-600 hover:bg-green-50"
                          onClick={handleEditSave}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl border-2 border-gray-300 text-gray-600 hover:bg-gray-50"
                          onClick={handleEditCancel}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl border-2 border-blue-300 text-blue-600 hover:bg-blue-50"
                          onClick={() => handleEditStart(card)}
                        >
                          <Pencil className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl border-2 border-red-300 text-red-600 hover:bg-red-50"
                          onClick={() => onDelete(card.id)}
                        >
                          <Trash className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="glass-effect rounded-2xl p-6 mt-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{cards.length}</div>
              <div className="text-sm text-gray-600">Total Cards</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {cards.filter(c => c.status === "mastered").length}
              </div>
              <div className="text-sm text-gray-600">Mastered</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {cards.filter(c => c.status === "learning").length}
              </div>
              <div className="text-sm text-gray-600">Learning</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {cards.filter(c => c.status === "new" || !c.status).length}
              </div>
              <div className="text-sm text-gray-600">New</div>
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>
                {Math.round((cards.filter(c => c.status === "mastered").length / cards.length) * 100)}% Complete
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
