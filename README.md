# BlackWeek 2025 Poster Customizer

A web application that allows users to customize a BlackWeek 2025 poster by adding their headshot and emoji.

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Add your poster image:
   - Place your BlackWeek 2025 poster image in `src/assets/blackweek-poster.png`
   - Then update `src/App.tsx` to import it:
   ```typescript
   import posterImage from './assets/blackweek-poster.png';
   // Remove or comment out the placeholder import
   ```

3. (Optional) Add Replicate API key for AI stylization:
   - Update `src/App.tsx` to pass your API key:
   ```typescript
   const imageProcessor = useRef(new ImageProcessingService('your-replicate-api-key'));
   ```

4. Run the development server:
```bash
npm run dev
```

## Features

- **Image Upload**: Drag-and-drop or click to upload headshot
- **Background Removal**: Automatic background removal using MediaPipe
- **AI Stylization**: Converts headshot to cartoon/sketch style (requires Replicate API key)
- **Emoji Selection**: Choose from 20 predefined emojis
- **Real-time Preview**: See your customized poster as you build it
- **High-Quality Download**: Export poster as JPG

## Technologies Used

- React with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Fabric.js for canvas manipulation
- MediaPipe for background removal
- Replicate API for AI stylization (optional)