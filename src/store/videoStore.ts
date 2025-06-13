import { create } from 'zustand';
import { VideoData, ThumbnailElement, ImageControls, StyleProfile, Dictionary, Participant, CreatorType } from '../types';

interface GenerationSettings {
  clickbaitIntensity: number;
  variationCount: 1 | 2 | 3;
  creativeDirection: 'original' | 'dynamic' | 'artistic';
  costOptimization: 'standard' | 'economy' | 'premium';
  customKeywords?: string;
  enableFaceSwap?: boolean;
}

interface VideoStore {
  videoData: VideoData | null;
  thumbnailElements: ThumbnailElement[];
  contextSummary: string | null;
  dictionary: { word: string; weight: number }[] | null;
  selectedReferenceThumbnails: string[];
  styleConsistency: number;
  imageControls: ImageControls;
  participants: Participant[];
  creatorType: CreatorType | null;
  generationSettings: GenerationSettings;
  styleProfile: StyleProfile | null;
  setVideoData: (data: VideoData | null) => void;
  setThumbnailElements: (elements: ThumbnailElement[]) => void;
  setContextSummary: (summary: string | null) => void;
  setDictionary: (dict: { word: string; weight: number }[] | null) => void;
  setSelectedReferenceThumbnails: (thumbnails: string[]) => void;
  setStyleConsistency: (value: number) => void;
  updateImageControls: (controls: Partial<ImageControls>) => void;
  setParticipants: (participants: Participant[]) => void;
  setCreatorType: (type: CreatorType | null) => void;
  updateGenerationSettings: (settings: Partial<GenerationSettings>) => void;
  setStyleProfile: (profile: StyleProfile | null) => void;
  addParticipant: (participant: Participant) => void;
  removeParticipant: (index: number) => void;
  updateParticipant: (index: number, participant: Partial<Participant>) => void;
  generateThumbnails: () => Promise<void>;
}

export const useVideoStore = create<VideoStore>((set) => ({
  videoData: null,
  thumbnailElements: [],
  contextSummary: null,
  dictionary: null,
  selectedReferenceThumbnails: [],
  styleConsistency: 100,
  imageControls: {
    rotation: 0,
    opacity: 1,
    scale: 1,
    removeBg: false,
    filters: {
      brightness: 100,
      contrast: 100,
      blur: 0
    }
  },
  participants: [],
  creatorType: null,
  generationSettings: {
    clickbaitIntensity: 5,
    variationCount: 1,
    creativeDirection: 'original',
    costOptimization: 'standard',
    customKeywords: '',
    enableFaceSwap: false
  },
  styleProfile: null,
  setVideoData: (data) => set({ videoData: data }),
  setThumbnailElements: (elements) => set({ thumbnailElements: elements }),
  setContextSummary: (summary) => set({ contextSummary: summary }),
  setDictionary: (dict) => set({ dictionary: dict }),
  setSelectedReferenceThumbnails: (thumbnails) => set({ selectedReferenceThumbnails: thumbnails }),
  setStyleConsistency: (value) => set({ styleConsistency: value }),
  updateImageControls: (controls) => set((state) => ({
    imageControls: { ...state.imageControls, ...controls }
  })),
  setParticipants: (participants) => set({ participants }),
  setCreatorType: (type) => set({ creatorType: type }),
  updateGenerationSettings: (settings) => set((state) => ({
    generationSettings: { ...state.generationSettings, ...settings }
  })),
  setStyleProfile: (profile) => set({ styleProfile: profile }),
  addParticipant: (participant) => set((state) => ({
    participants: [...state.participants, participant]
  })),
  removeParticipant: (index) => set((state) => ({
    participants: state.participants.filter((_, i) => i !== index)
  })),
  updateParticipant: (index, updates) => set((state) => ({
    participants: state.participants.map((participant, i) => 
      i === index ? { ...participant, ...updates } : participant
    )
  })),
  generateThumbnails: async () => {
    // Implementation would go here
    // This is a placeholder for the actual implementation
    console.log('Generate thumbnails called');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
  }
}));