export const createPlaceholderPoster = (): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  canvas.width = 800;
  canvas.height = 1066;
  
  // White background
  ctx.fillStyle = '#f5f5f5';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Grid pattern
  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 1;
  for (let i = 0; i < canvas.width; i += 50) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, canvas.height);
    ctx.stroke();
  }
  for (let i = 0; i < canvas.height; i += 50) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(canvas.width, i);
    ctx.stroke();
  }
  
  // Title
  ctx.fillStyle = '#000';
  ctx.font = 'bold 60px Arial';
  ctx.fillText('BLACKWEEK', 100, 150);
  ctx.font = 'italic 40px Arial';
  ctx.fillText('2025', 600, 250);
  
  // Economic forum & culture festival
  ctx.fillStyle = '#333';
  ctx.fillRect(100, 600, 300, 80);
  ctx.fillStyle = '#fff';
  ctx.font = '30px Arial';
  ctx.fillText('economic forum', 120, 650);
  
  ctx.fillStyle = '#000';
  ctx.font = 'bold 80px Arial';
  ctx.fillText('CULTURE', 150, 780);
  
  ctx.font = 'italic 60px Arial';
  ctx.fillText('festival', 250, 880);
  
  // Date and location
  ctx.fillStyle = '#000';
  ctx.font = 'bold 40px Arial';
  ctx.fillText('Oct6-9 ★ NYC', 200, 1000);
  
  return canvas.toDataURL();
};