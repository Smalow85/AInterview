/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { create } from "zustand";
import { ResponseCard } from "../types/response-card";
import { saveCardsToDB, fetchCardsBySessionId, fetchFavoriteCards, clearCardsBySessionId } from "./storage/card-storage";
import { getCurrentUserSettingsAsync } from "./store-settings";

interface StoreCardState {
  maxCards: number;
  cards: ResponseCard[];
  favoriteCards: ResponseCard[];
  addCard: (card: ResponseCard) => void;
  clearCards: (sesionId: string) => Promise<void>;
  fetchCards: () => Promise<void>;
  fetchFavoriteCards: () => Promise<void>;
  updateFavoriteStatus: (id: string, favorite: number) => Promise<void>;
  removeFromFavoriteCards: (id: string, favorite: number) => Promise<void>;
  loading: boolean;
  updateCardInStore: (id: string) => void;
}

export const useCardStore = create<StoreCardState>((set) => ({
  maxCards: 4,
  cards: [],
  favoriteCards: [],
  loading: true,
  addCard: (card) => {
    saveCardsToDB(card);
    set((state) => {
      const prevLog = state.cards.at(-1);
      if (prevLog && prevLog.data === card.data) {
        return {
          cards: [
            ...state.cards.slice(0, -1),
            { ...prevLog },
          ],
        };
      }
      return {
        cards: [
          ...state.cards.slice(-(state.maxCards - 1)),
          { ...card, count: 1 },
        ],
      };
    });
  },
  fetchCards: async () => {
    try {
      const settings = await getCurrentUserSettingsAsync();
      const response = await fetchCardsBySessionId(settings.activeSessionId);
      console.log(response)
      set({ cards: response, loading: false });
    } catch (error) {
      console.error('Error fetching messages:', error);
      set({ loading: false });
    }
  },
  fetchFavoriteCards: async () => {
    try {
      const response = await fetchFavoriteCards();
      console.log(response)
      set({ favoriteCards: response, loading: false });
    } catch (error) {
      console.error('Error fetching messages:', error);
      set({ loading: false });
    }
  },
  updateFavoriteStatus: async (id, favorite) => {
    set((state) => {
      const index = state.cards.findIndex((card) => card.id === id);
      if (index === -1) return {};

      const updatedCard = { ...state.cards[index], favorite };
      const updatedCards = [...state.cards];
      updatedCards[index] = updatedCard;
      saveCardsToDB(updatedCard);
      return { cards: updatedCards };
    });
  },
  removeFromFavoriteCards: async (id, favorite) => {
    set((state) => {
      const index = state.favoriteCards.findIndex((card) => card.id === id);
      if (index === -1) return {};

      const updatedCard = { ...state.favoriteCards[index], favorite };
      const updatedCards = [...state.favoriteCards];
      updatedCards[index] = updatedCard;
      saveCardsToDB(updatedCard);
      return { favoriteCards: updatedCards };
    });
  },
  clearCards: async (sesionId) => {
    try {
      clearCardsBySessionId(sesionId);
      set({ cards: [], loading: false });
    } catch (error) {
      console.error('Error fetching messages:', error);
      set({ loading: false });
    }
  },
  updateCardInStore: (id: string) =>
    set((state) => ({
      cards: state.cards.map((card) => (card.id === id ? { ...card, expanded: !card.expanded } : card)),
    })),
}));