// download.js - Trang tải ảnh từ localStorage

window.addEventListener('DOMContentLoaded', () => {
  const statusDiv = document.getElementById('downloadStatus');
  const continueBtn = document.getElementById('continueBtn');
  const mainArea = document.getElementById('mainDownloadArea');
  const data = localStorage.getItem('photobooth_images');
  let images = [];
  if (data) {
    images = JSON.parse(data);
  }
  // Số ảnh tối thiểu để cho phép chọn khung (có thể chỉnh 2, 3, 4 tuỳ nhu cầu)
  const minImages = 2;
  if (!images || images.length < minImages) {
    mainArea.style.display = 'none';
    statusDiv.innerHTML = `Bạn đã chụp <b>${images.length || 0}</b> ảnh. Hãy chụp đủ ${minImages} ảnh để tiếp tục!`;
    continueBtn.style.display = 'block';
    continueBtn.onclick = () => {
      window.location.href = 'index.html';
    };
    return;
  } else {
    mainArea.style.display = '';
    statusDiv.innerHTML = `Bạn đã chụp <b>${images.length}</b> ảnh. Hãy chọn khung và tải về nhé!`;
    continueBtn.style.display = 'none';
  }
  const frameThumbs = document.querySelectorAll('.frame-thumb');
  let selectedFrame = null;
  frameThumbs.forEach(frame => {
    frame.addEventListener('click', () => {
      selectedFrame = frame.getAttribute('src');
      frameThumbs.forEach(f => f.classList.remove('selected'));
      frame.classList.add('selected');
      updatePreview();
    });
  });

  // Sticker kéo thả
  const stickerThumbs = document.querySelectorAll('.sticker-thumb');
  let stickers = [];
  stickerThumbs.forEach(sticker => {
    sticker.addEventListener('dragstart', e => {
      e.dataTransfer.setData('stickerSrc', sticker.getAttribute('src'));
    });
  });

  const previewArea = document.getElementById('previewArea');
  previewArea.addEventListener('dragover', e => e.preventDefault());
  previewArea.addEventListener('drop', e => {
    e.preventDefault();
    const src = e.dataTransfer.getData('stickerSrc');
    if (src) {
      const img = document.createElement('img');
      img.src = src;
      img.className = 'draggable-sticker';
      img.style.position = 'absolute';
      const rect = previewArea.getBoundingClientRect();
      let x = e.clientX - rect.left;
      let y = e.clientY - rect.top;
      // Giới hạn sticker trong preview
      x = Math.max(0, Math.min(x, previewArea.offsetWidth - 48));
      y = Math.max(0, Math.min(y, previewArea.offsetHeight - 48));
      img.style.left = x + 'px';
      img.style.top = y + 'px';
      makeStickerDraggable(img, previewArea);
      previewArea.appendChild(img);
      stickers.push(img);
    }
  });

  function makeStickerDraggable(sticker, container) {
    let offsetX, offsetY, isDragging = false;
    sticker.addEventListener('mousedown', e => {
      isDragging = true;
      offsetX = e.offsetX;
      offsetY = e.offsetY;
      sticker.style.zIndex = 10;
    });
    document.addEventListener('mousemove', e => {
      if (!isDragging) return;
      const rect = container.getBoundingClientRect();
      let x = e.clientX - rect.left - offsetX;
      let y = e.clientY - rect.top - offsetY;
      // Giới hạn sticker trong preview
      x = Math.max(0, Math.min(x, container.offsetWidth - sticker.offsetWidth));
      y = Math.max(0, Math.min(y, container.offsetHeight - sticker.offsetHeight));
      sticker.style.left = x + 'px';
      sticker.style.top = y + 'px';
    });
    document.addEventListener('mouseup', () => {
      isDragging = false;
      sticker.style.zIndex = 1;
    });
  }

  // Đường dẫn khung mặc định số 1
  const defaultFrame = 'frame1.png';

  // Vị trí và kích thước 4 ô ảnh trên khung (theo tỉ lệ file bạn gửi)
  // (Cần đo lại chính xác nếu muốn căn chuẩn)
  const photoSlots = [
    { x: 44, y: 44, w: 593, h: 384 },
    { x: 44, y: 472, w: 593, h: 384 },
    { x: 44, y: 900, w: 593, h: 384 },
    { x: 44, y: 1328, w: 593, h: 384 }
  ];

  // Kích thước preview nhỏ hơn, ví dụ 340x1024 (tỉ lệ 1:2 so với khung gốc)
  const previewWidth = 340;
  const previewHeight = 1024;
  const scale = previewWidth / 681;
  const previewSlots = photoSlots.map(slot => ({
    x: Math.round(slot.x * scale),
    y: Math.round(slot.y * scale),
    w: Math.round(slot.w * scale),
    h: Math.round(slot.h * scale)
  }));

  function updatePreview() {
    previewArea.innerHTML = '';
    const canvas = document.createElement('canvas');
    canvas.width = previewWidth;
    canvas.height = previewHeight;
    const ctx = canvas.getContext('2d');
    const frameImg = new Image();
    frameImg.src = defaultFrame;
    frameImg.onload = () => {
      ctx.drawImage(frameImg, 0, 0, previewWidth, previewHeight);
      let loaded = 0;
      const imgObjs = images.map(src => {
        const img = new Image();
        img.src = src;
        return img;
      });
      imgObjs.forEach((img, i) => {
        img.onload = () => {
          loaded++;
          if (loaded === imgObjs.length) {
            imgObjs.forEach((img, idx) => {
              if (previewSlots[idx]) {
                ctx.drawImage(img, previewSlots[idx].x, previewSlots[idx].y, previewSlots[idx].w, previewSlots[idx].h);
              }
            });
            previewArea.appendChild(canvas);
          }
        };
      });
    };
    frameImg.onerror = () => {
      alert('Không thể tải file khung (frame1.png). Hãy kiểm tra lại file này!');
    };
    // Nếu không có ảnh hoặc chưa đủ 4 ảnh thì báo lỗi
    if (!images || images.length < 4) {
      alert('Bạn cần chụp đủ 4 ảnh để tải về!');
      return;
    }
  }

  // Hiển thị preview ngay khi load trang
  updatePreview();

  // Nút tải về
  document.getElementById('downloadBtn').onclick = () => {
    // Ghép 4 ảnh vào khung mặc định và tải về
    const canvas = document.createElement('canvas');
    canvas.width = 681;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d');
    const frameImg = new Image();
    frameImg.src = defaultFrame;
    frameImg.onload = () => {
      ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
      let loaded = 0;
      const imgObjs = images.map(src => {
        const img = new Image();
        img.src = src;
        return img;
      });
      imgObjs.forEach((img, i) => {
        img.onload = () => {
          loaded++;
          if (loaded === imgObjs.length) {
            imgObjs.forEach((img, idx) => {
              if (photoSlots[idx]) {
                ctx.drawImage(img, photoSlots[idx].x, photoSlots[idx].y, photoSlots[idx].w, photoSlots[idx].h);
              }
            });
            // Vẽ sticker nếu có
            stickers.forEach(sticker => {
              const x = parseInt(sticker.style.left) || 0;
              const y = parseInt(sticker.style.top) || 0;
              ctx.drawImage(sticker, x, y, 48, 48);
            });
            const a = document.createElement('a');
            a.href = canvas.toDataURL('image/png');
            a.download = `photobooth_all.png`;
            a.click();
          }
        };
      });
    };
  };

  // Nút xóa tất cả ảnh
  document.getElementById('clearBtn').onclick = () => {
    localStorage.removeItem('photobooth_images');
    location.reload();
  };
});
