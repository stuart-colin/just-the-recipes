import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import RecipeDetail from './RecipeDetail'; // Import RecipeDetail
import { slugify } from '@/lib/utils'; // This will now correctly resolve to utils.ts

const RecipeUploadForm = ({ onSubmit }) => {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [previewData, setPreviewData] = useState(null); // State for parsed recipe data for preview

  // This function primarily sets the file state for submission and UI feedback
  const handleFileChangeForSubmission = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type === "application/json") {
        setFile(selectedFile);
        setFileName(selectedFile.name);
        // Clear previous preview and error when a new file is selected for submission
        setPreviewData(null);
        setError('');
      } else {
        setFile(null);
        setFileName('');
        setPreviewData(null);
        setError('Please select a valid JSON file.');
      }
    } else {
      // If no file is selected (e.g., user cancels file dialog)
      setFile(null);
      setFileName('');
      setPreviewData(null);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!file || !previewData) { // Ensure previewData is also available for submission
      setError('Please select a file and ensure it is parsed correctly for preview.');
      return;
    }

    // The file is already read for previewData, but we re-read here to ensure
    // the most up-to-date file content is used if the user somehow changed it
    // without re-triggering the preview (unlikely with standard file inputs).
    // More importantly, this is where we add _originalFilenameSlug.
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const recipeData = JSON.parse(event.target.result);

        // Add _originalFilenameSlug based on the file selected for submission
        const originalNameWithoutExtension = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        const originalFilenameSlug = slugify(originalNameWithoutExtension);
        recipeData._originalFilenameSlug = originalFilenameSlug;

        const success = await onSubmit(recipeData);
        if (success) {
          setFile(null);
          setFileName('');
          setPreviewData(null); // Clear preview on successful submission
        }
      } catch (parseError) {
        console.error("Error parsing JSON during submit:", parseError);
        setError('Invalid JSON file. Please check the file content and format.');
      }
    };
    reader.readAsText(file);
  };

  const handleFilePreview = (selectedFileForPreview) => {
    if (selectedFileForPreview && selectedFileForPreview.type === "application/json") {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsedData = JSON.parse(event.target.result);
          if (parsedData && parsedData.title) { // Basic check for a recipe-like structure
            setPreviewData(parsedData);
            setError(''); // Clear any previous errors
          } else {
            setPreviewData(null);
            setError('The JSON file does not seem to be a valid recipe format (e.g., missing title).');
          }
        } catch (parseError) {
          console.error("Error parsing JSON for preview:", parseError);
          setPreviewData(null);
          setError('Invalid JSON file. Please check the file content and format.');
        }
      };
      reader.readAsText(selectedFileForPreview);
    }
  };

  // Combined handler for file input change
  const handleFileInputChange = (e) => {
    const currentFile = e.target.files[0];
    handleFileChangeForSubmission(e); // Handles setting file for submission, filename, basic validation

    if (currentFile && currentFile.type === "application/json") {
      handleFilePreview(currentFile); // Handles parsing and setting previewData
    } else {
      setPreviewData(null); // Clear preview if file is not JSON or selection is cleared
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="recipeFile">Upload Recipe JSON File</Label>
        <Input id="recipeFile" type="file" accept=".json" onChange={handleFileInputChange} className="mt-1" />
        {fileName && <p className="text-sm text-muted-foreground mt-1 pt-2">Selected: {fileName}</p>}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}

      {previewData && (
        <div className="mt-3 border-t pt-3">
          <h3 className="text-lg font-semibold mb-3">Recipe Preview</h3>
          <RecipeDetail selectedRecipe={previewData} onClose={null} />
        </div>
      )}

      <Button type="submit" disabled={!file || !previewData || !!error} className="mt-4">
        Upload and Submit Recipe
      </Button>
    </form>
  );
};

export default RecipeUploadForm;
