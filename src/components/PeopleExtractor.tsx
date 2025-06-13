import React, { useState } from 'react';
import { useVideoStore } from '../store/videoStore';
import { UserPlus, Users, X, ChevronUp, ChevronDown, Camera, Loader, Move } from 'lucide-react';
import CollapsibleSection from './CollapsibleSection';

interface ExtractedPerson {
  id: string;
  imageUrl: string;
  name?: string;
  position?: 'left' | 'center' | 'right';
  emphasis?: 'primary' | 'secondary' | 'background';
}

const PeopleExtractor: React.FC = () => {
  const { videoData, participants, addParticipant, removeParticipant, updateParticipant } = useVideoStore();
  const [extractedPeople, setExtractedPeople] = useState<ExtractedPerson[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  
  // Mock function for extracting people - would connect to AI backend in production
  const extractPeopleFromVideo = async () => {
    if (!videoData) return;
    
    setIsExtracting(true);
    setExtractionProgress(0);
    
    try {
      // Simulate API call with progress updates
      for (let i = 0; i < 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setExtractionProgress(prev => prev + 0.2);
      }
      
      // Mock result - in production this would come from the AI service
      const mockExtractedPeople: ExtractedPerson[] = [
        {
          id: `extracted-${Date.now()}-1`,
          imageUrl: 'https://placehold.co/200x300/3b3b3b/FFFFFF?text=Person+1',
          name: `Person from ${videoData.title.split(' ').slice(0, 2).join(' ')}...`,
        },
        {
          id: `extracted-${Date.now()}-2`,
          imageUrl: 'https://placehold.co/200x300/3b3b3b/FFFFFF?text=Person+2',
          name: 'Secondary Person',
        }
      ];
      
      setExtractedPeople(prev => [...prev, ...mockExtractedPeople]);
    } catch (error) {
      console.error("Failed to extract people:", error);
    } finally {
      setIsExtracting(false);
      setExtractionProgress(0);
    }
  };
  
  const handleAddToCanvas = (person: ExtractedPerson) => {
    addParticipant({
      id: person.id,
      name: person.name || 'Unnamed Person',
      imageUrl: person.imageUrl,
      position: person.position || 'center',
      emphasis: person.emphasis || 'primary'
    });
  };
  
  const handleDragStart = (person: ExtractedPerson, e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({
      type: 'person',
      id: person.id,
      imageUrl: person.imageUrl,
      name: person.name
    }));
    
    // Create a drag preview image
    const preview = new Image();
    preview.src = person.imageUrl;
    e.dataTransfer.setDragImage(preview, 50, 50);
  };

  return (
    <div className="space-y-4">
      <CollapsibleSection id="extract-people" title="Extract People from Video" defaultExpanded={true}>
        <p className="text-sm text-gray-400 mb-4">
          Automatically extract people from your video to use in your thumbnail
        </p>
        
        <button
          onClick={extractPeopleFromVideo}
          disabled={isExtracting || !videoData}
          className="flex items-center justify-center w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExtracting ? (
            <>
              <Loader className="h-5 w-5 mr-2 animate-spin" />
              Extracting People... {Math.round(extractionProgress * 100)}%
            </>
          ) : (
            <>
              <Camera className="h-5 w-5 mr-2" />
              Extract People from Video
            </>
          )}
        </button>
        
        {extractedPeople.length > 0 && (
          <div className="mt-6">
            <h3 className="text-md font-medium mb-3">Extracted People</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {extractedPeople.map(person => (
                <div 
                  key={person.id}
                  className="group relative bg-gray-800 rounded-lg overflow-hidden"
                  draggable
                  onDragStart={(e) => handleDragStart(person, e)}
                >
                  <img 
                    src={person.imageUrl} 
                    alt={person.name || 'Extracted person'} 
                    className="w-full h-40 object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300"></div>
                  
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 p-2">
                    <p className="text-sm text-white truncate">{person.name || 'Unnamed Person'}</p>
                  </div>
                  
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <button
                      onClick={() => handleAddToCanvas(person)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-md text-sm flex items-center"
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Add to Canvas
                    </button>
                  </div>
                  
                  <div className="absolute top-2 right-2 text-white bg-black bg-opacity-50 rounded-full p-1 group-hover:opacity-100 opacity-0 transition-all duration-300">
                    <Move className="h-4 w-4" />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Drag and drop people onto the canvas or use the Add button
            </p>
          </div>
        )}
      </CollapsibleSection>
      
      <CollapsibleSection id="current-participants" title="Current Participants" defaultExpanded={true}>
        <p className="text-sm text-gray-400 mb-4">
          Manage and position people in your thumbnail
        </p>
        
        {participants.length > 0 ? (
          <div className="space-y-3">
            {participants.map((participant, index) => (
              <div key={participant.id} className="flex items-center justify-between bg-gray-700 bg-opacity-50 rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  {participant.imageUrl ? (
                    <div className="h-12 w-12 rounded-md overflow-hidden">
                      <img src={participant.imageUrl} alt={participant.name} className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="h-12 w-12 bg-gray-600 rounded-md flex items-center justify-center">
                      <Users className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <span className="font-medium">{participant.name}</span>
                    <div className="flex text-xs text-gray-400 mt-1">
                      <span className="mr-2">Position: {participant.position}</span>
                      <span>Emphasis: {participant.emphasis}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={participant.position}
                    onChange={(e) => updateParticipant(index, { position: e.target.value as 'left' | 'center' | 'right' })}
                    className="bg-gray-800 border border-gray-600 rounded-md text-xs px-2 py-1"
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                  <select
                    value={participant.emphasis}
                    onChange={(e) => updateParticipant(index, { emphasis: e.target.value as 'primary' | 'secondary' | 'background' })}
                    className="bg-gray-800 border border-gray-600 rounded-md text-xs px-2 py-1"
                  >
                    <option value="primary">Primary</option>
                    <option value="secondary">Secondary</option>
                    <option value="background">Background</option>
                  </select>
                  <button
                    onClick={() => removeParticipant(index)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 bg-gray-800 bg-opacity-30 rounded-lg">
            <Users className="h-8 w-8 mx-auto text-gray-500 mb-2" />
            <p className="text-gray-400">No participants added yet</p>
            <p className="text-xs text-gray-500 mt-1">Extract people from your video or add them manually</p>
          </div>
        )}
      </CollapsibleSection>
      
      <CollapsibleSection id="add-participant" title="Add Participant Manually">
        <AddParticipantForm onAdd={addParticipant} />
      </CollapsibleSection>
    </div>
  );
};

// Separate component for adding participants manually
const AddParticipantForm: React.FC<{ onAdd: (participant: any) => void }> = ({ onAdd }) => {
  const [newParticipant, setNewParticipant] = useState<{
    name: string;
    position: 'left' | 'center' | 'right';
    emphasis: 'primary' | 'secondary' | 'background';
  }>({
    name: '',
    position: 'center',
    emphasis: 'primary'
  });

  const handleAddParticipant = () => {
    if (!newParticipant.name.trim()) return;
    
    onAdd({
      id: `participant-${Date.now()}`,
      name: newParticipant.name,
      position: newParticipant.position,
      emphasis: newParticipant.emphasis
    });
    
    // Reset form
    setNewParticipant({
      name: '',
      position: 'center',
      emphasis: 'primary'
    });
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-400 mb-2">
        Manually add a participant to your thumbnail
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={newParticipant.name}
          onChange={(e) => setNewParticipant({ ...newParticipant, name: e.target.value })}
          placeholder="Participant name"
          className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white flex-grow"
        />
        <select
          value={newParticipant.position}
          onChange={(e) => setNewParticipant({ ...newParticipant, position: e.target.value as 'left' | 'center' | 'right' })}
          className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
        <select
          value={newParticipant.emphasis}
          onChange={(e) => setNewParticipant({ ...newParticipant, emphasis: e.target.value as 'primary' | 'secondary' | 'background' })}
          className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
        >
          <option value="primary">Primary</option>
          <option value="secondary">Secondary</option>
          <option value="background">Background</option>
        </select>
      </div>
      <button
        onClick={handleAddParticipant}
        disabled={!newParticipant.name.trim()}
        className="flex items-center justify-center w-full px-4 py-2 mt-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <UserPlus className="h-4 w-4 mr-2" />
        Add Participant
      </button>
    </div>
  );
};

export default PeopleExtractor; 