# FLUX Kontext Pro Integration

This codebase now includes integration with the FLUX Kontext Pro model from Replicate for advanced text-based image editing.

## Setup

1. Ensure your `REPLICATE_API_TOKEN` is set in your environment variables
2. Start the backend server: `cd backend && npm start`
3. The frontend will automatically use the new endpoints

## Usage

### Using the Service Directly

```typescript
import { imageEditingService } from './services/imageEditingService';

// Edit an image with a text prompt
const editedImageUrl = await imageEditingService.editImage(
  imageDataUrl,  // base64 or URL
  "turn this into a watercolor painting",
  { seed: 12345 } // optional, for reproducible results
);
```

### Using the React Component

```typescript
import { ImageEditor } from './components/ImageEditor';

// In your app
<ImageEditor />
```

### API Endpoint

POST `/api/edit-image`

Request body:
```json
{
  "imageUrl": "base64 or URL of input image",
  "prompt": "description of the edit to make",
  "seed": 12345  // optional
}
```

Response:
```json
{
  "success": true,
  "outputUrl": "URL of the edited image",
  "predictionId": "replicate-prediction-id"
}
```

## Example Prompts

- "make it a watercolor painting"
- "add a sunset background"
- "turn into a pencil sketch"
- "make it look like a vintage photograph"
- "add snow to the scene"
- "change the lighting to golden hour"
- "make it look like an oil painting"
- "transform into pixel art"

## Error Handling

The service includes comprehensive error handling:
- Missing required parameters
- API failures
- Timeout handling
- Invalid responses

## Performance Notes

- Image editing typically takes 10-30 seconds
- The backend polls for completion status
- Consider implementing webhooks for production use
- Large images may take longer to process