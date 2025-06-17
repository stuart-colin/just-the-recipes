import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import RecipeUploadForm from './RecipeUploadForm';
import RecipeManualForm from './RecipeManualForm'; // We'll create this as a placeholder

const AddRecipeDialogContent = ({ onClose }) => {
  const [activeView, setActiveView] = useState('upload'); // 'upload' or 'manual'
  const [submissionStatus, setSubmissionStatus] = useState({ message: '', type: '' }); // 'success' or 'error'

  const handleRecipeSubmit = async (recipeData) => {
    setSubmissionStatus({ message: '', type: '' }); // Clear previous status
    try {
      const response = await fetch('/api/add-recipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recipeData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit recipe');
      }

      setSubmissionStatus({ message: 'Recipe submitted successfully!', type: 'success' });
      // Optionally, you could call onClose after a short delay or if the user clicks a "Done" button
      // onClose(); // Example: close modal on success
      return true;
    } catch (error) {
      console.error("Error submitting recipe:", error);
      setSubmissionStatus({ message: error.message || 'An error occurred.', type: 'error' });
      return false;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-2 mb-4">
        <Button variant={activeView === 'upload' ? 'default' : 'outline'} onClick={() => setActiveView('upload')}>
          Upload JSON
        </Button>
        <Button variant={activeView === 'manual' ? 'default' : 'outline'} onClick={() => setActiveView('manual')}>
          Enter Manually
        </Button>
      </div>

      {submissionStatus.message && (
        <p className={`text-sm p-2 rounded ${submissionStatus.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {submissionStatus.message}
        </p>
      )}

      {activeView === 'upload' && <RecipeUploadForm onSubmit={handleRecipeSubmit} />}
      {activeView === 'manual' && <RecipeManualForm onSubmit={handleRecipeSubmit} />}
    </div>
  );
};

export default AddRecipeDialogContent;